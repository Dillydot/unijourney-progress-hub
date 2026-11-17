import { createServerFn } from "@tanstack/react-start";
import {
  detailsFromCourseStore,
  examPeriodsFromPage,
  planFromProgrammeStore,
  readEmbeddedJson,
  withDetails,
  type CourseDetails,
} from "./kth";

// kth.se blocks cross-origin requests, so pages are fetched on the server.
// shortcut: per-instance memory cache; move to a shared cache (e.g. a Supabase table) if traffic grows.
const TTL_MS = 12 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; html: Promise<string> }>();

function page(url: string): Promise<string> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.html;
  const html = fetch(url, { headers: { "user-agent": "UniJourney" } }).then((res) => {
    if (!res.ok) throw new Error(`kth.se ${res.status} for ${url}`);
    return res.text();
  });
  cache.set(url, { at: Date.now(), html });
  html.catch(() => cache.delete(url));
  return html;
}

export const getKthExamPeriods = createServerFn({ method: "GET" }).handler(async () =>
  examPeriodsFromPage(
    await page("https://www.kth.se/en/student/studier/schema/tentaperioder-1.278515"),
  ),
);

export const getKthPlan = createServerFn({ method: "GET" })
  .validator((input: { programmeCode: string; term: string }) => {
    // Values end up in a kth.se URL path: allow only real programme codes and terms.
    if (!/^[A-Z0-9]{4,6}$/.test(input.programmeCode) || !/^\d{4}[12]$/.test(input.term))
      throw new Error("Invalid programme code or term");
    return input;
  })
  .handler(async ({ data }) => {
    const html = await page(
      `https://www.kth.se/student/kurser/program/${data.programmeCode}/${data.term}/arskurs1?l=en`,
    );
    const plan = planFromProgrammeStore(readEmbeddedJson(html, "__compressedApplicationStore__"));

    // Examiner and TimeEdit link live on each course page; a failing page just leaves them out.
    const codes = [...new Set(plan.courses.map((c) => c.code))];
    const details: Record<string, CourseDetails> = {};
    for (let i = 0; i < codes.length; i += 6)
      await Promise.all(
        codes.slice(i, i + 6).map(async (code) => {
          try {
            const course = await page(`https://www.kth.se/student/kurser/kurs/${code}?l=en`);
            details[code] = detailsFromCourseStore(
              readEmbeddedJson(course, "__compressedData__DATA"),
            );
          } catch (e) {
            console.warn(`kth.se course ${code}:`, e);
          }
        }),
      );
    return withDetails(plan, details);
  });
