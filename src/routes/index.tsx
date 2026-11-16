import { createFileRoute } from "@tanstack/react-router";
import {
  Award,
  Bell,
  BookOpen,
  Building2,
  CalendarClock,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  CheckCheck,
  ChevronRight,

  Clock,
  Copy,
  ExternalLink,
  Globe,
  GraduationCap,
  Hash,
  Info,
  Landmark,
  Languages,
  Layers,
  LayoutDashboard,
  LogOut,
  Mail,
  Map,
  Newspaper,
  BellRing,
  MapPin,
  Search,
  SlidersHorizontal,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarScreen } from "@/components/CalendarScreen";
import admissionsMark from "@/assets/admissions-mark.png";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — UniJourney" },
      {
        name: "description",
        content:
          "Track academic progress, the next registration deadline, current courses, recent grades and notifications in one clean student dashboard.",
      },
      { property: "og:title", content: "Student Dashboard — UniJourney" },
      {
        property: "og:description",
        content:
          "Progress, registration deadlines, current courses, grades and notifications — your university journey at a glance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// ---------------------------------------------------------------------------
// Example data used to fill the interface.
// ---------------------------------------------------------------------------

const student = {
  firstName: "John",
  lastName: "Doe",
  fullName: "John Doe",
  initials: "JD",
  studentId: "JODO001",
  email: "jodo@kth.se",
  university: "KTH Royal Institute of Technology",
  programme: "Technology-Based Entrepreneurship",
  programmeCode: "TTBEM",
  degreeLevel: "Master’s",
  admissionYear: "2026",
  department: "School of Industrial Engineering and Management",
  departmentCode: "itm",
  studyYear: "Year 1",
  status: "Active",
};

const progress = {
  completedCredits: "60",
  totalCredits: "120",
  remainingCredits: "60",
  programmeProgress: "50%",
  passedCourses: "8",
};

const nextDeadline = {
  title: "Study period 3 registration",
  course: "Research Methods",
  courseCode: "TTBEM01",
  date: "20 November 2026",
  iso: "2026-11-20T23:59:00",
};

type Tone = "primary" | "success" | "warning" | "destructive";

type CourseKind = "mandatory" | "elective";

type PlanCourse = {
  year: 1 | 2;
  semester: "Autumn 2025" | "Spring 2026" | "Autumn 2026" | "Spring 2027";
  period: "P1" | "P2" | "P3" | "P4";
  kind: CourseKind;
  code: string;
  name: string;
  credits: number;
  dates: string;
  examiner?: string;
  // Defaults below apply to all KTH ITM courses unless overridden per course
  location?: string; // default: KTH Campus, Stockholm
  language?: string; // default: English
  spansTwoPeriods?: boolean; // duration label
};

const planCourses: PlanCourse[] = [
  { year: 1, semester: "Autumn 2025", period: "P1", kind: "mandatory", code: "ME2620", name: "Technology-based Entrepreneurship", credits: 7.5, dates: "25 Aug – 24 Oct 2025" },
  { year: 1, semester: "Autumn 2025", period: "P1", kind: "mandatory", code: "ME2621", name: "Business Opportunity Development", credits: 7.5, dates: "25 Aug – 24 Oct 2025" },
  { year: 1, semester: "Autumn 2025", period: "P1", kind: "elective", code: "ME2016", name: "Project Management: Leadership and Control", credits: 6, dates: "25 Aug – 24 Oct 2025" },
  { year: 1, semester: "Autumn 2025", period: "P2", kind: "mandatory", code: "ME2622", name: "Innovative Business Models", credits: 7.5, dates: "27 Oct 2025 – 12 Jan 2026" },
  { year: 1, semester: "Autumn 2025", period: "P2", kind: "mandatory", code: "ME2626", name: "Finance for Technology based Entrepreneurship", credits: 7.5, dates: "27 Oct 2025 – 12 Jan 2026" },
  { year: 1, semester: "Autumn 2025", period: "P2", kind: "elective", code: "ME2086", name: "Global Energy Markets and Systems in Transition", credits: 6, dates: "27 Oct 2025 – 12 Jan 2026" },
  { year: 1, semester: "Autumn 2025", period: "P2", kind: "elective", code: "ME2092", name: "Management of Technology Innovation and Creativity", credits: 6, dates: "27 Oct 2025 – 12 Jan 2026", examiner: "Niklas Arvidsson" },
  { year: 1, semester: "Autumn 2025", period: "P2", kind: "elective", code: "ME2094", name: "Internet Marketing", credits: 7.5, dates: "27 Oct 2025 – 12 Jan 2026" },
  { year: 1, semester: "Autumn 2025", period: "P2", kind: "elective", code: "ME2710", name: "Applied Econometrics", credits: 7.5, dates: "27 Oct 2025 – 12 Jan 2026", examiner: "Hans Lööf" },
  { year: 1, semester: "Autumn 2025", period: "P2", kind: "elective", code: "ME2826", name: "Social Entrepreneurship", credits: 7.5, dates: "27 Oct 2025 – 12 Jan 2026" },
  { year: 1, semester: "Spring 2026", period: "P3", kind: "mandatory", code: "ME2623", name: "Technology-based Venture Realization", credits: 7.5, dates: "13 Jan – 13 Mar 2026" },
  { year: 1, semester: "Spring 2026", period: "P3", kind: "elective", code: "ME2054", name: "Purchasing & Supply Chain Management", credits: 6, dates: "13 Jan – 13 Mar 2026" },
  { year: 1, semester: "Spring 2026", period: "P3", kind: "elective", code: "ME2085", name: "Transformation in Energy Systems and Industries", credits: 6, dates: "13 Jan – 13 Mar 2026" },
  { year: 1, semester: "Spring 2026", period: "P4", kind: "mandatory", code: "ME2624", name: "Managing Firm Growth", credits: 7.5, dates: "16 Mar – 1 Jun 2026" },
  { year: 1, semester: "Spring 2026", period: "P4", kind: "elective", code: "ME2075", name: "Leadership and Power in Industrial Organisations: Perspectives of Gender and Diversity", credits: 6, dates: "16 Mar – 1 Jun 2026" },
  { year: 1, semester: "Spring 2026", period: "P4", kind: "elective", code: "ME2827", name: "Negotiations for Start-ups", credits: 7.5, dates: "16 Mar – 1 Jun 2026" },
  { year: 1, semester: "Spring 2026", period: "P4", kind: "elective", code: "ME2836", name: "Entrepreneurial family firms", credits: 7.5, dates: "16 Mar – 1 Jun 2026" },
  { year: 2, semester: "Autumn 2026", period: "P1", kind: "mandatory", code: "ME2003", name: "Research Methods in Industrial Engineering and Management", credits: 6, dates: "24 Aug 2026 – 11 Jan 2027", examiner: "Philip Kappen", spansTwoPeriods: true },
  { year: 2, semester: "Autumn 2026", period: "P2", kind: "mandatory", code: "ME2003", name: "Research Methods in Industrial Engineering and Management", credits: 1.5, dates: "24 Aug 2026 – 11 Jan 2027", examiner: "Philip Kappen", spansTwoPeriods: true },
  { year: 2, semester: "Autumn 2026", period: "P1", kind: "mandatory", code: "ME2625", name: "Challenge-driven technology-based entrepreneurship", credits: 7.5, dates: "24 Aug 2026 – 11 Jan 2027", examiner: "Mana Farshid", spansTwoPeriods: true },
  { year: 2, semester: "Autumn 2026", period: "P2", kind: "mandatory", code: "ME2625", name: "Challenge-driven technology-based entrepreneurship", credits: 7.5, dates: "24 Aug 2026 – 11 Jan 2027", examiner: "Mana Farshid", spansTwoPeriods: true },
  { year: 2, semester: "Autumn 2026", period: "P2", kind: "elective", code: "ME2086", name: "Global Energy Markets and Systems in Transition", credits: 6, dates: "26 Oct 2026 – 11 Jan 2027", examiner: "Frauke Urban" },
  { year: 2, semester: "Autumn 2026", period: "P2", kind: "elective", code: "ME2094", name: "Internet Marketing", credits: 7.5, dates: "26 Oct 2026 – 11 Jan 2027", examiner: "Mana Farshid" },
  { year: 2, semester: "Spring 2027", period: "P3", kind: "mandatory", code: "ME210X", name: "Degree Project in Industrial Economics and Management, Second Cycle", credits: 15, dates: "12 Jan – 31 May 2027", examiner: "Bo Karlson", spansTwoPeriods: true },
  { year: 2, semester: "Spring 2027", period: "P4", kind: "mandatory", code: "ME210X", name: "Degree Project in Industrial Economics and Management, Second Cycle", credits: 15, dates: "12 Jan – 31 May 2027", examiner: "Bo Karlson", spansTwoPeriods: true },
];

// Official KTH profile pages for the teachers published on the programme
const teacherProfiles: Record<string, string> = {
  "Niklas Arvidsson": "https://www.kth.se/profile/nikarv",
  "Hans Lööf": "https://www.kth.se/profile/loofhans",
  "Philip Kappen": "https://www.kth.se/profile/kappen",
  "Mana Farshid": "https://www.kth.se/profile/mfarshid",
  "Frauke Urban": "https://www.kth.se/profile/fraukeu",
  "Bo Karlson": "https://www.kth.se/profile/bokarl",
};

const recentGrades = [
  {
    name: "Business Development",
    code: "TTBEM13",
    grade: "B",
    credits: "7.5 ECTS",
    date: "12 June 2026",
  },
  {
    name: "Strategic Management",
    code: "TTBEM15",
    grade: "Fail",
    credits: "7.5 ECTS",
    date: "11 June 2026",
  },
  {
    name: "Organisational Behaviour",
    code: "TTBEM14",
    grade: "E",
    credits: "7.5 ECTS",
    date: "10 June 2026",
  },
];

type Grade = "A" | "B" | "C" | "D" | "E" | "Fail";
type ProgressGrouping = "period" | "semester" | "year";

// All finished courses for the persona: 8 passed + 3 failed, spread over the
// four study periods of academic year 2025–26 (Autumn 2025 + Spring 2026).
const completedCourses = [
  {
    name: "Entrepreneurship Fundamentals",
    code: "TTBEM02",
    grade: "A" as Grade,
    credits: 7.5,
    completed: "24 October 2025",
    period: "1",
    semester: "Autumn 2025",
    academicYear: "2025–26",
  },
  {
    name: "Innovation & Idea Development",
    code: "TTBEM03",
    grade: "B" as Grade,
    credits: 7.5,
    completed: "28 October 2025",
    period: "1",
    semester: "Autumn 2025",
    academicYear: "2025–26",
  },
  {
    name: "Marketing Management",
    code: "TTBEM07",
    grade: "B" as Grade,
    credits: 7.5,
    completed: "12 January 2026",
    period: "2",
    semester: "Autumn 2025",
    academicYear: "2025–26",
  },
  {
    name: "Corporate Finance",
    code: "TTBEM08",
    grade: "Fail" as Grade,
    credits: 7.5,
    completed: "14 January 2026",
    period: "2",
    semester: "Autumn 2025",
    academicYear: "2025–26",
  },
  {
    name: "Academic Writing in English",
    code: "TTBEM04",
    grade: "C" as Grade,
    credits: 7.5,
    completed: "15 January 2026",
    period: "2",
    semester: "Autumn 2025",
    academicYear: "2025–26",
  },
  {
    name: "Digital Transformation",
    code: "TTBEM10",
    grade: "D" as Grade,
    credits: 7.5,
    completed: "18 March 2026",
    period: "3",
    semester: "Spring 2026",
    academicYear: "2025–26",
  },
  {
    name: "Product Development",
    code: "TTBEM09",
    grade: "A" as Grade,
    credits: 7.5,
    completed: "20 March 2026",
    period: "3",
    semester: "Spring 2026",
    academicYear: "2025–26",
  },
  {
    name: "Operations Management",
    code: "TTBEM11",
    grade: "Fail" as Grade,
    credits: 7.5,
    completed: "23 March 2026",
    period: "3",
    semester: "Spring 2026",
    academicYear: "2025–26",
  },
  {
    name: "Organisational Behaviour",
    code: "TTBEM14",
    grade: "E" as Grade,
    credits: 7.5,
    completed: "10 June 2026",
    period: "4",
    semester: "Spring 2026",
    academicYear: "2025–26",
  },
  {
    name: "Strategic Management",
    code: "TTBEM15",
    grade: "Fail" as Grade,
    credits: 7.5,
    completed: "11 June 2026",
    period: "4",
    semester: "Spring 2026",
    academicYear: "2025–26",
  },
  {
    name: "Business Development",
    code: "TTBEM13",
    grade: "B" as Grade,
    credits: 7.5,
    completed: "12 June 2026",
    period: "4",
    semester: "Spring 2026",
    academicYear: "2025–26",
  },
];

const gradePoints: Record<Grade, number> = { A: 5, B: 4, C: 3, D: 2, E: 1, Fail: 0 };

// Earned credits and average grade are derived from the courses above so the
// charts always stay in sync with the course list.
const ectsByPeriod = ["1", "2", "3", "4"].map((period) => {
  const courses = completedCourses.filter((course) => course.period === period);
  return {
    period: `P${period}`,
    semester: courses[0]?.semester ?? "Autumn 2025",
    earned: courses
      .filter((course) => course.grade !== "Fail")
      .reduce((total, course) => total + course.credits, 0),
    expected: 15,
  };
});

const gradeTrend = ["1", "2", "3", "4"].map((period) => {
  const courses = completedCourses.filter((course) => course.period === period);
  const average =
    courses.reduce((total, course) => total + gradePoints[course.grade], 0) /
    Math.max(courses.length, 1);
  return {
    period: `P${period}`,
    semester: courses[0]?.semester ?? "Autumn 2025",
    value: Math.round(average * 10) / 10,
  };
});

type NotificationTarget = "dashboard" | "progress" | "plan" | "news" | "profile";

const notifications: Array<{
  type: string;
  icon: IconComponent;
  title: string;
  body: string;
  time: string;
  tone: Tone;
  unread: boolean;
  target: NotificationTarget;
  href?: string;
  linkKey?: "applyOnAdmissions" | "registerOnLadok";
  push?: boolean;
}> = [
  {
    type: "New grade",
    icon: Award,
    title: "New grade published",
    body: "Business Development — result: B. Well done!",
    time: "Today · 08:12",
    tone: "success",
    unread: true,
    target: "progress",
  },
  {
    type: "New grade",
    icon: Award,
    title: "New grade published",
    body: "Project Management — result: Fail. You can re-register for the re-exam.",
    time: "Yesterday · 16:40",
    tone: "destructive",
    unread: true,
    target: "progress",
  },
  {
    type: "KTH news",
    icon: Newspaper,
    title: "New story from KTH",
    body: "KTH rises in the latest global university ranking. Read the full story.",
    time: "Yesterday · 09:05",
    tone: "primary",
    unread: true,
    target: "news",
  },
  {
    type: "Approaching deadline",
    icon: Clock,
    title: "Deadline approaching",
    body: "Research Methods project proposal is due 20 November 2026.",
    time: "Monday · 10:22",
    tone: "warning",
    unread: false,
    target: "dashboard",
  },
  {
    type: "Application deadline",
    icon: Globe,
    title: "Apply for courses",
    body: "Course applications for spring 2027 close 20 January 2027 on universityadmissions.se.",
    time: "Today · 07:30",
    tone: "warning",
    unread: true,
    target: "plan",
    href: "https://www.universityadmissions.se/intl/start",
    linkKey: "applyOnAdmissions",
  },
  {
    type: "Registration deadline",
    icon: BellRing,
    title: "Register for courses in Ladok",
    body: "Push notification: registration for study period 3 closes 12 January 2027 in Ladok.",
    time: "Yesterday · 18:15",
    tone: "primary",
    unread: true,
    target: "plan",
    href: "https://ladok.se/",
    linkKey: "registerOnLadok",
    push: true,
  },
];

const toneChip: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
};

