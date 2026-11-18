import { CalendarScreen } from "@/components/CalendarScreen";
import {
  NewsScreen,
  NotificationPrefKey,
  defaultNotificationPrefs,
  newsCopy,
  profilePrefKeys,
} from "@/components/dashboard/NewsScreen";
import { PlanScreen } from "@/components/dashboard/PlanScreen";
import { ProgressGrouping, ProgressScreen } from "@/components/dashboard/ProgressScreen";
import {
  CopyButton,
  DetailRow,
  GradeRow,
  NavItem,
  NotificationRow,
  StatTile,
} from "@/components/dashboard/parts";
import { Button } from "@/components/ui/button";
import { eventsFromPlan, nextDeadline as findNextDeadline } from "@/lib/kth";
import { buildNotifications } from "@/lib/notifications";
import { getKthExamPeriods, getKthPlan } from "@/lib/kth-api";
import { useQuery } from "@tanstack/react-query";
import { Lang, ui } from "@/lib/copy";
import { Grade, StudentView } from "@/lib/student-view";
import {
  Award,
  Bell,
  BellRing,
  Building2,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  FileUp,
  Globe,
  GraduationCap,
  Hash,
  Landmark,
  Layers,
  LayoutDashboard,
  LogOut,
  Mail,
  Map,
  Newspaper,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";

export type Tab = "dashboard" | "progress" | "plan" | "calendar" | "news" | "profile";

export function daysUntil(iso: string) {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diff = target - now;
  return diff > 0 ? Math.ceil(diff / 86_400_000) : 0;
}

const READ_KEY = "unijourney:read-notifications";

export function Dashboard({
  view,
  lang,
  setLang,
  onReimport,
  onSignOut,
}: {
  view: StudentView;
  lang: Lang;
  setLang: React.Dispatch<React.SetStateAction<Lang>>;
  onReimport?: () => void;
  onSignOut?: () => void;
}) {
  const { student, progress } = view;
  const planQuery = useQuery({
    queryKey: ["kth-plan", student.programmeCode, view.programmeTerm],
    queryFn: () =>
      getKthPlan({
        data: { programmeCode: student.programmeCode, term: view.programmeTerm ?? "" },
      }),
    enabled: Boolean(view.programmeTerm),
    staleTime: 12 * 60 * 60 * 1000,
  });
  const plan = planQuery.data;
  const examQuery = useQuery({
    queryKey: ["kth-exam-periods"],
    queryFn: () => getKthExamPeriods(),
    staleTime: 12 * 60 * 60 * 1000,
  });
  const examEvents = examQuery.data;
  const planEvents = useMemo(
    () =>
      [...(plan ? eventsFromPlan(plan, view.courseCodes) : []), ...(examEvents ?? [])].sort(
        (a, b) => a.date.localeCompare(b.date),
      ),
    [plan, view.courseCodes, examEvents],
  );
  const today = new Date().toISOString().slice(0, 10);
  const deadline = plan ? findNextDeadline(planEvents, plan.courses, today) : null;
  const daysLeft = deadline ? daysUntil(deadline.iso) : 0;
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(READ_KEY) ?? "[]") as string[];
    } catch {
      return [];
    }
  });
  const markRead = (ids: string[]) =>
    setReadIds((current) => {
      const next = [...new Set([...current, ...ids])].slice(-200);
      try {
        localStorage.setItem(READ_KEY, JSON.stringify(next));
      } catch {
        // Private mode or blocked storage: read state lasts for this visit only.
      }
      return next;
    });
  const notes = useMemo(
    () =>
      buildNotifications(planEvents, view.completedCourses, today).map((n) => ({
        ...n,
        unread: !readIds.includes(n.id),
      })),
    [planEvents, view.completedCourses, today, readIds],
  );
  const nc = newsCopy[lang];
  const [notifPrefs, setNotifPrefs] =
    useState<Record<NotificationPrefKey, boolean>>(defaultNotificationPrefs);
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
    <div
      className="min-h-screen bg-background pb-28 text-foreground"
      style={{ "--progress": `${progress.progressPercent}%` } as React.CSSProperties}
    >
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
                  onClick={() => markRead(notes.map((note) => note.id))}
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
                    key={note.id}
                    note={note}
                    t={t}
                    onOpen={() => {
                      markRead([note.id]);
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
            <h1 className="mt-0.5 font-display text-2xl font-bold md:text-4xl">
              {t.greeting(student.firstName)}
            </h1>
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
            className="card-enter card-enter-delay mb-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:mb-6 md:p-4"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground">
              {student.initials}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-sm font-bold leading-5">
                {student.fullName}
              </h2>
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
            className="card-enter mb-4 scroll-mt-6 cursor-pointer rounded-2xl bg-primary p-4 text-primary-foreground shadow-brand transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:mb-6 md:p-5"
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
            view={view}
            plan={plan}
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
          <div className="grid gap-4 md:grid-cols-12 md:gap-6">
            {/* Next registration deadline ------------------------------------------ */}
            {deadline && (
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
                      {deadline.title}
                    </h2>
                    <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
                      <div className="min-w-0">
                        <dt className="text-[11px] font-semibold text-warning-foreground/70">
                          {t.relatedCourse}
                        </dt>
                        <dd className="truncate text-sm font-bold text-warning-foreground">
                          {deadline.course} · {deadline.courseCode}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-[11px] font-semibold text-warning-foreground/70">
                          {t.dateLabel}
                        </dt>
                        <dd className="truncate text-sm font-bold text-warning-foreground">
                          {deadline.date}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </section>
            )}

            {/* Recent grades ------------------------------------------------------- */}
            <section
              id="grades"
              className={`card-enter card-enter-delay-2 scroll-mt-6 rounded-2xl border border-border bg-card p-4 shadow-card md:p-5 ${deadline ? "md:col-span-7" : "md:col-span-12"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="section-label">{t.recentGrades}</p>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                  {t.latestFirst}
                </span>
              </div>
              <ul className="divide-y divide-border">
                {view.recentGrades.map((grade) => (
                  <GradeRow key={grade.code} grade={grade} resultText={t.resultLabel(grade.date)} />
                ))}
              </ul>
            </section>
          </div>
        )}

        {/* Plan ------------------------------------------------------------------- */}
        {tab === "plan" && (
          <PlanScreen
            lang={lang}
            t={t}
            plan={plan}
            loading={planQuery.isLoading}
            failed={planQuery.isError}
            programmeCode={student.programmeCode}
            myCodes={view.courseCodes}
          />
        )}

        {tab === "calendar" && <CalendarScreen lang={lang} events={planEvents} />}

        {tab === "news" && <NewsScreen lang={lang} />}

        {/* Profile --------------------------------------------------------------- */}
        {tab === "profile" && (
          <section
            id="profile"
            className="card-enter card-enter-delay-3 scroll-mt-6 md:col-span-12"
          >
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
                    <h3 className="truncate font-display text-base font-bold">
                      {student.fullName}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {student.degreeLevel} · {student.programmeCode}
                    </p>
                  </div>
                </div>

                <dl className="mt-3 space-y-2">
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary px-3 py-2.5">
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold text-muted-foreground">{t.studentId}</dt>
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
                    <span className="shrink-0 text-xs font-semibold">
                      {notifPrefs[k] ? nc.on : nc.off}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={onReimport}
              disabled={!onReimport}
              className="mt-4 h-11 w-full gap-2 rounded-xl md:w-auto md:min-w-44"
            >
              <FileUp className="size-4" aria-hidden="true" />
              {t.updateFromLadok}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onSignOut}
              disabled={!onSignOut}
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
          <NavItem
            active={tab === "plan"}
            onClick={() => go("plan")}
            icon={Map}
            label={t.nav.plan}
          />
          <NavItem
            active={tab === "calendar"}
            onClick={() => go("calendar")}
            icon={CalendarDays}
            label={t.nav.calendar}
          />
          <NavItem
            active={tab === "news"}
            onClick={() => go("news")}
            icon={Newspaper}
            label={t.nav.news}
          />
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
