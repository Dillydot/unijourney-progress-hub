import type { CalendarEvent } from "@/components/CalendarScreen";
import type { PlanCourse, ProgrammePlan } from "./kth";
import { buildStudentView, type CourseRow } from "./student-view";

const courseNames = [
  ["Calculus I", "Classical Mechanics", "Linear Algebra", "Programming for Physics"],
  ["Calculus II", "Waves and Optics", "Electricity and Magnetism", "Experimental Physics I"],
  ["Differential Equations", "Thermodynamics", "Quantum Mechanics I", "Experimental Physics II"],
  ["Statistical Physics", "Electromagnetism", "Computational Physics", "Modern Physics"],
  ["Quantum Mechanics II", "Solid-State Physics", "Relativity", "Data Analysis in Physics"],
  ["Particle Physics", "Astrophysics", "Bachelor’s Project", "Scientific Writing"],
];

const programmeName = "Bachelor’s Programme in Physics";
const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const courses = courseNames.flatMap((names, semesterIndex): PlanCourse[] => {
  const autumn = semesterIndex % 2 === 0;
  const year = Math.floor(semesterIndex / 2) + 1;
  const calendarYear = 2025 + year + Number(!autumn);
  const periods = autumn
    ? [
        ["08-24", "10-23"],
        ["10-26", "01-15"],
      ]
    : [
        ["01-18", "03-19"],
        ["03-22", "06-05"],
      ];

  return names.map((name, index) => {
    const periodIndex = Math.floor(index / 2);
    const [from, to] = periods[periodIndex]!;
    const start = `${calendarYear}-${from}`;
    const end = `${calendarYear + Number(autumn && periodIndex === 1)}-${to}`;
    const code = `PHY${year}${String((semesterIndex % 2) * 4 + index + 1).padStart(2, "0")}`;
    return {
      year,
      semester: `${autumn ? "Autumn" : "Spring"} ${calendarYear}`,
      period: `P${(autumn ? 1 : 3) + periodIndex}`,
      kind: "mandatory",
      code,
      name,
      credits: 7.5,
      dates: `${shortDate.format(new Date(start))} – ${shortDate.format(new Date(end))}`,
      start,
      end,
      firstRegistration: null,
      lastRegistration: semesterIndex === 1 && periodIndex === 0 ? "2027-01-15" : null,
      spansTwoPeriods: false,
      applicationCode: code,
      location: "Main campus",
      language: "English",
    };
  });
});

const electiveOptions = [
  { year: 2, period: "P3", code: "PHY2E1", name: "Environmental Physics" },
  { year: 2, period: "P3", code: "PHY2E2", name: "Introduction to Materials Science" },
  { year: 3, period: "P2", code: "PHY3E1", name: "Medical Physics" },
  { year: 3, period: "P2", code: "PHY3E2", name: "Introduction to Photonics" },
];

export const physicsDemoPlan: ProgrammePlan = {
  name: programmeName,
  years: 3,
  courses: [
    ...courses,
    ...electiveOptions.map((option): PlanCourse => ({
      ...courses.find((course) => course.year === option.year && course.period === option.period)!,
      ...option,
      kind: "elective",
      applicationCode: option.code,
    })),
  ],
  notes: [],
};

const weeklySchedule = [
  [
    { day: 1, kind: "lecture", start: "09:00", end: "10:45", room: "Lecture Hall A" },
    { day: 3, kind: "lecture", start: "10:00", end: "11:45", room: "Lecture Hall A" },
    { day: 5, kind: "seminar", start: "10:00", end: "11:30", room: "Seminar Room 1" },
  ],
  [
    { day: 2, kind: "lecture", start: "10:00", end: "11:45", room: "Lecture Hall B" },
    { day: 3, kind: "seminar", start: "13:00", end: "14:30", room: "Seminar Room 2" },
    { day: 4, kind: "lecture", start: "13:00", end: "14:45", room: "Lecture Hall B" },
  ],
] as const;

export const physicsDemoEvents = courses.flatMap((course, index): CalendarEvent[] => {
  const schedule = weeklySchedule[index % weeklySchedule.length]!;
  const sessions: CalendarEvent[] = [];
  const lastDay = new Date(course.end).getTime();
  for (
    const day = new Date(course.start);
    day.getTime() <= lastDay;
    day.setUTCDate(day.getUTCDate() + 1)
  ) {
    const session = schedule.find(({ day: weekday }) => weekday === day.getUTCDay());
    if (!session) continue;

    const date = day.toISOString().slice(0, 10);
    sessions.push({
      id: `demo:${course.code}:${date}`,
      date,
      kind: session.kind,
      title: course.name,
      code: course.code,
      start: session.start,
      end: session.end,
      room: session.room,
    });
  }
  return sessions;
});

const registeredCourses = courses.slice(0, 4).map((course, index): CourseRow => {
  const grade = index === 0 ? "A" : index === 1 ? "B" : null;
  return {
    code: course.code,
    name: course.name,
    credits: course.credits,
    earned_credits: grade ? course.credits : 0,
    start_date: course.start,
    end_date: course.end,
    grade,
    grade_date: grade ? "2026-11-02" : null,
    status: grade ? "completed" : "ongoing",
  };
});

const view = buildStudentView(
  {
    display_name: "Alex Morgan",
    programme_code: "PHY-BSC",
    programme_name: programmeName,
    programme_credits: 180,
    programme_start: "2026-08-24",
    programme_end: "2029-06-05",
    transcript_printed: null,
  },
  registeredCourses,
  "alex.morgan@example.com",
  "2026-11-19",
);

export const physicsDemoView = {
  ...view,
  student: {
    ...view.student,
    university: "Example University",
    department: "Department of Physics",
    degreeLevel: "Bachelor’s",
  },
};