// ---------------------------------------------------------------------------
// Interface translations (English / Swedish). Course names and notification
// content are example data from KTH and stay in English.
// ---------------------------------------------------------------------------

const ui = {
  en: {
    switchLanguage: "Byt språk till svenska",
    languageCode: "SV",
    activeStudent: "Active student",
    openNotifications: (n: number) => `Open notifications, ${n} unread`,
    closeNotifications: "Close notifications",
    notifications: "Notifications",
    newCount: (n: number) => `${n} new`,
    markAllRead: "Mark all as read",
    allRead: "All notifications are read",
    academicYear: "Academic year 2026–27",
    greeting: "Hello  John.",
    intro: "Here’s a clear view of where you are and what’s coming next.",
    viewFullProfile: "View full profile",
    academicProgress: "Academic progress",
    overallProgress: "Overall progress",
    completedCredits: "Completed credits",
    remainingCredits: "Remaining credits",
    programmeProgress: "Programme progress",
    passedCourses: "Passed courses",
    coursesUnit: "courses",
    ectsCompleted: (done: string, total: string) => `${done} of ${total} ECTS completed`,
    nextDeadline: "Next registration deadline",
    daysLeft: (n: number) => `${n} days left`,
    relatedCourse: "Related course",
    dateLabel: "Date",
    currentCourses: "Current courses",
    enrolled: (n: number) => `${n} enrolled`,
    recentGrades: "Recent grades",
    latestFirst: "Latest first",
    resultLabel: (date: string) => `Result ${date}`,
    profile: "Profile",
    exampleData: "Example data",
    studentId: "Student ID",
    studentStatus: "Student status",
    activeStatus: "Active",
    admissionYear: "Admission year",
    studyYear: "Study year",
    academicDetails: "Academic details",
    university: "University",
    department: "Department",
    programme: "Programme",
    programmeCode: "Programme code",
    degreeLevel: "Degree level",
    contact: "Contact",
    universityEmail: "University email",
    registeredName: "Registered name",
    copyVerb: "Copy",
    copiedWord: "copied",
    language: "Language",
    english: "English",
    swedish: "Swedish",
    logOut: "Log out",
    progressTitle: "Your academic progress",
    progressIntro: "Follow completed credits and grade development throughout your programme.",
    filters: "Filters",
    allPeriods: "All study periods",
    allSemesters: "All semesters",
    allYears: "All academic years",
    studyPeriod: "Study period",
    semester: "Semester",
    academicYearFilter: "Academic year",
    spring2026: "Spring 2026",
    autumn2025: "Autumn 2025",
    ectsProgress: "ECTS progress",
    ectsProgressDescription: "Earned credits compared with your expected study plan",
    earned: "Earned",
    expected: "Expected",
    gradeDevelopment: "Grade development",
    gradeDevelopmentDescription: "Average grade over time · A = 5",
    studyPeriods: "Study periods",
    semesters: "Semesters",
    academicYears: "Academic years",
    averageGrade: "Average grade",
    gradeDistribution: "Grade distribution",
    gradeDistributionDescription: "Select a grade to see its courses",
    courses: "courses",
    noCoursesForGrade: "No courses with this grade yet.",
    passedCoursesTitle: "Completed courses",
    showingCourses: (n: number) => `${n} courses shown`,
    completedOn: "Completed",
    clearGradeFilter: "Show all grades",
    filterAll: "All",
    filterPassed: "Passed",
    filterFailed: "Failed",
    searchCourses: "Search courses…",
    showFilters: "Show study filters",
    hideFilters: "Hide study filters",
    ectsUnit: "ECTS",
    planTitle: "Your programme plan",
    planIntro: "Explore mandatory and elective courses by year, semester and study period.",
    yearOne: "Year 1",
    yearTwo: "Year 2",
    mandatory: "Mandatory",
    elective: "Conditionally elective",
    allCourseTypes: "All course types",
    courseType: "Course type",
    teachingDates: "Teaching dates",
    responsibleTeacher: "Responsible teacher / examiner",
    teacherUnavailable: "Not published by KTH",
    officialCoursePage: "Official course page",
    admissionPage: "Apply via universityadmissions.se",
    applyOnAdmissions: "Apply on universityadmissions.se",
    registerOnLadok: "Register on ladok.se",
    pushChip: "Push",
    locationLabel: "Location",
    durationLabel: "Duration",
    periodLabel: "Period",
    languageLabel: "Language",
    defaultLocation: "KTH Campus, Stockholm",
    defaultLanguage: "English",
    onePeriod: "One study period",
    twoPeriods: "Two study periods",
    electiveRequirement: "Choose at least 3 conditionally elective courses across years 1–2.",
    programmeSummary: "2 years · 120 ECTS · English",
    coursesFound: (n: number) => `${n} course options`,
    noPlannedCourses: "No courses match these filters.",
    nav: { dashboard: "Dashboard", progress: "Progress", plan: "Plan", calendar: "Calendar", news: "News", profile: "Profile" },
    courseStatus: { "In progress": "In progress", Registered: "Registered" } as Record<
      string,
      string
    >,
  },
  sv: {
    switchLanguage: "Switch language to English",
    languageCode: "EN",
    activeStudent: "Aktiv student",
    openNotifications: (n: number) => `Öppna aviseringar, ${n} olästa`,
    closeNotifications: "Stäng aviseringar",
    notifications: "Aviseringar",
    newCount: (n: number) => `${n} nya`,
    markAllRead: "Markera alla som lästa",
    allRead: "Alla aviseringar är lästa",
    academicYear: "Läsåret 2026–27",
    greeting: "God eftermiddag, John.",
    intro: "Här får du en tydlig överblick över var du befinner dig och vad som väntar härnäst.",
    viewFullProfile: "Visa hela profilen",
    academicProgress: "Studieframsteg",
    overallProgress: "Övergripande framsteg",
    completedCredits: "Avklarade poäng",
    remainingCredits: "Återstående poäng",
    programmeProgress: "Programframsteg",
    passedCourses: "Godkända kurser",
    coursesUnit: "kurser",
    ectsCompleted: (done: string, total: string) => `${done} av ${total} hp avklarade`,
    nextDeadline: "Nästa registreringsdeadline",
    daysLeft: (n: number) => `${n} dagar kvar`,
    relatedCourse: "Relaterad kurs",
    dateLabel: "Datum",
    currentCourses: "Aktuella kurser",
    enrolled: (n: number) => `${n} registrerade`,
    recentGrades: "Senaste betyg",
    latestFirst: "Senaste först",
    resultLabel: (date: string) => `Resultat ${date}`,
    profile: "Profil",
    exampleData: "Exempeldata",
    studentId: "Student-ID",
    studentStatus: "Studentstatus",
    activeStatus: "Aktiv",
    admissionYear: "Antagningsår",
    studyYear: "Årskurs",
    academicDetails: "Utbildningsuppgifter",
    university: "Universitet",
    department: "Institution",
    programme: "Program",
    programmeCode: "Programkod",
    degreeLevel: "Examensnivå",
    contact: "Kontakt",
    universityEmail: "Universitetsmejl",
    registeredName: "Registrerat namn",
    copyVerb: "Kopiera",
    copiedWord: "kopierad",
    language: "Språk",
    english: "Engelska",
    swedish: "Svenska",
    logOut: "Logga ut",
    progressTitle: "Dina studieframsteg",
    progressIntro: "Följ avklarade poäng och betygsutveckling genom hela programmet.",
    filters: "Filter",
    allPeriods: "Alla läsperioder",
    allSemesters: "Alla terminer",
    allYears: "Alla läsår",
    studyPeriod: "Läsperiod",
    semester: "Termin",
    academicYearFilter: "Läsår",
    spring2026: "Vår 2026",
    autumn2025: "Höst 2025",
    ectsProgress: "Poängutveckling",
    ectsProgressDescription: "Avklarade poäng jämfört med förväntad studieplan",
    earned: "Avklarat",
    expected: "Förväntat",
    gradeDevelopment: "Betygsutveckling",
    gradeDevelopmentDescription: "Genomsnittligt betyg över tid · A = 5",
    studyPeriods: "Läsperioder",
    semesters: "Terminer",
    academicYears: "Läsår",
    averageGrade: "Snittbetyg",
    gradeDistribution: "Betygsfördelning",
    gradeDistributionDescription: "Välj ett betyg för att se kurserna",
    courses: "kurser",
    noCoursesForGrade: "Inga kurser med detta betyg ännu.",
    passedCoursesTitle: "Avklarade kurser",
    showingCourses: (n: number) => `${n} kurser visas`,
    completedOn: "Avklarad",
    clearGradeFilter: "Visa alla betyg",
    filterAll: "Alla",
    filterPassed: "Godkända",
    filterFailed: "Underkända",
    searchCourses: "Sök kurser…",
    showFilters: "Visa studiefilter",
    hideFilters: "Dölj studiefilter",
    ectsUnit: "hp",
    planTitle: "Din programplan",
    planIntro: "Utforska obligatoriska och villkorligt valbara kurser per år, termin och läsperiod.",
    yearOne: "Årskurs 1",
    yearTwo: "Årskurs 2",
    mandatory: "Obligatorisk",
    elective: "Villkorligt valbar",
    allCourseTypes: "Alla kurstyper",
    courseType: "Kurstyp",
    teachingDates: "Kursperiod",
    responsibleTeacher: "Ansvarig lärare / examinator",
    teacherUnavailable: "Inte publicerat av KTH",
    officialCoursePage: "Officiell kurssida",
    admissionPage: "Ansök via antagning.se",
    applyOnAdmissions: "Ansök på antagning.se",
    registerOnLadok: "Registrera på ladok.se",
    pushChip: "Push",
    locationLabel: "Plats",
    durationLabel: "Omfattning",
    periodLabel: "Period",
    languageLabel: "Språk",
    defaultLocation: "KTH Campus, Stockholm",
    defaultLanguage: "Engelska",
    onePeriod: "En läsperiod",
    twoPeriods: "Två läsperioder",
    electiveRequirement: "Välj minst 3 villkorligt valbara kurser under årskurs 1–2.",
    programmeSummary: "2 år · 120 hp · engelska",
    coursesFound: (n: number) => `${n} kursalternativ`,
    noPlannedCourses: "Inga kurser matchar filtren.",
    nav: { dashboard: "Översikt", progress: "Framsteg", plan: "Plan", calendar: "Kalender", news: "Nyheter", profile: "Profil" },
    courseStatus: { "In progress": "Pågående", Registered: "Registrerad" } as Record<
      string,
      string
    >,
  },
};

