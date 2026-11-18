// KTH has no public course API since Kopps closed (June 2025). Its public course and
// programme pages embed their data as URL-encoded JSON; these helpers read that data.
// shortcut: depends on kth.se page internals; if parsing starts failing, check the pages first.

export type CourseKind = "mandatory" | "elective";

export type PlanCourse = {
  year: number;
  semester: string;
  period: string;
  kind: CourseKind;
  code: string;
  name: string;
  /** Credits taught in this period (a course spanning two periods appears once per period). */
  credits: number;
  dates: string;
  start: string;
  end: string;
  firstRegistration: string | null;
  lastRegistration: string | null;
  spansTwoPeriods: boolean;
  applicationCode: string;
  examiner?: string;
  examinerUrl?: string;
  scheduleUrl?: string;
  location?: string;
  language?: string;
};

/** `notes`: the programme's own rules, e.g. how many elective courses to take. */
export type ProgrammePlan = { name: string; years: number; courses: PlanCourse[]; notes: string[] };
export type CourseDetails = {
  examiner?: string;
  examinerUrl?: string;
  /** TimeEdit schedule per course round, keyed by application code. */
  rounds: Record<string, { scheduleUrl?: string; location?: string; language?: string }>;
};

/** Reads `window.<name> = "<url-encoded JSON>"` from a kth.se page. */
export function readEmbeddedJson(html: string, name: string): unknown {
  const m = html.match(new RegExp(`window\\.${name}\\s*=\\s*"([^"]+)"`));
  if (!m?.[1]) throw new Error(`kth.se page has no ${name}`);
  return JSON.parse(decodeURIComponent(m[1]));
}

/** "2025-08-25" → "20252" (KTH term: year + 1 spring / 2 autumn). */
export const termOf = (isoDate: string) =>
  `${isoDate.slice(0, 4)}${Number(isoDate.slice(5, 7)) >= 7 ? 2 : 1}`;

const short = (iso: string, withYear: boolean) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
const dateRange = (a: string, b: string) =>
  `${short(a, a.slice(0, 4) !== b.slice(0, 4))} – ${short(b, true)}`;

type StoreCourse = {
  kod: string;
  benamning: string;
  Valvillkor: string;
  tillfalleskod: string;
  Tillfallesperioder?: Array<{
    ForstaRegistreringsdatum?: string;
    SistaRegistreringsdatum?: string;
    ForstaUndervisningsdatum: string;
    SistaUndervisningsdatum: string;
    Lasperiodsfordelning: Array<{ Lasperiodskod: string; Omfattningsvarde: number }>;
  }>;
};
type ProgrammeStore = {
  programmeName: string;
  lengthInStudyYears: number;
  curriculums: Array<{
    studyYears: Array<{
      yearNumber: number;
      courses: StoreCourse[];
      conditionallyElectiveCoursesInfo?: string;
    }>;
  }>;
};

export function planFromProgrammeStore(raw: unknown): ProgrammePlan {
  const store = raw as ProgrammeStore;
  if (!Array.isArray(store?.curriculums))
    throw new Error("kth.se programme page: unexpected format");
  const courses: PlanCourse[] = [];
  const notes = new Set<string>();
  const seen = new Set<string>();
  // A programme can have several curriculums (tracks); the common courses repeat across them.
  for (const curriculum of store.curriculums)
    for (const year of curriculum.studyYears) {
      const note = year.conditionallyElectiveCoursesInfo?.replace(/<[^>]+>/g, "").trim();
      if (note) notes.add(note);
      for (const c of year.courses) {
        const round = c.Tillfallesperioder?.[0];
        if (!round || seen.has(`${year.yearNumber}-${c.kod}-${c.tillfalleskod}`)) continue;
        seen.add(`${year.yearNumber}-${c.kod}-${c.tillfalleskod}`);
        const start = round.ForstaUndervisningsdatum;
        const end = round.SistaUndervisningsdatum;
        const startYear =
          Number(start.slice(5, 7)) >= 7
            ? Number(start.slice(0, 4))
            : Number(start.slice(0, 4)) - 1;
        const periods = round.Lasperiodsfordelning;
        for (const p of periods)
          courses.push({
            year: year.yearNumber,
            semester: ["P1", "P2"].includes(p.Lasperiodskod)
              ? `Autumn ${startYear}`
              : `Spring ${startYear + 1}`,
            period: p.Lasperiodskod,
            kind: c.Valvillkor === "O" ? "mandatory" : "elective",
            code: c.kod,
            name: c.benamning,
            credits: p.Omfattningsvarde,
            dates: dateRange(start, end),
            start,
            end,
            firstRegistration: round.ForstaRegistreringsdatum ?? null,
            lastRegistration: round.SistaRegistreringsdatum ?? null,
            spansTwoPeriods: periods.length > 1,
            applicationCode: c.tillfalleskod,
          });
      }
    }
  courses.sort((a, b) => a.start.localeCompare(b.start) || a.period.localeCompare(b.period));
  return { name: store.programmeName, years: store.lengthInStudyYears, courses, notes: [...notes] };
}

