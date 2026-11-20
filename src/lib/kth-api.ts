import { createServerFn } from "@tanstack/react-start";
import {
  kthArticleImageFromPage,
  kthNewsArchive,
  kthNewsThemeUrl,
  kthNewsThemesFromPage,
  kthThemeNewsFromPage,
  latestKthNewsFromPage,
} from "./kth-news";
import { kthSyllabusUrl, programmesFromCatalogue, termsFromProgramme } from "./kth-programmes";
import {
  detailsFromCourseStore,
  examPeriodsFromPage,
  planFromProgrammeStore,
  readEmbeddedJson,
  withDetails,
  withVerifiedPeriods,
  type CourseDetails,
} from "./kth";

// kth.se blocks cross-origin requests, so pages are fetched on the server.
// shortcut: per-instance memory cache; move to a shared cache (e.g. a Supabase table) if traffic grows.
const TTL_MS = 12 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; html: Promise<string> }>();

function page(url: string, ttl = TTL_MS): Promise<string> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < ttl) return hit.html;
  const html = fetch(url, { headers: { "user-agent": "UniJourney" } }).then((res) => {
    if (!res.ok) throw new Error(`kth.se ${res.status} for ${url}`);
    return res.text();
  });
  cache.set(url, { at: Date.now(), html });
  html.catch(() => cache.delete(url));
  return html;
}

export const getLatestKthNews = createServerFn({ method: "GET" })
  .validator((lang: "en" | "sv") => (lang === "sv" ? "sv" : "en"))
  .handler(async ({ data }) =>
    latestKthNewsFromPage(await page(kthNewsArchive(data), 30 * 60_000)),
  );

const newsThemesIndex = "tema-ai-och-manniskan-1.1359813";

export const getKthNewsThemes = createServerFn({ method: "GET" })
  .validator((lang: "en" | "sv") => (lang === "sv" ? "sv" : "en"))
  .handler(async ({ data }) =>
    kthNewsThemesFromPage(await page(kthNewsThemeUrl(data, newsThemesIndex))),
  );

export const getKthThemeNews = createServerFn({ method: "GET" })
  .validator((input: { lang: "en" | "sv"; slug: string }) => {
    if (!/^[a-z0-9-]+-1\.\d{1,12}$/.test(input.slug) || input.slug.length > 100)
      throw new Error("Invalid KTH news theme");
    return { lang: input.lang === "sv" ? ("sv" as const) : ("en" as const), slug: input.slug };
  })
  .handler(async ({ data }) => {
    const stories = kthThemeNewsFromPage(await page(kthNewsThemeUrl(data.lang, data.slug)));
    return Promise.all(
      stories.map(async (story) => {
        if (story.image) return story;
        try {
          const image = kthArticleImageFromPage(await page(story.url));
          return image ? { ...story, image } : story;
        } catch {
          return story;
        }
      }),
    );
  });

export const getKthExamPeriods = createServerFn({ method: "GET" }).handler(async () =>
  examPeriodsFromPage(
    await page("https://www.kth.se/en/student/studier/schema/tentaperioder-1.278515"),
  ),
);

const PROGRAMME_STORE = "__compressedApplicationStore__";
const validProgrammeCode = /^[A-ZÅÄÖ0-9]{1,6}$/;

export const getKthProgrammes = createServerFn({ method: "GET" }).handler(async () =>
  programmesFromCatalogue(
    readEmbeddedJson(
      await page("https://www.kth.se/student/kurser/kurser-inom-program?l=en"),
      PROGRAMME_STORE,
    ),
  ),
);

export const getKthProgrammeTerms = createServerFn({ method: "GET" })
  .validator((code: string) => {
    if (!validProgrammeCode.test(code)) throw new Error("Invalid programme code");
    return code;
  })
  .handler(async ({ data }) =>
    termsFromProgramme(
      readEmbeddedJson(await page(kthSyllabusUrl(data, "", "en")), PROGRAMME_STORE),
    ),
  );

export const getKthPlan = createServerFn({ method: "GET" })
  .validator((input: { programmeCode: string; term: string; includeDetails?: boolean }) => {
    // Values end up in a kth.se URL path: allow only real programme codes and terms.
    if (!validProgrammeCode.test(input.programmeCode) || !/^\d{4}[12]$/.test(input.term))
      throw new Error("Invalid programme code or term");
    return input;
  })
  .handler(async ({ data }) => {
    const html = await page(kthSyllabusUrl(data.programmeCode, data.term, "en"));
    const plan = planFromProgrammeStore(readEmbeddedJson(html, PROGRAMME_STORE));

    // Examiner and TimeEdit link live on each course page; a failing page just leaves them out.
    const codes = [
      ...new Set(
        plan.courses
          .filter((course) => data.includeDetails !== false || (!course.period && course.semester))
          .map((course) => course.code),
      ),
    ];
    const details: Record<string, CourseDetails> = {};
    for (let i = 0; i < codes.length; i += 6)
      await Promise.all(
        codes.slice(i, i + 6).map(async (code) => {
          try {
            const course = await page(
              `https://www.kth.se/student/kurser/kurs/${encodeURIComponent(code)}?l=en`,
            );
            details[code] = detailsFromCourseStore(
              readEmbeddedJson(course, "__compressedData__DATA"),
            );
          } catch (e) {
            console.warn(`kth.se course ${code}:`, e);
          }
        }),
      );
    const verified = withVerifiedPeriods(plan, details, data.programmeCode, data.term);
    return data.includeDetails === false ? verified : withDetails(verified, details);
  });
