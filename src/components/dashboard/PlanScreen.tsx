import admissionsMark from "@/assets/admissions-mark.png";
import { FilterSelect } from "@/components/dashboard/ProgressScreen";
import { Button } from "@/components/ui/button";
import type { CourseKind, PlanCourse, ProgrammePlan } from "@/lib/kth";
import { Lang, ProgressCopy } from "@/lib/copy";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  Info,
  Languages,
  Layers,
  MapPin,
  UserRound,
} from "lucide-react";
import { useState } from "react";

export function PlanScreen({
  lang,
  t,
  plan,
  loading,
  failed,
  programmeCode,
  myCodes,
}: {
  lang: Lang;
  t: ProgressCopy;
  plan: ProgrammePlan | undefined;
  loading: boolean;
  failed: boolean;
  programmeCode: string;
  myCodes: string[];
}) {
  const [year, setYear] = useState(1);
  const [semester, setSemester] = useState("all");
  const [period, setPeriod] = useState("all");
  const [kind, setKind] = useState<"all" | CourseKind>("all");
  const yearCourses = (plan?.courses ?? []).filter((course) => course.year === year);
  const semesters = [...new Set(yearCourses.map((course) => course.semester))];
  const visible = yearCourses.filter(
    (course) =>
      (semester === "all" || course.semester === semester) &&
      (period === "all" || course.period === period) &&
      (kind === "all" || course.kind === kind),
  );
  const visibleCourseCount = new Set(visible.map((course) => course.code)).size;
  const periodOrder = ["P1", "P2", "P3", "P4"];
  const groups = periodOrder
    .map((periodName) => ({
      period: periodName,
      courses: visible.filter((course) => course.period === periodName),
    }))
    .filter((group) => group.courses.length > 0);
  const translateSemester = (value: string) => {
    if (lang === "en") return value;
    return value.replace("Autumn", "Höst").replace("Spring", "Vår");
  };

  function changeYear(next: number) {
    setYear(next);
    setSemester("all");
    setPeriod("all");
  }

  return (
    <section id="courses" className="card-enter scroll-mt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label">{programmeCode}</p>
          <h1 className="mt-1 font-display text-2xl font-bold md:text-3xl">{t.planTitle}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">{t.planIntro}</p>
        </div>
        {plan && (
          <span className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary">
            {t.programmeSummary(plan.years)}
          </span>
        )}
      </div>

      {!plan ? (
        <div
          className="mt-4 rounded-2xl border border-dashed border-border py-8 text-center text-sm font-semibold text-muted-foreground"
          role={failed ? "alert" : "status"}
        >
          {loading ? t.planLoading : t.planFailed}
        </div>
      ) : (
        <>
          <div
            className="mt-4 grid rounded-xl bg-secondary p-1"
            style={{ gridTemplateColumns: `repeat(${plan.years}, minmax(0, 1fr))` }}
            aria-label={t.studyYear}
          >
            {Array.from({ length: plan.years }, (_, i) => i + 1).map((value) => (
              <Button
                key={value}
                type="button"
                variant={year === value ? "default" : "ghost"}
                onClick={() => changeYear(value)}
                aria-pressed={year === value}
                className="h-9"
              >
                {t.yearN(value)}
              </Button>
            ))}
          </div>

          <div className="mt-3 grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-card sm:grid-cols-3">
            <FilterSelect
              label={t.semester}
              value={semester}
              onChange={setSemester}
              options={[
                ["all", t.allSemesters],
                ...semesters.map((value): [string, string] => [value, translateSemester(value)]),
              ]}
            />
            <FilterSelect
              label={t.studyPeriod}
              value={period}
              onChange={setPeriod}
              options={[
                ["all", t.allPeriods],
                ...periodOrder.map((value): [string, string] => [
                  value,
                  `${t.studyPeriod} ${value.slice(1)}`,
                ]),
              ]}
            />
            <FilterSelect
              label={t.courseType}
              value={kind}
              onChange={(value) => setKind(value as "all" | CourseKind)}
              options={[
                ["all", t.allCourseTypes],
                ["mandatory", t.mandatory],
                ["elective", t.elective],
              ]}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold">{t.coursesFound(visibleCourseCount)}</p>
            {plan.notes.map((note) => (
              <p
                key={note}
                className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"
              >
                <Info className="size-4 shrink-0 text-primary" aria-hidden="true" />
                {note}
              </p>
            ))}
          </div>

          {groups.length ? (
            <div className="mt-3 space-y-4">
              {groups.map((group) => {
                const firstCourse = group.courses[0];
                if (!firstCourse) return null;
                return (
                  <section key={group.period} aria-labelledby={`plan-${group.period}`}>
                    <div className="mb-2 flex items-center gap-2.5">
                      <span className="grid size-8 place-items-center rounded-lg bg-primary font-display text-xs font-bold text-primary-foreground">
                        {group.period}
                      </span>
                      <div>
                        <h2
                          id={`plan-${group.period}`}
                          className="font-display text-base font-bold leading-5"
                        >
                          {t.studyPeriod} {group.period.slice(1)}
                        </h2>
                        <p className="text-[0.6875rem] font-semibold text-muted-foreground">
                          {translateSemester(firstCourse.semester)}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
                      {group.courses.map((course) => (
                        <PlanCourseCard
                          key={`${course.code}-${course.applicationCode}-${course.period}`}
                          course={course}
                          mine={myCodes.includes(course.code)}
                          t={t}
                          lang={lang}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-border py-8 text-center text-sm font-semibold text-muted-foreground">
              {t.noPlannedCourses}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function PlanCourseCard({
  course,
  t,
  lang,
  mine,
}: {
  course: PlanCourse;
  t: ProgressCopy;
  lang: Lang;
  mine: boolean;
}) {
  const teacherUrl = course.examinerUrl;
  const location = course.location ?? t.defaultLocation;
  const language = course.language ?? t.defaultLanguage;
  const duration = course.spansTwoPeriods ? t.twoPeriods : t.onePeriod;
  const kthUrl = `https://www.kth.se/student/kurser/kurs/${course.code}?l=${lang === "sv" ? "sv" : "en"}`;
  const admissionUrl =
    lang === "sv"
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
      value: course.examiner ? (
        teacherUrl ? (
          <a
            href={teacherUrl}
            target="_blank"
            rel="noreferrer"
            className="truncate text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:decoration-primary"
          >
            {course.examiner}
          </a>
        ) : (
          course.examiner
        )
      ) : (
        t.teacherUnavailable
      ),
    },
  ];
  return (
    <article className="flex flex-col rounded-xl border border-border bg-card p-3 shadow-card transition-colors hover:border-primary/40">
      <div className="flex items-center gap-2">
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[0.625rem] font-bold ${course.kind === "mandatory" ? "bg-primary-soft text-primary" : "bg-success-soft text-success"}`}
        >
          {course.kind === "mandatory" ? t.mandatory : t.elective}
        </span>
        <span className="truncate text-[0.6875rem] font-bold text-primary">{course.code}</span>
        {mine && (
          <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[0.625rem] font-bold text-foreground">
            {t.yourCourse}
          </span>
        )}
        <span className="ml-auto shrink-0 text-[0.6875rem] font-bold tabular-nums">
          {course.credits} {t.ectsUnit}
        </span>
      </div>
      <h3 className="mt-1.5 line-clamp-2 text-sm font-bold leading-5">{course.name}</h3>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border pt-2 text-[0.6875rem] leading-4">
        {facts.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex min-w-0 items-start gap-1.5">
            <Icon className="mt-0.5 size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="sr-only">{label}</dt>
              <dd className="truncate font-semibold text-muted-foreground" title={label}>
                {value}
              </dd>
            </div>
          </div>
        ))}
      </dl>
      <div className="mt-2.5 flex gap-2 border-t border-border pt-2.5">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-7 flex-1 gap-1 rounded-lg px-2 text-[0.6875rem] font-bold"
        >
          <a href={kthUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="size-3" aria-hidden="true" />
            KTH
          </a>
        </Button>
        {course.scheduleUrl && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 flex-1 gap-1 rounded-lg px-2 text-[0.6875rem] font-bold"
          >
            <a href={course.scheduleUrl} target="_blank" rel="noreferrer">
              <CalendarDays className="size-3" aria-hidden="true" />
              {t.schedule}
            </a>
          </Button>
        )}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-7 flex-1 gap-1 rounded-lg px-2 text-[0.6875rem] font-bold"
        >
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