type Lang = keyof typeof ui;
type Tab = "dashboard" | "progress" | "plan" | "calendar" | "news" | "profile";

function daysUntil(iso: string) {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diff = target - now;
  return diff > 0 ? Math.ceil(diff / 86_400_000) : 0;
}

// ---------------------------------------------------------------------------

function Index() {
  const daysLeft = daysUntil(nextDeadline.iso);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notes, setNotes] = useState(notifications);
  const [lang, setLang] = useState<Lang>("en");
  const nc = newsCopy[lang];
  const [notifPrefs, setNotifPrefs] = useState<Record<NotificationPrefKey, boolean>>(defaultNotificationPrefs);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [progressGrouping, setProgressGrouping] = useState<ProgressGrouping>("period");
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const t = ui[lang];
  const unreadCount = notes.filter((note) => note.unread).length;

  function go(next: Tab) {
    setTab(next);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="min-h-screen bg-background pb-28 text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
          <button
            type="button"
            onClick={() => go("dashboard")}
            className="flex items-center gap-3"
            aria-label="UniJourney home"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-brand">
              <GraduationCap className="size-5" aria-hidden="true" />
            </span>
            <span className="font-display text-xl font-bold">UniJourney</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full bg-success-soft px-3 py-1.5 text-xs font-bold text-success md:flex">
              <span className="size-1.5 rounded-full bg-success" />
              {t.activeStudent}
            </div>
            <button
              type="button"
              onClick={() => setNotificationsOpen((open) => !open)}
              aria-expanded={notificationsOpen}
              aria-label={
                notificationsOpen ? t.closeNotifications : t.openNotifications(unreadCount)
              }
              className="relative grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-card transition-colors hover:bg-secondary hover:text-primary"
            >
              <Bell className="size-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[0.625rem] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {notificationsOpen && (
          <>
            <button
              type="button"
              aria-label="Close notifications"
              onClick={() => setNotificationsOpen(false)}
              className="fixed inset-0 z-30 cursor-default bg-foreground/10"
            />
            <section
              aria-label="Notifications"
              className="fixed inset-x-4 top-24 z-40 mx-auto max-h-[70vh] max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-card md:absolute md:inset-x-auto md:right-8 md:top-full md:mt-2 md:w-96"
            >
              <div className="flex items-end justify-between gap-3">
                <p className="section-label">{t.notifications}</p>
                <span className="flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary">
                  <Bell className="size-3.5" aria-hidden="true" />
                  {t.newCount(unreadCount)}
                </span>
              </div>
              {unreadCount > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() =>
                    setNotes((current) => current.map((note) => ({ ...note, unread: false })))
                  }
                >
                  <CheckCheck className="size-3.5" aria-hidden="true" />
                  {t.markAllRead}
                </Button>
              ) : (
                <p className="mt-3 flex items-center gap-2 text-xs font-bold text-success">
                  <CheckCheck className="size-3.5" aria-hidden="true" />
                  {t.allRead}
                </p>
              )}
              <ul className="mt-2 divide-y divide-border">
                {notes.map((note) => (
                  <NotificationRow
                    key={`${note.title}-${note.time}`}
                    note={note}
                    t={t}
                    onOpen={() => {
                      setNotes((current) =>
                        current.map((n) => (n === note ? { ...n, unread: false } : n)),
                      );
                      setNotificationsOpen(false);
                      go(note.target);
                    }}
                  />
                ))}
              </ul>
            </section>
          </>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-5 md:px-8 md:pb-16 md:pt-8">
        {tab === "dashboard" && (
        <div className="mb-3 md:mb-5">
          <p className="text-xs font-bold text-primary">{t.academicYear}</p>
          <h1 className="mt-0.5 font-display text-2xl font-bold md:text-4xl">{t.greeting}</h1>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">{t.intro}</p>
        </div>
        )}

        {/* Dashboard: profile summary ------------------------------------------ */}
        {tab === "dashboard" && (
          <section
            id="profile-summary"
            onClick={() => go("profile")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                go("profile");
              }
            }}
            role="link"
            tabIndex={0}
            aria-label={t.viewFullProfile}
            className="card-enter card-enter-delay mb-3 flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:mb-4 md:p-4"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground">
              {student.initials}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-sm font-bold leading-5">{student.fullName}</h2>
              <p className="truncate text-[11px] leading-4 text-muted-foreground">
                {student.studentId} · {student.programmeCode} · {student.studyYear}
              </p>
            </div>
            <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-bold text-success sm:flex">
              <span className="size-1.5 rounded-full bg-success" />
              {t.activeStatus}
            </span>
            <ChevronRight className="size-4 shrink-0 text-primary" aria-hidden="true" />
          </section>
        )}

        {/* Dashboard academic progress summary --------------------------------- */}
        {tab === "dashboard" && (
          <section
            id="progress"
            onClick={() => go("progress")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                go("progress");
              }
            }}
            role="link"
            tabIndex={0}
            aria-label={t.academicProgress}
            className="card-enter scroll-mt-6 cursor-pointer rounded-2xl bg-primary p-4 text-primary-foreground shadow-brand transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:col-span-12 md:p-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="section-label text-primary-foreground/70">{t.academicProgress}</p>
                <h2 className="mt-1 line-clamp-2 font-display text-sm font-bold leading-5 md:text-base">
                  {student.programme}
                </h2>
                <p className="mt-0.5 truncate text-xs text-primary-foreground/70">
                  {student.degreeLevel} · {student.studyYear} · {student.admissionYear}
                </p>
              </div>
              <div
                className="progress-ring grid size-14 shrink-0 place-items-center rounded-full md:size-16"
                aria-label={`${progress.programmeProgress} of programme complete`}
              >
                <div className="grid size-10 place-items-center rounded-full bg-primary font-display text-xs font-bold md:size-12 md:text-sm">
                  {progress.programmeProgress}
                </div>
              </div>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary-foreground/20">
              <div className="progress-fill h-full rounded-full bg-primary-foreground" />
            </div>
            <p className="mt-1.5 text-[11px] font-semibold text-primary-foreground/70">
              {t.ectsCompleted(progress.completedCredits, progress.totalCredits)}
            </p>

            <div className="mt-3 grid grid-cols-4 gap-2 border-t border-primary-foreground/15 pt-3">
              <StatTile
                icon={Check}
                label={t.completedCredits}
                value={progress.completedCredits}
                unit="ECTS"
              />
              <StatTile
                icon={Layers}
                label={t.remainingCredits}
                value={progress.remainingCredits}
                unit="ECTS"
              />
              <StatTile
                icon={TrendingUp}
                label={t.programmeProgress}
                value={progress.programmeProgress}
              />
              <StatTile
                icon={Award}
                label={t.passedCourses}
                value={progress.passedCourses}
                unit={t.coursesUnit}
              />
            </div>
          </section>
        )}

        {tab === "progress" && (
          <ProgressScreen
            lang={lang}
            t={t}
            periodFilter={periodFilter}
            setPeriodFilter={setPeriodFilter}
            semesterFilter={semesterFilter}
            setSemesterFilter={setSemesterFilter}
            yearFilter={yearFilter}
            setYearFilter={setYearFilter}
            grouping={progressGrouping}
            setGrouping={setProgressGrouping}
            selectedGrade={selectedGrade}
            setSelectedGrade={setSelectedGrade}
          />
        )}

        {/* Dashboard: next registration deadline + recent grades ------------------ */}
        {tab === "dashboard" && (
        <div className="grid gap-3 md:grid-cols-12 md:gap-5">
          {/* Next registration deadline ------------------------------------------ */}
          <section
            id="deadline"
            className="card-enter card-enter-delay scroll-mt-6 rounded-2xl border border-warning-border bg-warning-soft p-4 shadow-card md:col-span-5 md:p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="section-label text-warning-foreground/70">{t.nextDeadline}</p>
              <span className="shrink-0 rounded-full bg-warning px-2.5 py-1 text-[11px] font-bold text-warning-foreground">
                {t.daysLeft(daysLeft)}
              </span>
            </div>

            <div className="mt-3 flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-warning text-warning-foreground">
                <CalendarClock className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-display text-base font-bold text-warning-foreground">
                  {nextDeadline.title}
                </h2>
                <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
                  <div className="min-w-0">
                    <dt className="text-[11px] font-semibold text-warning-foreground/70">
                      {t.relatedCourse}
                    </dt>
                    <dd className="truncate text-sm font-bold text-warning-foreground">
                      {nextDeadline.course} · {nextDeadline.courseCode}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[11px] font-semibold text-warning-foreground/70">
                      {t.dateLabel}
                    </dt>
                    <dd className="truncate text-sm font-bold text-warning-foreground">
                      {nextDeadline.date}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          {/* Recent grades ------------------------------------------------------- */}
          <section
            id="grades"
            className="card-enter card-enter-delay-2 scroll-mt-6 rounded-2xl border border-border bg-card p-4 shadow-card md:col-span-7 md:p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="section-label">{t.recentGrades}</p>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                {t.latestFirst}
              </span>
            </div>
            <ul className="divide-y divide-border">
              {recentGrades.map((grade) => (
                <GradeRow key={grade.code} grade={grade} resultText={t.resultLabel(grade.date)} />
              ))}
            </ul>
          </section>
        </div>
        )}

        {/* Plan ------------------------------------------------------------------- */}
        {tab === "plan" && (
          <PlanScreen lang={lang} t={t} />
        )}

        {tab === "calendar" && <CalendarScreen lang={lang} />}

        {tab === "news" && <NewsScreen lang={lang} />}

        {/* Profile --------------------------------------------------------------- */}
        {tab === "profile" && (
          <section id="profile" className="card-enter card-enter-delay-3 scroll-mt-6 md:col-span-12">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="section-label">{t.profile}</p>
                <h2 className="mt-1 font-display text-2xl font-bold md:text-3xl">
                  {student.fullName}
                </h2>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-muted-foreground">
                {t.exampleData}
              </span>
            </div>

            <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-card">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Globe className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">{t.language}</p>
                  <p className="text-sm font-bold">{lang === "en" ? t.english : t.swedish}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLang((current) => (current === "en" ? "sv" : "en"))}
                aria-label={t.switchLanguage}
                className="h-9 min-w-14 rounded-lg font-bold"
              >
                {t.languageCode}
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-12 md:gap-4">
              <div className="card-enter card-enter-delay rounded-2xl border border-border bg-card p-4 shadow-card md:col-span-5 md:p-5">
                <div className="flex items-center gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">
                    {student.initials}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-bold">{student.fullName}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {student.degreeLevel} · {student.programmeCode}
                    </p>
                  </div>
                </div>

                <dl className="mt-3 space-y-2">
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary px-3 py-2.5">
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold text-muted-foreground">
                        {t.studentId}
                      </dt>
                      <dd className="mt-0.5 truncate text-sm font-bold tracking-wide">
                        {student.studentId}
                      </dd>
                    </div>
                    <CopyButton
                      value={student.studentId}
                      label={t.studentId}
                      tone="secondary"
                      copyVerb={t.copyVerb}
                      copiedWord={t.copiedWord}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-xl bg-success-soft px-3 py-2.5">
                    <dt className="text-sm font-medium text-success">{t.studentStatus}</dt>
                    <dd className="flex items-center gap-2 text-sm font-bold text-success">
                      <span className="grid size-5 place-items-center rounded-full bg-success text-success-foreground">
                        <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                      </span>
                      {t.activeStatus}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{t.admissionYear}</p>
                    <p className="mt-1 font-display text-lg font-bold">{student.admissionYear}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{t.studyYear}</p>
                    <p className="mt-1 font-display text-lg font-bold">{student.studyYear}</p>
                  </div>
                </div>
              </div>

              <div className="card-enter card-enter-delay-2 rounded-2xl border border-border bg-card p-4 shadow-card md:col-span-7 md:p-5">
                <p className="section-label">{t.academicDetails}</p>
                <div className="mt-2 divide-y divide-border">
                  <DetailRow icon={Landmark} label={t.university} value={student.university} />
                  <DetailRow
                    icon={Building2}
                    label={t.department}
                    value={student.department}
                    chip={student.departmentCode}
                  />
                  <DetailRow icon={GraduationCap} label={t.programme} value={student.programme} />
                  <DetailRow icon={Hash} label={t.programmeCode} value={student.programmeCode} />
                  <DetailRow icon={Award} label={t.degreeLevel} value={student.degreeLevel} />
                  <DetailRow
                    icon={CalendarDays}
                    label={t.admissionYear}
                    value={student.admissionYear}
                  />
                  <DetailRow icon={Layers} label={t.studyYear} value={student.studyYear} />
                </div>
              </div>

              <div className="card-enter card-enter-delay-3 rounded-2xl border border-border bg-card p-4 shadow-card md:col-span-5 md:p-5">
                <p className="section-label">{t.contact}</p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-secondary p-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                      <Mail className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {t.universityEmail}
                      </p>
                      <a
                        href={`mailto:${student.email}`}
                        className="mt-0.5 block truncate text-sm font-bold text-primary underline-offset-4 hover:underline"
                      >
                        {student.email}
                      </a>
                    </div>
                    <CopyButton
                      value={student.email}
                      label={t.universityEmail}
                      tone="card"
                      copyVerb={t.copyVerb}
                      copiedWord={t.copiedWord}
                    />
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                      <UserRound className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {t.registeredName}
                      </p>
                      <p className="mt-0.5 text-sm font-bold">
                        {student.firstName} {student.lastName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-enter card-enter-delay-2 mt-3 rounded-2xl border border-border bg-card p-4 shadow-card md:p-5">
              <div className="flex items-center gap-2">
                <BellRing className="size-4 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-bold">{nc.notifyTitle}</h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{nc.notifyIntro}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {profilePrefKeys.map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={notifPrefs[k]}
                    onClick={() => setNotifPrefs((p) => ({ ...p, [k]: !p[k] }))}
                    className={`flex items-center justify-between gap-2 rounded-full border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                      notifPrefs[k]
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border bg-secondary text-muted-foreground"
                    }`}
                  >
                    {nc.prefs[k]}
                    <span className="shrink-0 text-xs font-semibold">{notifPrefs[k] ? nc.on : nc.off}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => go("dashboard")}
              className="mt-4 h-11 w-full gap-2 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive md:ml-auto md:flex md:w-auto md:min-w-44"
            >
              <LogOut className="size-4" aria-hidden="true" />
              {t.logOut}
            </Button>
          </section>
        )}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-3 py-2 backdrop-blur"
        aria-label="Main navigation"
      >
        <div className="mx-auto grid max-w-xl grid-cols-6">
          <NavItem
            active={tab === "dashboard"}
            onClick={() => go("dashboard")}
            icon={LayoutDashboard}
            label={t.nav.dashboard}
          />
          <NavItem
            active={tab === "progress"}
            onClick={() => go("progress")}
            icon={GraduationCap}
            label={t.nav.progress}
          />
          <NavItem active={tab === "plan"} onClick={() => go("plan")} icon={Map} label={t.nav.plan} />
          <NavItem active={tab === "calendar"} onClick={() => go("calendar")} icon={CalendarDays} label={t.nav.calendar} />
          <NavItem active={tab === "news"} onClick={() => go("news")} icon={Newspaper} label={t.nav.news} />
          <NavItem
            active={tab === "profile"}
            onClick={() => go("profile")}
            icon={UserRound}
            label={t.nav.profile}
          />
        </div>
      </nav>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------------------

