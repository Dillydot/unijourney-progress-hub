// Turns the rows stored in Supabase into the shapes the dashboard screens render.
import { termOf } from "./kth";
import type { LadokGrade, StudentCourse } from "./ladok";

export type Grade = "A" | "B" | "C" | "D" | "E" | "P" | "Fail";

export type ProfileRow = {
  display_name: string | null;
  programme_code: string | null;
  programme_name: string | null;
  programme_credits: number | null;
  programme_start: string | null;
  programme_end: string | null;
  transcript_printed: string | null;
  updated_at?: string;
};

export type CourseRow = {
  code: string | null;
  name: string;
  credits: number;
  start_date: string | null;
  end_date: string | null;
  grade: LadokGrade | null;
  grade_date: string | null;
  earned_credits: number;
  status: StudentCourse["status"];
};

export const toCourseRow = (c: StudentCourse): CourseRow => ({
  code: c.code,
  name: c.name,
  credits: c.credits,
  start_date: c.start,
  end_date: c.end,
  grade: c.grade,
  grade_date: c.gradeDate,
  earned_credits: c.earnedCredits,
  status: c.status,
});

// KTH has no official GPA. "5-3" follows the traditional Swedish 3–5 scale; "5-1" is the other common one.
export type GradeScale = "5-3" | "5-1";
const gradePoints: Record<GradeScale, Partial<Record<Grade, number>>> = {
  "5-3": { A: 5, B: 4.5, C: 4, D: 3.5, E: 3 },
  "5-1": { A: 5, B: 4, C: 3, D: 2, E: 1 },
};
export const isGraded = (g: Grade) => g in gradePoints["5-1"];

/** Average grade; pass/fail (P) and failed attempts don't count. Weighted by ECTS unless `weighted` is false. */
export function averageGrade(
  courses: Array<{ grade: Grade; credits: number }>,
  { weighted = true, scale = "5-3" }: { weighted?: boolean; scale?: GradeScale } = {},
): string {
  let sum = 0;
  let weight = 0;
  for (const c of courses) {
    const p = gradePoints[scale][c.grade];
    if (p === undefined) continue;
    const w = weighted ? c.credits : 1;
    sum += p * w;
    weight += w;
  }
  return weight ? (sum / weight).toFixed(2) : "—";
}

const ymd = (iso: string) => iso.split("-").map(Number) as [number, number, number];

// KTH study periods, keyed on the date a course ends:
// P1 ends Oct, P2 ends Jan, P3 ends Mar, P4 ends Jun.
export function kthSlot(iso: string) {
  const [y, m] = ymd(iso);
  const period = m >= 8 && m <= 10 ? 1 : m >= 11 || m === 1 ? 2 : m <= 3 ? 3 : 4;
  const startYear = m >= 8 ? y : y - 1;
  return {
    period: `P${period}`,
    semester: m >= 8 || m === 1 ? `Autumn ${startYear}` : `Spring ${y}`,
    academicYear: `${startYear}–${String((startYear + 1) % 100).padStart(2, "0")}`,
  };
}

// First day of each period, relative to the academic year's start year.
const periodStarts = [
  [0, 8, 20],
  [0, 10, 25],
  [1, 1, 12],
  [1, 3, 14],
] as const;

const fmtDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
const fmtNum = (n: number) => String(Math.round(n * 10) / 10);