type CourseStore = {
  courseData?: {
    courseInfo?: { course_examiners?: string };
    roundsBySemester?: Record<
      string,
      Array<{
        round_application_code?: string;
        round_schedule?: string;
        round_course_place?: string;
        round_tutoring_language?: string;
      }>
    >;
  };
};

export function detailsFromCourseStore(raw: unknown): CourseDetails {
  const data = (raw as CourseStore).courseData;
  const html = data?.courseInfo?.course_examiners ?? "";
  // First examiner only: '<p class="person"> ... <a href="/profile/kappen/">Philip Kappen</a>'
  const person = html.match(/<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/);
  const rounds: CourseDetails["rounds"] = {};
  for (const list of Object.values(data?.roundsBySemester ?? {}))
    for (const r of list)
      if (r.round_application_code)
        rounds[r.round_application_code] = {
          ...(r.round_schedule ? { scheduleUrl: r.round_schedule } : {}),
          ...(r.round_course_place ? { location: r.round_course_place } : {}),
          ...(r.round_tutoring_language ? { language: r.round_tutoring_language } : {}),
        };
  return {
    ...(person?.[2] ? { examiner: person[2].trim() } : {}),
    ...(person?.[1] ? { examinerUrl: new URL(person[1], "https://www.kth.se").href } : {}),
    rounds,
  };
}

export function withDetails(
  plan: ProgrammePlan,
  details: Record<string, CourseDetails>,
): ProgrammePlan {
  return {
    ...plan,
    courses: plan.courses.map((c) => {
      const d = details[c.code];
      const round = d?.rounds[c.applicationCode];
      return {
        ...c,
        ...(d?.examiner ? { examiner: d.examiner, examinerUrl: d.examinerUrl } : {}),
        ...round,
      };
    }),
  };
}

/** Credits of mandatory programme courses the student hasn't started, e.g. the degree project. */
export function plannedCredits(plan: ProgrammePlan, myCodes: string[]) {
  const mine = new Set(myCodes);
  const byCode = new Map<string, number>();
  const round = new Map<string, string>();
  for (const c of plan.courses) {
    if (c.kind !== "mandatory" || mine.has(c.code)) continue;
    // A course spanning two periods appears once per period; count only its first round.
    if ((round.get(c.code) ?? c.applicationCode) !== c.applicationCode) continue;
    round.set(c.code, c.applicationCode);
    byCode.set(c.code, (byCode.get(c.code) ?? 0) + c.credits);
  }
  return [...byCode.values()].reduce((a, b) => a + b, 0);
}

export type PlanEvent = {
  id: string;
  date: string;
  kind: "course" | "registration" | "exam";
  title: string;
  code: string;
  href: string;
};

const LADOK_URL = "https://www.student.ladok.se/";
const EXAMS_URL = "https://www.kth.se/en/student/studier/schema/tentaperioder-1.278515";
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * KTH-wide exam periods and their Ladok registration windows, from the public exam schedule page.
 * Applies to every course with an exam; course-specific exam days live in TimeEdit.
 */
