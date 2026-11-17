import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  detailsFromCourseStore,
  eventsFromPlan,
  examPeriodsFromPage,
  nextDeadline,
  planFromProgrammeStore,
  readEmbeddedJson,
  termOf,
  withDetails,
} from "./kth";

// Trimmed copies of the public pages kth.se/student/kurser/program/TTBEM/20252/arskurs1 and kurs/ME2003.
const fixture = (name: string) =>
  readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), "utf8");

test("programme start date → KTH term", () => {
  expect(termOf("2025-08-25")).toBe("20252");
  expect(termOf("2026-01-13")).toBe("20261");
});

test("reads the study plan from the programme page", () => {
  const plan = planFromProgrammeStore(
    readEmbeddedJson(fixture("kth-programme-TTBEM.html"), "__compressedApplicationStore__"),
  );
  expect(plan).toMatchObject({
    name: "Master's Programme, Technology-based Entrepreneurship",
    years: 2,
    notes: ["A minimum of 3 the conditionally electvice courses must be taken during year 1-2."],
  });
  expect(
    plan.courses.map((c) => `${c.year} ${c.semester} ${c.period} ${c.code} ${c.kind} ${c.credits}`),
  ).toEqual([
    "1 Autumn 2025 P1 ME2620 mandatory 7.5",
    "1 Autumn 2025 P1 ME2016 elective 6",
    "2 Autumn 2026 P1 ME2003 mandatory 6",
    "2 Autumn 2026 P2 ME2003 mandatory 1.5",
  ]);
  expect(plan.courses[2]).toMatchObject({
    dates: "24 Aug 2026 – 11 Jan 2027",
    lastRegistration: "2026-08-31",
    spansTwoPeriods: true,
    applicationCode: "11032",
  });
});

test("adds examiner and TimeEdit schedule from the course page", () => {
  const details = detailsFromCourseStore(
    readEmbeddedJson(fixture("kth-course-ME2003.html"), "__compressedData__DATA"),
  );
  expect(details.examiner).toBe("Philip Kappen");
  expect(details.examinerUrl).toBe("https://www.kth.se/profile/kappen/");
  expect(details.rounds["11032"]?.scheduleUrl).toStartWith("https://cloud.timeedit.net/kth/");

  const plan = withDetails(
    planFromProgrammeStore(
      readEmbeddedJson(fixture("kth-programme-TTBEM.html"), "__compressedApplicationStore__"),
    ),
    { ME2003: details },
  );
  const me2003 = plan.courses.find((c) => c.code === "ME2003");
  expect(me2003).toMatchObject({
    examiner: "Philip Kappen",
    location: "KTH Campus",
    language: "English",
  });
  expect(plan.courses.find((c) => c.code === "ME2620")?.examiner).toBeUndefined();
});

test("fails loudly when kth.se changes its page format", () => {
  expect(() => readEmbeddedJson("<html></html>", "__compressedApplicationStore__")).toThrow();
  expect(() => planFromProgrammeStore({ something: "else" })).toThrow();
});

test("calendar events and next deadline from the plan", () => {
  const plan = planFromProgrammeStore(
    readEmbeddedJson(fixture("kth-programme-TTBEM.html"), "__compressedApplicationStore__"),
  );
  // Registered on ME2620 only; ME2003 is mandatory and not registered yet; ME2016 is an elective not taken.
  const events = eventsFromPlan(plan, ["ME2620"]);
  expect(events.map((e) => `${e.date} ${e.kind} ${e.code}`)).toEqual([
    "2025-08-25 course ME2620",
    "2025-10-24 course ME2620",
    "2026-08-20 registration ME2003",
    "2026-08-24 course ME2003",
    "2026-08-31 registration ME2003",
    "2027-01-11 course ME2003",
  ]);
  expect(nextDeadline(events, plan.courses, "2026-06-01")).toMatchObject({
    courseCode: "ME2003",
    iso: "2026-08-31T23:59:00",
  });
  expect(nextDeadline(events, plan.courses, "2026-09-01")).toBeNull();
});

test("exam periods and Ladok registration windows from the exam schedule page", () => {
  const events = examPeriodsFromPage(fixture("kth-exam-periods.html"));
  expect(events).toHaveLength(24);
  const byId = Object.fromEntries(events.map((e) => [e.id, e]));
  expect(byId["exam-period-1-2026-start"]).toMatchObject({ date: "2026-10-15", kind: "exam" });
  expect(byId["re-exam-period-1-2026-exam-close"]?.date).toBe("2026-11-26");
  expect(byId["exam-period-2-2026-start"]?.date).toBe("2027-01-04");
  expect(byId["exam-period-2-2026-exam-close"]?.date).toBe("2026-12-10");
  expect(byId["re-exam-period-2-2026-start"]).toMatchObject({
    date: "2027-03-30",
    title: "Re-exam period 2 (30 Mar – 2 Apr)",
  });
  expect(byId["re-exam-period-4-2026-start"]?.date).toBe("2027-08-16");
  expect(byId["re-exam-period-4-2026-exam-close"]?.date).toBe("2027-07-29");
  // Exam deadlines don't replace the course registration deadline card.
  expect(nextDeadline(events, [], "2026-11-17")).toBeNull();
  expect(() => examPeriodsFromPage("<html></html>")).toThrow();
});