export function buildStudentView(
  profile: ProfileRow,
  courses: CourseRow[],
  email: string,
  today: string,
) {
  const completed = courses.filter((c) => c.status === "completed" && c.grade);
  const toGrade = (g: LadokGrade): Grade => (g === "F" || g === "FX" ? "Fail" : g);

  const completedCourses = completed
    .map((c) => {
      const when = c.end_date ?? c.grade_date!;
      const slot = kthSlot(when);
      return {
        name: c.name,
        code: c.code ?? "—",
        grade: toGrade(c.grade!),
        credits: c.credits,
        completed: fmtDate(c.grade_date ?? when),
        period: slot.period.slice(1),
        semester: slot.semester,
        academicYear: slot.academicYear,
        sortKey: c.grade_date ?? when,
      };
    })
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  // One slot per study period from programme start until now, so empty periods show as 0.
  const firstYear = kthSlot(
    profile.programme_start ?? completedCourses[0]?.sortKey ?? today,
  ).academicYear;
  const lastYear = kthSlot(today).academicYear;
  const slots: Array<{ period: string; semester: string; academicYear: string; label: string }> =
    [];
  for (let y = Number(firstYear.slice(0, 4)); y <= Number(lastYear.slice(0, 4)); y++) {
    for (const [i, [dy, m, d]] of periodStarts.entries()) {
      const start = `${y + dy}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (start > today) continue;
      const slot = kthSlot(
        i === 0
          ? `${y}-09-01`
          : i === 1
            ? `${y}-12-01`
            : i === 2
              ? `${y + 1}-02-01`
              : `${y + 1}-05-01`,
      );
      slots.push({
        ...slot,
        label: `${slot.period} ${slot.academicYear.slice(2).replace("–", "/")}`,
      });
    }
  }
  const sameSlot = (
    a: { period: string; academicYear: string },
    b: { period: string; academicYear: string },
  ) => a.period === b.period && a.academicYear === b.academicYear;

  const ectsByPeriod = slots.map((s) => ({
    ...s,
    earned: Number(
      fmtNum(
        courses
          .filter(
            (c) =>
              c.earned_credits > 0 && sameSlot(kthSlot(c.end_date ?? c.grade_date ?? today), s),
          )
          .reduce((sum, c) => sum + c.earned_credits, 0),
      ),
    ),
    expected: 15,
  }));

  const gradeTrend = slots
    .map((s) => {
      const inSlot = completedCourses.filter((c) => sameSlot({ ...c, period: `P${c.period}` }, s));
      return { ...s, courses: inSlot.some((c) => isGraded(c.grade)) ? inSlot : null };
    })
    .filter((s): s is typeof s & { courses: typeof completedCourses } => s.courses !== null);

  const earned = courses.reduce((sum, c) => sum + c.earned_credits, 0);
  const total = profile.programme_credits ?? 120;
  const pct = Math.min(100, Math.round((earned / total) * 100));

  const localPart = email.split("@")[0] ?? "";
  const fullName = profile.display_name?.trim() || localPart;
  const [firstName = fullName, ...rest] = fullName.split(" ");
  const start = profile.programme_start;
  const yearsIn = start
    ? Math.floor((Date.parse(today) - Date.parse(start)) / (365.25 * 864e5)) + 1
    : 1;

  return {
    student: {
      firstName,
      lastName: rest.join(" "),
      fullName,
      initials: fullName
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      studentId: email.endsWith("kth.se") ? localPart : "—",
      email,
      university: "KTH Royal Institute of Technology",
      programme: profile.programme_name ?? "—",
      programmeCode: profile.programme_code ?? "—",
      degreeLevel: /master/i.test(profile.programme_name ?? "") ? "Master’s" : "—",
      admissionYear: start?.slice(0, 4) ?? "—",
      department: "—",
      departmentCode: "",
      studyYear: `Year ${Math.max(1, yearsIn)}`,
      status: "Active",
    },
    progress: {
      completedCredits: fmtNum(earned),
      totalCredits: fmtNum(total),
      remainingCredits: fmtNum(Math.max(0, total - earned)),
      programmeProgress: `${pct}%`,
      progressPercent: pct,
      /** Credits still to earn on courses the student is registered on. */
      registeredCredits: courses
        .filter((c) => c.status !== "completed")
        .reduce((sum, c) => sum + Math.max(0, c.credits - c.earned_credits), 0),
      passedCourses: String(completed.filter((c) => toGrade(c.grade!) !== "Fail").length),
    },
    completedCourses,
    recentGrades: [...completedCourses]
      .reverse()
      .slice(0, 3)
      .map((c) => ({
        name: c.name,
        code: c.code,
        grade: c.grade,
        credits: `${c.credits} ECTS`,
        date: c.completed,
      })),
    ectsByPeriod,
    gradeTrend,
    semesters: [...new Set(slots.map((s) => s.semester))],
    academicYears: [...new Set(slots.map((s) => s.academicYear))],
    transcriptPrinted: profile.transcript_printed,
    ladokUploadedAt: profile.updated_at ?? null,
    programmeTerm: profile.programme_start ? termOf(profile.programme_start) : null,
    courseCodes: courses.flatMap((c) => (c.code ? [c.code] : [])),
  };
}

export type StudentView = ReturnType<typeof buildStudentView>;
export type CompletedCourse = StudentView["completedCourses"][number];