export function examPeriodsFromPage(html: string): PlanEvent[] {
  const years = html.match(/Exam and re-exam periods (\d{4})\/(\d{4})/);
  if (!years) throw new Error("kth.se exam schedule page: unexpected format");
  // The academic year starts late August with no exams; Sep–Dec is its first calendar year.
  const iso = (day: string, month: string) => {
    const m = MONTHS.indexOf(month) + 1;
    if (!m) throw new Error(`kth.se exam schedule page: unknown month ${month}`);
    return `${m >= 9 ? years[1] : years[2]}-${String(m).padStart(2, "0")}-${day.padStart(2, "0")}`;
  };
  const events: PlanEvent[] = [];
  const re =
    /<h3>((?:Re-exam|Exam) period (\d)): (\d{1,2})(?: (\w+))?\s*[-–]\s*(\d{1,2}) (\w+)<\/h3>\s*<p>Registration opens (\d{1,2}) (\w+) and closes (\d{1,2}) (\w+)/g;
  for (const m of html.matchAll(re)) {
    const [, name = "", , d1 = "", m1, d2 = "", m2 = "", od = "", om = "", cd = "", cm = ""] = m;
    const id = `${name.toLowerCase().replace(/ /g, "-")}-${years[1]}`;
    const start = iso(d1, m1 ?? m2);
    const end = iso(d2, m2);
    const range = `${fmtShort(start)} – ${fmtShort(end)}`;
    events.push(
      {
        id: `${id}-start`,
        date: start,
        kind: "exam",
        title: `${name} (${range})`,
        code: "",
        href: EXAMS_URL,
      },
      {
        id: `${id}-exam-open`,
        date: iso(od, om),
        kind: "registration",
        title: `Exam registration opens: ${name}`,
        code: "",
        href: LADOK_URL,
      },
      {
        id: `${id}-exam-close`,
        date: iso(cd, cm),
        kind: "registration",
        title: `Last day to register for ${name.toLowerCase()} (${range})`,
        code: "",
        href: LADOK_URL,
      },
    );
  }
  if (!events.length) throw new Error("kth.se exam schedule page: no exam periods found");
  return events.sort((a, b) => a.date.localeCompare(b.date));
}
const fmtShort = (iso: string) => short(iso, false);

/** Course start/end days and registration windows for the student's own and mandatory courses. */
export function eventsFromPlan(plan: ProgrammePlan, myCodes: string[]): PlanEvent[] {
  const mine = new Set(myCodes);
  const rounds = new Map<string, PlanCourse>();
  for (const c of plan.courses)
    if (mine.has(c.code) || c.kind === "mandatory") rounds.set(`${c.code}-${c.applicationCode}`, c);

  const events: PlanEvent[] = [];
  for (const [id, c] of rounds) {
    const courseHref = c.scheduleUrl ?? `https://www.kth.se/student/kurser/kurs/${c.code}?l=en`;
    events.push(
      {
        id: `${id}-start`,
        date: c.start,
        kind: "course",
        title: `${c.name} starts`,
        code: c.code,
        href: courseHref,
      },
      {
        id: `${id}-end`,
        date: c.end,
        kind: "course",
        title: `Last teaching day: ${c.name}`,
        code: c.code,
        href: courseHref,
      },
    );
    // Registration only matters for courses the student isn't registered on yet.
    if (!mine.has(c.code)) {
      if (c.firstRegistration)
        events.push({
          id: `${id}-reg-open`,
          date: c.firstRegistration,
          kind: "registration",
          title: `Registration opens: ${c.name}`,
          code: c.code,
          href: LADOK_URL,
        });
      if (c.lastRegistration)
        events.push({
          id: `${id}-reg-close`,
          date: c.lastRegistration,
          kind: "registration",
          title: `Last day to register: ${c.name}`,
          code: c.code,
          href: LADOK_URL,
        });
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

/** The next registration deadline the student still has to act on, if any. */
export function nextDeadline(events: PlanEvent[], courses: PlanCourse[], today: string) {
  const e = events.find((ev) => ev.id.endsWith("-reg-close") && ev.date >= today);
  if (!e) return null;
  const course = courses.find((c) => c.code === e.code);
  return {
    title: "Course registration closes",
    course: course?.name ?? e.code,
    courseCode: e.code,
    date: new Date(`${e.date}T12:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    iso: `${e.date}T23:59:00`,
  };
}