type ProgressCopy = (typeof ui)[Lang];

function ProgressScreen({
  lang,
  t,
  periodFilter,
  setPeriodFilter,
  semesterFilter,
  setSemesterFilter,
  yearFilter,
  setYearFilter,
  grouping,
  setGrouping,
  selectedGrade,
  setSelectedGrade,
}: {
  lang: Lang;
  t: ProgressCopy;
  periodFilter: string;
  setPeriodFilter: (value: string) => void;
  semesterFilter: string;
  setSemesterFilter: (value: string) => void;
  yearFilter: string;
  setYearFilter: (value: string) => void;
  grouping: ProgressGrouping;
  setGrouping: (value: ProgressGrouping) => void;
  selectedGrade: Grade | null;
  setSelectedGrade: (value: Grade | null) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | "passed" | "failed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [ectsGrouping, setEctsGrouping] = useState<ProgressGrouping>("period");

  const semesterName = (semester: string) => {
    if (semester === "Spring 2026") return t.spring2026;
    if (semester === "Autumn 2025") return t.autumn2025;
    return semester;
  };

  const visiblePeriods = ectsByPeriod.filter(
    (item) =>
      (periodFilter === "all" || item.period === periodFilter) &&
      (semesterFilter === "all" || item.semester === semesterFilter) &&
      (yearFilter === "all" || yearFilter === "2025–26"),
  );

  const ectsChart = (() => {
    if (ectsGrouping === "period") {
      return visiblePeriods.map((item) => ({ ...item, label: item.period }));
    }
    if (ectsGrouping === "semester") {
      const semesters = [...new Set(visiblePeriods.map((item) => item.semester))];
      return semesters.map((semester) => ({
        label: semesterName(semester),
        earned: visiblePeriods
          .filter((item) => item.semester === semester)
          .reduce((total, item) => total + item.earned, 0),
        expected: visiblePeriods
          .filter((item) => item.semester === semester)
          .reduce((total, item) => total + item.expected, 0),
      }));
    }
    return visiblePeriods.length
      ? [
          {
            label: "2025–26",
            earned: visiblePeriods.reduce((total, item) => total + item.earned, 0),
            expected: visiblePeriods.reduce((total, item) => total + item.expected, 0),
          },
        ]
      : [];
  })();

  const filteredTrend = gradeTrend.filter(
    (item) =>
      (periodFilter === "all" || item.period === periodFilter) &&
      (semesterFilter === "all" || item.semester === semesterFilter) &&
      (yearFilter === "all" || yearFilter === "2025–26"),
  );
  const trendChart = (() => {
    if (grouping === "period") return filteredTrend.map((item) => ({ ...item, label: item.period }));
    if (grouping === "semester") {
      const semesters = [...new Set(filteredTrend.map((item) => item.semester))];
      return semesters.map((semester) => {
        const items = filteredTrend.filter((item) => item.semester === semester);
        return {
          label: semesterName(semester),
          value: items.reduce((total, item) => total + item.value, 0) / items.length,
        };
      });
    }
    return filteredTrend.length
      ? [
          {
            label: "2025–26",
            value: filteredTrend.reduce((total, item) => total + item.value, 0) / filteredTrend.length,
          },
        ]
      : [];
  })();

  const scopeCourses = completedCourses.filter(
    (course) =>
      (periodFilter === "all" || `P${course.period}` === periodFilter) &&
      (semesterFilter === "all" || course.semester === semesterFilter) &&
      (yearFilter === "all" || course.academicYear === yearFilter),
  );
  const statusFiltered = scopeCourses.filter((course) =>
    statusFilter === "all"
      ? true
      : statusFilter === "failed"
        ? course.grade === "Fail"
        : course.grade !== "Fail",
  );
  const gradeFilteredCourses = selectedGrade
    ? statusFiltered.filter((course) => course.grade === selectedGrade)
    : statusFiltered;
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase(lang === "sv" ? "sv" : "en");
  const visibleCourses = normalizedSearch
    ? gradeFilteredCourses.filter((course) =>
        `${course.name} ${course.code}`.toLocaleLowerCase(lang === "sv" ? "sv" : "en").includes(normalizedSearch),
      )
    : gradeFilteredCourses;
  const courseGroups = [...new Set(visibleCourses.map((course) => course.semester))].map((semester) => {
    const courses = visibleCourses.filter((course) => course.semester === semester);
    const average = courses.length
      ? (
          courses.reduce(
            (total, course) => total + ({ A: 5, B: 4, C: 3, D: 2, E: 1, Fail: 0 }[course.grade]),
            0,
          ) / courses.length
        ).toFixed(1)
      : "—";
    return { semester, courses, average };
  });
  const grades: Grade[] = ["A", "B", "C", "D", "E", "Fail"];
  const averageGrade = scopeCourses.length
    ? (
        scopeCourses.reduce(
          (total, course) => total + ({ A: 5, B: 4, C: 3, D: 2, E: 1, Fail: 0 }[course.grade]),
          0,
        ) / scopeCourses.length
      ).toFixed(1)
    : "—";

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="card-enter grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate font-display text-2xl font-bold md:text-3xl">{t.nav.progress}</h1>
            <span className="hidden shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[0.6875rem] font-bold text-muted-foreground sm:inline">
              {t.exampleData}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">{t.academicYear}</p>
        </div>
        <span className="shrink-0 rounded-full bg-success-soft px-3 py-1.5 text-xs font-bold text-success sm:hidden">
          {t.exampleData}
        </span>
      </div>

      <section className="card-enter card-enter-delay rounded-2xl bg-primary p-4 text-primary-foreground shadow-brand md:p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary-foreground/70">{t.overallProgress}</p>
            <p className="mt-1 font-display text-3xl font-bold leading-none">
              {progress.completedCredits}<span className="text-xl text-primary-foreground/55">/{progress.totalCredits} ECTS</span>
            </p>
          </div>
          <p className="shrink-0 font-display text-3xl font-bold">{progress.programmeProgress}</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-foreground/20">
          <div className="progress-fill h-full rounded-full bg-primary-foreground" />
        </div>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 text-sm font-semibold">
          <p className="min-w-0 text-primary-foreground/70">{progress.remainingCredits} ECTS {t.remainingCredits.toLocaleLowerCase(lang === "sv" ? "sv" : "en")}</p>
          <p className="shrink-0">{progress.passedCourses} {t.passedCourses.toLocaleLowerCase(lang === "sv" ? "sv" : "en")}</p>
        </div>
      </section>

      <div className="grid items-start gap-3 lg:grid-cols-2 lg:gap-4">
        <ProgressCard title={t.ectsProgress} description={t.ectsProgressDescription}>
          <GroupingSwitch
            value={ectsGrouping}
            onChange={setEctsGrouping}
            label={t.ectsProgress}
            options={[
              ["period", t.studyPeriods],
              ["semester", t.semesters],
              ["year", t.academicYears],
            ]}
          />
          <EctsChart data={ectsChart} earnedLabel={t.earned} expectedLabel={t.expected} />
        </ProgressCard>

        <ProgressCard title={t.gradeDevelopment} description={t.gradeDevelopmentDescription}>
          <GroupingSwitch
            value={grouping}
            onChange={setGrouping}
            label={t.gradeDevelopment}
            options={[
              ["period", t.studyPeriods],
              ["semester", t.semesters],
              ["year", t.academicYears],
            ]}
          />
          <GradeTrendChart data={trendChart} average={averageGrade} label={t.averageGrade} />
        </ProgressCard>
      </div>

      <ProgressCard title={t.gradeDistribution} description={t.gradeDistributionDescription}>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {grades.map((grade) => {
            const count = scopeCourses.filter((course) => course.grade === grade).length;
            const active = selectedGrade === grade;
            return (
              <Button
                key={grade}
                type="button"
                variant={active ? "default" : "outline"}
                onClick={() => setSelectedGrade(active ? null : grade)}
                aria-pressed={active}
                className="h-auto min-h-20 flex-col rounded-xl px-2 py-3"
              >
                <span className="font-display text-xl font-bold">{grade}</span>
                <span className="text-xs font-semibold opacity-70">{count} {t.courses}</span>
              </Button>
            );
          })}
        </div>
      </ProgressCard>

      <section className="card-enter card-enter-delay-2 space-y-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <label className="relative min-w-0">
            <span className="sr-only">{t.searchCourses}</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t.searchCourses}
              className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm font-semibold outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <Button
            type="button"
            variant={showFilters ? "default" : "outline"}
            size="icon"
            className="size-10 rounded-xl"
            aria-label={showFilters ? t.hideFilters : t.showFilters}
            aria-expanded={showFilters}
            onClick={() => setShowFilters((visible) => !visible)}
          >
            <SlidersHorizontal className="size-5" aria-hidden="true" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1" role="group" aria-label={t.passedCoursesTitle}>
          {([
            { value: "all", label: t.filterAll },
            { value: "passed", label: t.filterPassed },
            { value: "failed", label: t.filterFailed },
          ] as const).map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={statusFilter === option.value ? "default" : "ghost"}
              aria-pressed={statusFilter === option.value}
              className="h-9 rounded-lg shadow-none"
              onClick={() => {
                setStatusFilter(option.value);
                setSelectedGrade(null);
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </section>

      {showFilters && (
        <section className="rounded-2xl border border-border bg-card p-3 shadow-card md:p-4">
          <p className="section-label">{t.filters}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <FilterSelect
            label={t.studyPeriod}
            value={periodFilter}
            onChange={setPeriodFilter}
            options={[
              ["all", t.allPeriods],
              ["P1", `${t.studyPeriod} 1`],
              ["P2", `${t.studyPeriod} 2`],
              ["P3", `${t.studyPeriod} 3`],
              ["P4", `${t.studyPeriod} 4`],
            ]}
          />
          <FilterSelect
            label={t.semester}
            value={semesterFilter}
            onChange={setSemesterFilter}
            options={[
              ["all", t.allSemesters],
              ["Autumn 2025", t.autumn2025],
              ["Spring 2026", t.spring2026],
            ]}
          />
          <FilterSelect
            label={t.academicYearFilter}
            value={yearFilter}
            onChange={setYearFilter}
            options={[
              ["all", t.allYears],
              ["2025–26", "2025–26"],
            ]}
          />
          </div>
        </section>
      )}

      <section className="card-enter">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="section-label">{t.passedCoursesTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.showingCourses(visibleCourses.length)}</p>
          </div>
          {selectedGrade && (
            <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedGrade(null)}>
              {t.clearGradeFilter}
            </Button>
          )}
        </div>
        {visibleCourses.length ? (
          <div className="mt-3 space-y-4">
            {courseGroups.map((group) => (
              <div key={group.semester}>
                <div className="mb-2.5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-1">
                  <h2 className="truncate font-display text-base font-bold">{semesterName(group.semester)}</h2>
                  <p className="shrink-0 text-sm font-semibold text-muted-foreground">{t.averageGrade}: <span className="text-foreground">{group.average}</span></p>
                </div>
                <ul className="overflow-hidden rounded-2xl border border-border bg-card px-3 shadow-card md:px-4">
                  {group.courses.map((course) => (
                    <PassedCourseRow key={course.code} course={course} t={t} semester={semesterName(course.semester)} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-xl bg-secondary p-4 text-center text-sm font-semibold text-muted-foreground">
            {t.noCoursesForGrade}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className="h-11 rounded-xl bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>{optionLabel}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ProgressMetric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl bg-primary-foreground/10 p-3 md:p-4">
      <p className="text-[0.6875rem] font-semibold leading-4 text-primary-foreground/70">{label}</p>
      <p className="mt-1 font-display text-lg font-bold md:text-xl">{value}</p>
      <p className="text-[0.625rem] font-bold text-primary-foreground/60">{unit}</p>
    </div>
  );
}

function ProgressCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="card-enter rounded-2xl border border-border bg-card p-4 shadow-card md:p-5">
      <p className="section-label">{title}</p>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function GroupingSwitch({
  value,
  onChange,
  label,
  options,
}: {
  value: ProgressGrouping;
  onChange: (value: ProgressGrouping) => void;
  label: string;
  options: Array<[ProgressGrouping, string]>;
}) {
  return (
    <div
      className="mb-3 flex gap-1 overflow-x-auto rounded-full bg-secondary p-1"
      role="group"
      aria-label={label}
    >
      {options.map(([optionValue, optionLabel]) => (
        <Button
          key={optionValue}
          type="button"
          variant={value === optionValue ? "default" : "ghost"}
          size="sm"
          aria-pressed={value === optionValue}
          onClick={() => onChange(optionValue)}
          className="min-w-max flex-1 rounded-full shadow-none"
        >
          {optionLabel}
        </Button>
      ))}
    </div>
  );
}

function EctsChart({
  data,
  earnedLabel,
  expectedLabel,
}: {
  data: Array<{ label: string; earned: number; expected: number }>;
  earnedLabel: string;
  expectedLabel: string;
}) {
  const totalEarned = data.reduce((total, item) => total + item.earned, 0);
  const totalExpected = data.reduce((total, item) => total + item.expected, 0);
  const max = Math.max(15, ...data.flatMap((item) => [item.earned, item.expected]));

  if (!data.length) {
    return <div className="grid h-40 place-items-center text-sm font-semibold text-muted-foreground">—</div>;
  }

  return (
    <div aria-label="ECTS progress chart">
      <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[0.6875rem] font-bold text-muted-foreground">
          <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-primary" />{earnedLabel}</span>
          <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-success" />{expectedLabel}</span>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-xl font-bold leading-none">{totalEarned}<span className="mx-1 text-muted-foreground">/</span>{totalExpected}</p>
          <p className="mt-1 text-[0.625rem] font-bold text-muted-foreground">ECTS</p>
        </div>
      </div>
      <div className="relative mt-5 h-36">
        <div className="pointer-events-none absolute inset-x-0 top-1 bottom-7 flex flex-col justify-between">
          {[0, 1, 2, 3].map((line) => <span key={line} className="border-t border-border/70" />)}
        </div>
        <div className="absolute inset-0 grid items-end gap-2" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
          {data.map((item) => (
            <div key={item.label} className="group relative z-10 flex h-full min-w-0 flex-col items-center justify-end">
              <div
                role="tooltip"
                className="pointer-events-none absolute bottom-[calc(100%-1.25rem)] left-1/2 z-20 w-max max-w-40 -translate-x-1/2 rounded-lg border border-border bg-foreground px-3 py-2 text-left text-[0.6875rem] font-semibold leading-4 text-background opacity-0 shadow-card transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              >
                <span className="block font-bold">{item.label}</span>
                <span className="block">{earnedLabel}: {item.earned} ECTS</span>
                <span className="block">{expectedLabel}: {item.expected} ECTS</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                aria-label={`${item.label}. ${earnedLabel}: ${item.earned} ECTS. ${expectedLabel}: ${item.expected} ECTS.`}
                className="absolute inset-x-0 bottom-5 top-0 z-10 h-auto rounded-lg p-0 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="sr-only">{item.label}</span>
              </Button>
              <div className="flex h-[6.75rem] w-full items-end justify-center gap-1.5">
                <div className="flex h-full w-5 flex-col justify-end sm:w-7">
                  <span className="mb-1 text-center text-[0.625rem] font-bold text-primary">{item.earned}</span>
                  <span className="block min-h-1 rounded-t bg-primary" style={{ height: `${Math.max(4, (item.earned / max) * 76)}%` }} />
                </div>
                <div className="flex h-full w-5 flex-col justify-end sm:w-7">
                  <span className="mb-1 text-center text-[0.625rem] font-bold text-success">{item.expected}</span>
                  <span className="block min-h-1 rounded-t bg-success" style={{ height: `${Math.max(4, (item.expected / max) * 76)}%` }} />
                </div>
              </div>
              <span className="mt-2 max-w-full truncate text-center text-[0.625rem] font-bold text-muted-foreground sm:text-xs">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GradeTrendChart({ data, average, label }: { data: Array<{ label: string; value: number }>; average: string; label: string }) {
  const points = data.map((item, index) => {
    const x = data.length === 1 ? 50 : 6 + (index / (data.length - 1)) * 88;
    const y = 88 - (item.value / 5) * 72;
    return { ...item, x, y };
  });
  const linePoints = data.length === 1 ? `6,${points[0]?.y ?? 88} 94,${points[0]?.y ?? 88}` : points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = `6,88 ${linePoints} 94,88`;

  if (!data.length) {
    return <div className="grid h-40 place-items-center text-sm font-semibold text-muted-foreground">—</div>;
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-bold text-foreground">{average}</span>
          <span className="text-xs font-bold text-muted-foreground">{label}</span>
        </div>
        <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[0.625rem] font-bold text-primary">A = 5</span>
      </div>
      <div className="relative mt-4 h-40 pl-6">
        <div className="absolute inset-y-4 left-0 flex flex-col justify-between text-[0.5625rem] font-bold text-muted-foreground">
          <span>A</span><span>B</span><span>C</span><span>D</span><span>E</span>
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-32 w-full overflow-visible" aria-hidden="true">
          {[16, 34, 52, 70, 88].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} className="stroke-border" strokeWidth="0.5" />)}
          <polygon points={areaPoints} className="fill-primary/10" />
          <polyline points={linePoints} fill="none" className="stroke-primary" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point) => <circle key={`${point.label}-${point.x}`} cx={point.x} cy={point.y} r="2.8" className="fill-card stroke-primary" strokeWidth="2" vectorEffect="non-scaling-stroke" />)}
        </svg>
        <div className="absolute inset-x-6 top-0 h-32" aria-label="Grade development chart">
          {points.map((point) => (
            <div
              key={`${point.label}-interactive`}
              className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
            >
              <div
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-40 -translate-x-1/2 rounded-lg border border-border bg-foreground px-3 py-2 text-center text-[0.6875rem] font-semibold leading-4 text-background opacity-0 shadow-card transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              >
                <span className="block font-bold">{point.label}</span>
                <span className="block">{label}: {point.value.toFixed(1)}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`${point.label}. ${label}: ${point.value.toFixed(1)}.`}
                className="size-9 rounded-full p-0 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="size-2.5 rounded-full bg-primary ring-4 ring-card" aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>
        <div className="absolute inset-x-6 bottom-0 grid gap-2" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>
          {points.map((point) => (
            <span key={point.label} className="truncate text-center text-[0.625rem] font-bold text-muted-foreground sm:text-xs">
              {point.label}<span className="ml-1 text-primary">{point.value.toFixed(1)}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PassedCourseRow({ course, t, semester }: { course: (typeof completedCourses)[number]; t: ProgressCopy; semester: string }) {
  const failed = course.grade === "Fail";
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-2.5 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[0.6875rem] font-bold text-muted-foreground">{course.code} · {course.credits} {t.ectsUnit}</p>
        <h3 className={`mt-1 truncate text-sm font-bold md:text-base ${failed ? "text-destructive" : "text-primary"}`}>{course.name}</h3>
        <p className="mt-1 truncate text-[0.6875rem] font-semibold text-muted-foreground">
          {t.studyPeriod} {course.period} · {t.completedOn} {course.completed}
        </p>
      </div>
      <span className={`shrink-0 font-display text-xl font-bold ${failed ? "text-destructive" : "text-primary"}`}>{course.grade}</span>
    </li>
  );
}

type IconComponent = typeof UserRound;

function StatTile({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: IconComponent;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 font-display text-sm font-bold leading-none md:text-base">
        <Icon className="size-3 shrink-0 text-primary-foreground/60" aria-hidden="true" />
        <span className="min-w-0 truncate">
          {value}
          {unit && (
            <span className="ml-0.5 text-[10px] font-bold text-primary-foreground/70">{unit}</span>
          )}
        </span>
      </p>
      <p className="mt-1 line-clamp-2 text-[10px] font-semibold leading-3 text-primary-foreground/70">
        {label}
      </p>
    </div>
  );
}

function PlanScreen({ lang, t }: { lang: Lang; t: ProgressCopy }) {
  const [year, setYear] = useState<1 | 2>(1);
  const [semester, setSemester] = useState("all");
  const [period, setPeriod] = useState("all");
  const [kind, setKind] = useState<"all" | CourseKind>("all");
  const yearCourses = planCourses.filter((course) => course.year === year);
  const semesters = [...new Set(yearCourses.map((course) => course.semester))];
  const visible = yearCourses.filter((course) =>
    (semester === "all" || course.semester === semester) &&
    (period === "all" || course.period === period) &&
    (kind === "all" || course.kind === kind),
  );
  const visibleCourseCount = new Set(visible.map((course) => course.code)).size;
  const periodOrder = ["P1", "P2", "P3", "P4"];
  const groups = periodOrder
    .map((periodName) => ({ period: periodName, courses: visible.filter((course) => course.period === periodName) }))
    .filter((group) => group.courses.length > 0);
  const translateSemester = (value: string) => {
    if (lang === "en") return value;
    return value.replace("Autumn", "Höst").replace("Spring", "Vår");
  };

  function changeYear(next: 1 | 2) {
    setYear(next);
    setSemester("all");
    setPeriod("all");
  }

  return (
    <section id="courses" className="card-enter scroll-mt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label">{student.programmeCode}</p>
          <h1 className="mt-1 font-display text-2xl font-bold md:text-3xl">{t.planTitle}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">{t.planIntro}</p>
        </div>
        <span className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary">{t.programmeSummary}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 rounded-xl bg-secondary p-1" aria-label={t.studyYear}>
        {[1, 2].map((value) => (
          <Button key={value} type="button" variant={year === value ? "default" : "ghost"} onClick={() => changeYear(value as 1 | 2)} aria-pressed={year === value} className="h-9">
            {value === 1 ? t.yearOne : t.yearTwo}
          </Button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-card sm:grid-cols-3">
        <FilterSelect label={t.semester} value={semester} onChange={setSemester} options={[["all", t.allSemesters], ...semesters.map((value): [string, string] => [value, translateSemester(value)])]} />
        <FilterSelect label={t.studyPeriod} value={period} onChange={setPeriod} options={[["all", t.allPeriods], ...periodOrder.map((value): [string, string] => [value, `${t.studyPeriod} ${value.slice(1)}`])]} />
        <FilterSelect label={t.courseType} value={kind} onChange={(value) => setKind(value as "all" | CourseKind)} options={[["all", t.allCourseTypes], ["mandatory", t.mandatory], ["elective", t.elective]]} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold">{t.coursesFound(visibleCourseCount)}</p>
        <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Info className="size-4 text-primary" aria-hidden="true" />{t.electiveRequirement}</p>
      </div>

      {groups.length ? (
        <div className="mt-3 space-y-4">
          {groups.map((group) => {
            const firstCourse = group.courses[0];
            if (!firstCourse) return null;
            return <section key={group.period} aria-labelledby={`plan-${group.period}`}>
              <div className="mb-2 flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-primary font-display text-xs font-bold text-primary-foreground">{group.period}</span>
                <div>
                  <h2 id={`plan-${group.period}`} className="font-display text-base font-bold leading-5">{t.studyPeriod} {group.period.slice(1)}</h2>
                  <p className="text-[0.6875rem] font-semibold text-muted-foreground">{translateSemester(firstCourse.semester)}</p>
                </div>
              </div>
              <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
                {group.courses.map((course) => <PlanCourseCard key={`${course.code}-${course.period}`} course={course} t={t} lang={lang} />)}
              </div>
            </section>;
          })}
        </div>
      ) : <div className="mt-3 rounded-2xl border border-dashed border-border py-8 text-center text-sm font-semibold text-muted-foreground">{t.noPlannedCourses}</div>}
    </section>
  );
}

function PlanCourseCard({ course, t, lang }: { course: PlanCourse; t: ProgressCopy; lang: Lang }) {
  const teacherUrl = course.examiner ? teacherProfiles[course.examiner] : undefined;
  const location = course.location ?? t.defaultLocation;
  const language = course.language ?? t.defaultLanguage;
  const duration = course.spansTwoPeriods ? t.twoPeriods : t.onePeriod;
  const kthUrl = `https://www.kth.se/student/kurser/kurs/${course.code}?l=${lang === "sv" ? "sv" : "en"}`;
  const admissionUrl = lang === "sv"
    ? `https://www.antagning.se/se/search?query=${course.code}`
    : `https://www.universityadmissions.se/intl/search?query=${course.code}`;
  const facts: Array<{ icon: typeof MapPin; label: string; value: React.ReactNode }> = [
    { icon: CalendarDays, label: t.teachingDates, value: course.dates },
    { icon: Layers, label: t.periodLabel, value: course.period },
    { icon: Clock, label: t.durationLabel, value: duration },
    { icon: MapPin, label: t.locationLabel, value: location },
    { icon: Languages, label: t.languageLabel, value: language },
    {
      icon: UserRound,
      label: t.responsibleTeacher,
      value: course.examiner ? (teacherUrl ? (
        <a href={teacherUrl} target="_blank" rel="noreferrer" className="truncate text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:decoration-primary">{course.examiner}</a>
      ) : course.examiner) : t.teacherUnavailable,
    },
  ];
  return (
    <article className="flex flex-col rounded-xl border border-border bg-card p-3 shadow-card transition-colors hover:border-primary/40">
      <div className="flex items-center gap-2">
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.625rem] font-bold ${course.kind === "mandatory" ? "bg-primary-soft text-primary" : "bg-success-soft text-success"}`}>
          {course.kind === "mandatory" ? t.mandatory : t.elective}
        </span>
        <span className="truncate text-[0.6875rem] font-bold text-primary">{course.code}</span>
        <span className="ml-auto shrink-0 text-[0.6875rem] font-bold tabular-nums">{course.credits} {t.ectsUnit}</span>
      </div>
      <h3 className="mt-1.5 line-clamp-2 text-sm font-bold leading-5">{course.name}</h3>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border pt-2 text-[0.6875rem] leading-4">
        {facts.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex min-w-0 items-start gap-1.5">
            <Icon className="mt-0.5 size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="sr-only">{label}</dt>
              <dd className="truncate font-semibold text-muted-foreground" title={label}>{value}</dd>
            </div>
          </div>
        ))}
      </dl>
      <div className="mt-2.5 flex gap-2 border-t border-border pt-2.5">
        <Button asChild variant="outline" size="sm" className="h-7 flex-1 gap-1 rounded-lg px-2 text-[0.6875rem] font-bold">
          <a href={kthUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="size-3" aria-hidden="true" />
            KTH
          </a>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-7 flex-1 gap-1 rounded-lg px-2 text-[0.6875rem] font-bold">
          <a
            href={admissionUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={lang === "sv" ? "Öppna antagning.se" : "Open universityadmissions.se"}
            title={lang === "sv" ? "antagning.se" : "universityadmissions.se"}
          >
            <img src={admissionsMark} alt="" className="size-5 object-contain" aria-hidden="true" />
          </a>
        </Button>
      </div>
    </article>
  );
}

function GradeRow({
  grade,
  resultText,
}: {
  grade: (typeof recentGrades)[number];
  resultText: string;
}) {
  const failed = grade.grade === "Fail";
  return (
    <li className="flex items-center gap-3 py-2 first:pt-1 last:pb-0">
      <span className={`grid size-8 shrink-0 place-items-center rounded-lg font-display text-xs font-bold ${failed ? "bg-destructive/10 text-destructive" : "bg-success-soft text-success"}`}>
        {grade.grade}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold leading-5">{grade.name}</h3>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          <span className="truncate">{grade.code}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{resultText}</span>
        </p>
      </div>
      <p className="shrink-0 text-xs font-bold text-muted-foreground">{grade.credits}</p>
    </li>
  );
}

const notificationRowClass =
  "flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left transition-colors first:pt-2 last:pb-0 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function NotificationRow({
  note,
  t,
  onOpen,
}: {
  note: (typeof notifications)[number];
  t: ProgressCopy;
  onOpen: () => void;
}) {
  const Icon = note.icon;
  const linkLabel =
    note.linkKey === "registerOnLadok" ? t.registerOnLadok : t.applyOnAdmissions;
  const content = (
    <>
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-lg ${toneChip[note.tone]}`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
            {note.type}
            {note.push && (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary">
                {t.pushChip}
              </span>
            )}
          </p>
          {note.unread && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}
        </div>
        <h3 className="mt-1 text-sm font-bold leading-5">{note.title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{note.body}</p>
        <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          {note.time}
          {!note.href && <ChevronRight className="size-3.5 text-primary" aria-hidden="true" />}
        </p>
        {note.href && (
          <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-primary">
            {linkLabel}
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </span>
        )}
      </div>
    </>
  );

  return (
    <li>
      {note.href ? (
        <a
          href={note.href}
          target="_blank"
          rel="noreferrer"
          onClick={onOpen}
          className={notificationRowClass}
        >
          {content}
        </a>
      ) : (
        <button type="button" onClick={onOpen} className={notificationRowClass}>
          {content}
        </button>
      )}
    </li>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  chip,
}: {
  icon: IconComponent;
  label: string;
  value: string;
  chip?: string;
}) {
  return (
    <div className="grid grid-cols-[2rem_1fr] gap-3 py-2.5 first:pt-1 last:pb-0">
      <span className="grid size-8 place-items-center rounded-lg bg-secondary text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-bold leading-5 text-card-foreground">{value}</p>
        {chip && (
          <span className="mt-2 inline-flex rounded-md bg-primary-soft px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide text-primary">
            {chip}
          </span>
        )}
      </div>
    </div>
  );
}

function CopyButton({
  value,
  label,
  tone,
  copyVerb = "Copy",
  copiedWord = "copied",
}: {
  value: string;
  label: string;
  tone: "secondary" | "card";
  copyVerb?: string;
  copiedWord?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copyValue}
      aria-label={copied ? `${label} ${copiedWord}` : `${copyVerb} ${label}`}
      className={`grid size-9 shrink-0 place-items-center rounded-lg transition-colors ${
        tone === "secondary"
          ? "bg-card text-muted-foreground hover:text-primary"
          : "border border-border text-muted-foreground hover:bg-secondary hover:text-primary"
      }`}
    >
      {copied ? (
        <Check className="size-4 text-success" strokeWidth={3} aria-hidden="true" />
      ) : (
        <Copy className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}

function NavItem({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: IconComponent;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:bg-secondary hover:text-primary"
      }`}
    >
      <Icon className="size-5" aria-hidden="true" />
      <span className="text-[0.6875rem] font-bold">{label}</span>
    </button>
  );
}

// News ----------------------------------------------------------------------

type NewsCategory = "research" | "education" | "campus" | "innovation";

const newsCopy = {
  en: {
    label: "KTH News",
    title: "News from KTH",
    intro: "The latest stories from KTH. Choose which notifications you want on the Profile screen.",
    notifyTitle: "Notify me about",
    notifyIntro: "Choose which notifications you want to receive.",
    all: "All",
    on: "On",
    off: "Off",
    prefs: { research: "Research", education: "Education", campus: "Campus life", innovation: "Innovation", grades: "New grades", registration: "Registration", application: "Application" },
    read: "Read on kth.se",
    cats: { research: "Research", education: "Education", campus: "Campus life", innovation: "Innovation" },
  },
  sv: {
    label: "KTH-nyheter",
    title: "Nyheter från KTH",
    intro: "De senaste nyheterna från KTH. Välj vilka notiser du vill få på profilsidan.",
    notifyTitle: "Notiser om",
    notifyIntro: "Välj vilka notiser du vill få.",
    all: "Alla",
    on: "På",
    off: "Av",
    prefs: { research: "Forskning", education: "Utbildning", campus: "Campusliv", innovation: "Innovation", grades: "Nya betyg", registration: "Registrering", application: "Ansökan" },
    read: "Läs på kth.se",
    cats: { research: "Forskning", education: "Utbildning", campus: "Campusliv", innovation: "Innovation" },
  },
} as const;

type NotificationPrefKey = keyof (typeof newsCopy)["en"]["prefs"];

const defaultNotificationPrefs: Record<NotificationPrefKey, boolean> = {
  research: true,
  education: true,
  campus: false,
  innovation: true,
  grades: true,
  registration: true,
  application: true,
};

const profilePrefKeys: NotificationPrefKey[] = [
  "grades",
  "registration",
  "application",
  "research",
  "education",
  "campus",
  "innovation",
];

const kthNews: Array<{ id: number; category: NewsCategory; date: string; title: string; summary: string; isNew?: boolean }> = [
  { id: 1, category: "research", date: "8 Oct 2026", isNew: true, title: "New battery material could double storage capacity", summary: "KTH researchers present a sodium-based material that may make grid storage cheaper and more sustainable." },
  { id: 2, category: "innovation", date: "7 Oct 2026", isNew: true, title: "KTH Innovation opens applications for autumn idea programme", summary: "Students with a business idea can apply for coaching, funding and workspace before 30 October." },
  { id: 3, category: "education", date: "5 Oct 2026", title: "Course registration for study period 3 opens soon", summary: "Remember to register for spring courses between 15 October and 15 November in Ladok." },
  { id: 4, category: "campus", date: "3 Oct 2026", title: "Nobel Week lecture series comes to KTH Campus", summary: "Open lectures with Nobel laureates in Q-huset throughout December — free for all students." },
  { id: 5, category: "research", date: "30 Sep 2026", title: "AI model helps predict traffic congestion in Stockholm", summary: "A joint project with the City of Stockholm uses machine learning to cut commuting times." },
  { id: 6, category: "campus", date: "26 Sep 2026", title: "New study spaces open in the KTH Library", summary: "Over 200 new seats, group rooms and quiet zones are now available on the Valhallavägen campus." },
];

function NewsScreen({ lang }: { lang: Lang }) {
  const c = newsCopy[lang];
  const [filter, setFilter] = useState<NewsCategory | "all">("all");
  const cats = Object.keys(c.cats) as NewsCategory[];
  const items = kthNews.filter((n) => filter === "all" || n.category === filter);

  return (
    <section id="news" className="card-enter scroll-mt-6 space-y-3 md:col-span-12">
      <div>
        <div className="flex items-center gap-2">
          <p className="section-label">{c.label}</p>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Example data</span>
        </div>
        <h1 className="mt-1 font-display text-xl font-bold md:text-2xl">{c.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{c.intro}</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto rounded-full bg-secondary p-1">
        {(["all", ...cats] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${filter === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            {k === "all" ? c.all : c.cats[k]}
          </button>
        ))}
      </div>

      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((n) => (
          <li key={n.id} className="rounded-2xl border border-border bg-card p-3 shadow-card">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="rounded-full bg-primary-soft px-2 py-0.5 font-semibold text-primary">{c.cats[n.category]}</span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                {n.isNew && <span className="size-2 rounded-full bg-success" aria-label="New" />}
                {n.date}
              </span>
            </div>
            <h3 className="mt-1.5 text-sm font-bold leading-snug">{n.title}</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{n.summary}</p>
            <a
              href={lang === "sv" ? "https://www.kth.se/aktuellt/nyheter" : "https://www.kth.se/en/aktuellt/nyheter"}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"
            >
              {c.read} <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
