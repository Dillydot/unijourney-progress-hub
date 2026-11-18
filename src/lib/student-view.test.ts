import { expect, test } from "bun:test";
import { averageGrade, buildStudentView, kthSlot, type CourseRow } from "./student-view";

test("maps course end dates to KTH study periods", () => {
  expect(kthSlot("2025-10-24")).toEqual({
    period: "P1",
    semester: "Autumn 2025",
    academicYear: "2025–26",
  });
  expect(kthSlot("2026-01-12")).toEqual({
    period: "P2",
    semester: "Autumn 2025",
    academicYear: "2025–26",
  });
  expect(kthSlot("2026-03-13")).toEqual({
    period: "P3",
    semester: "Spring 2026",
    academicYear: "2025–26",
  });
  expect(kthSlot("2026-06-01")).toEqual({
    period: "P4",
    semester: "Spring 2026",
    academicYear: "2025–26",
  });
  expect(kthSlot("2027-01-11")).toEqual({
    period: "P2",
    semester: "Autumn 2026",
    academicYear: "2026–27",
  });
});

test("average: scales, ECTS weighting, pass/fail and failed attempts left out", () => {
  const mix = [
    { grade: "A", credits: 7.5 },
    { grade: "C", credits: 1.5 },
    { grade: "P", credits: 15 },
    { grade: "Fail", credits: 7.5 },
  ] as const;
  // (5·7.5 + 4·1.5) / 9
  expect(averageGrade([...mix])).toBe("4.83");
  expect(averageGrade([...mix], { weighted: false })).toBe("4.50");
  // (5·7.5 + 3·1.5) / 9
  expect(averageGrade([...mix], { scale: "5-1" })).toBe("4.67");
  expect(averageGrade([{ grade: "P", credits: 6 }])).toBe("—");
});

const course = (c: Partial<CourseRow>): CourseRow => ({
  code: "ME1000",
  name: "Course",
  credits: 7.5,
  start_date: null,
  end_date: null,
  grade: null,
  grade_date: null,
  earned_credits: 0,
  status: "completed",
  ...c,
});

test("builds dashboard numbers from stored rows", () => {
  const view = buildStudentView(
    {
      display_name: "Jane Doe",
      programme_code: "TTBEM",
      programme_name: "Master's Programme, Technology-based Entrepreneurship",
      programme_credits: 120,
      programme_start: "2025-08-25",
      programme_end: "2027-05-31",
      transcript_printed: "2026-11-16",
    },
    [
      course({
        code: "ME2620",
        end_date: "2025-10-24",
        grade: "B",
        grade_date: "2025-10-09",
        earned_credits: 7.5,
      }),
      course({
        code: "ME2623",
        end_date: "2026-03-13",
        grade: "D",
        grade_date: "2026-03-17",
        earned_credits: 7.5,
      }),
      course({
        code: "ME2188",
        credits: 3,
        end_date: "2026-10-23",
        grade: "A",
        grade_date: "2026-10-23",
        earned_credits: 3,
      }),
      course({ code: "ME2003", end_date: "2027-01-11", status: "ongoing", earned_credits: 2 }),
    ],
    "jdoe@kth.se",
    "2026-11-16",
  );

  expect(view.progress).toMatchObject({
    completedCredits: "20",
    totalCredits: "120",
    remainingCredits: "100",
    programmeProgress: "17%",
    passedCourses: "3",
  });
  expect(view.student).toMatchObject({
    initials: "JD",
    studentId: "jdoe",
    admissionYear: "2025",
    studyYear: "Year 2",
    degreeLevel: "Master’s",
  });
  // P1 25/26 … P2 26/27 (current); later periods haven't started yet.
  expect(view.ectsByPeriod.map((s) => `${s.label}:${s.earned}`)).toEqual([
    "P1 25/26:7.5",
    "P2 25/26:0",
    "P3 25/26:7.5",
    "P4 25/26:0",
    "P1 26/27:3",
    "P2 26/27:2",
  ]);
  expect(view.gradeTrend.map((s) => `${s.label}:${averageGrade(s.courses)}`)).toEqual([
    "P1 25/26:4.50",
    "P3 25/26:3.50",
    "P1 26/27:5.00",
  ]);
  expect(view.recentGrades.map((g) => g.code)).toEqual(["ME2188", "ME2623", "ME2620"]);
  expect(view.academicYears).toEqual(["2025–26", "2026–27"]);
});
