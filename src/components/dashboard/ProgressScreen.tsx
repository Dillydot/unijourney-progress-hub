import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lang, ProgressCopy } from "@/lib/copy";
import { plannedCredits, type ProgrammePlan } from "@/lib/kth";
import { CompletedCourse, Grade, GradeScale, StudentView, averageGrade } from "@/lib/student-view";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

export type ProgressGrouping = "period" | "semester" | "year";

const scaleLabel: Record<GradeScale, string> = { "5-3": "A=5 … E=3", "5-1": "A=5 … E=1" };

export function ProgressScreen({
  view,
  plan,
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
  view: StudentView;
  plan: ProgrammePlan | undefined;
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
  const [weighted, setWeighted] = useState(true);
  const [scale, setScale] = useState<GradeScale>("5-3");

  const { progress, completedCourses, ectsByPeriod, gradeTrend } = view;
  const semesterName = (semester: string) =>
    lang === "sv" ? semester.replace("Autumn", "Höst").replace("Spring", "Vår") : semester;
  const inScope = (item: { period: string; semester: string; academicYear: string }) =>
    (periodFilter === "all" || item.period === periodFilter) &&
    (semesterFilter === "all" || item.semester === semesterFilter) &&
    (yearFilter === "all" || item.academicYear === yearFilter);

  const visiblePeriods = ectsByPeriod.filter(inScope);

  const ectsChart = (() => {
    if (ectsGrouping === "period") return visiblePeriods;
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
    const years = [...new Set(visiblePeriods.map((item) => item.academicYear))];
    return years.map((year) => {
      const items = visiblePeriods.filter((item) => item.academicYear === year);
      return {
        label: year,
        earned: items.reduce((total, item) => total + item.earned, 0),
        expected: items.reduce((total, item) => total + item.expected, 0),
      };
    });
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
        `${course.name} ${course.code}`
          .toLocaleLowerCase(lang === "sv" ? "sv" : "en")
          .includes(normalizedSearch),
      )
    : gradeFilteredCourses;
  const courseGroups = [...new Set(visibleCourses.map((course) => course.semester))].map(
    (semester) => {
      const courses = visibleCourses.filter((course) => course.semester === semester);
      return { semester, courses, average: averageGrade(courses, { weighted, scale }) };
    },
  );
  const filteredTrend = gradeTrend.filter(inScope);
  const averageOf = (courses: CompletedCourse[]) =>
    Number(averageGrade(courses, { weighted, scale }));
  const trendChart =
    grouping === "period"
      ? filteredTrend.map((s) => ({ label: s.label, value: averageOf(s.courses) }))
      : [
          ...new Set(
            filteredTrend.map((s) => (grouping === "semester" ? s.semester : s.academicYear)),
          ),
        ].map((key) => ({
          label: grouping === "semester" ? semesterName(key) : key,
          value: averageOf(
            scopeCourses.filter((c) =>
              grouping === "semester" ? c.semester === key : c.academicYear === key,
            ),
          ),
        }));
  const grades: Grade[] = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "Fail",
    ...(scopeCourses.some((c) => c.grade === "P") ? (["P"] as const) : []),
  ];
  const scopeAverage = averageGrade(scopeCourses, { weighted, scale });

  const total = Number(progress.totalCredits);
  const planned = plan ? plannedCredits(plan, view.courseCodes) : 0;
  const statusRows = [
    { label: t.completedStatus, ects: Number(progress.completedCredits), color: "bg-primary" },
    { label: t.registeredStatus, ects: progress.registeredCredits, color: "bg-warning" },
    ...(plan ? [{ label: t.plannedStatus, ects: planned, color: "bg-success" }] : []),
  ];
  const open = Math.max(0, total - statusRows.reduce((s, r) => s + r.ects, 0));
  if (plan && open > 0) statusRows.push({ label: t.openStatus, ects: open, color: "bg-secondary" });

  return (
    <div className="min-w-0 space-y-3 md:space-y-4">
      <div className="card-enter grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate font-display text-2xl font-bold md:text-3xl">
              {t.nav.progress}
            </h1>
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
              {progress.completedCredits}
              <span className="text-xl text-primary-foreground/55">
                /{progress.totalCredits} ECTS
              </span>
            </p>
          </div>
          <p className="shrink-0 font-display text-3xl font-bold">{progress.programmeProgress}</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-foreground/20">
          <div className="progress-fill h-full rounded-full bg-primary-foreground" />
        </div>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 text-sm font-semibold">
          <p className="min-w-0 text-primary-foreground/70">
            {progress.remainingCredits} ECTS{" "}
            {t.remainingCredits.toLocaleLowerCase(lang === "sv" ? "sv" : "en")}
          </p>
          <p className="shrink-0">
            {progress.passedCourses}{" "}
            {t.passedCourses.toLocaleLowerCase(lang === "sv" ? "sv" : "en")}
          </p>
        </div>
      </section>

      <ProgressCard title={t.ectsByStatus} description={t.ectsByStatusDescription}>
        <div className="flex h-3 overflow-hidden rounded-full bg-secondary">
          {statusRows.map((r) => (
            <div
              key={r.label}
              className={r.color}
              style={{ width: `${(r.ects / total) * 100}%` }}
            />
          ))}
        </div>
        <ul className="mt-3 space-y-1.5 text-sm">
          {statusRows.map((r) => (
            <li key={r.label} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2">
              <span className={`size-2.5 rounded-full ${r.color}`} aria-hidden="true" />
              <span className="min-w-0 truncate font-semibold">{r.label}</span>
              <span className="font-bold">{Math.round(r.ects * 10) / 10} ECTS</span>
              <span className="w-12 text-right text-muted-foreground">
                {Math.round((r.ects / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </ProgressCard>

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

        <ProgressCard
          title={t.gradeDevelopment}
          description={t.gradeDevelopmentDescription(scaleLabel[scale], weighted)}
        >
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
          <GroupingSwitch
            value={weighted ? "weighted" : "simple"}
            onChange={(v) => setWeighted(v === "weighted")}
            label={t.averageGrade}
            options={[
              ["weighted", t.weightedAverage],
              ["simple", t.simpleAverage],
            ]}
          />
          <GroupingSwitch
            value={scale}
            onChange={setScale}
            label={t.gradeScale}
            options={[
              ["5-3", scaleLabel["5-3"]],
              ["5-1", scaleLabel["5-1"]],
            ]}
          />
          <GradeTrendChart data={trendChart} average={scopeAverage} label={t.averageGrade} />
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
                <span className="text-xs font-semibold opacity-70">
                  {count} {t.courses}
                </span>
              </Button>
            );
          })}
        </div>
      </ProgressCard>

      <section className="card-enter card-enter-delay-2 space-y-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <label className="relative min-w-0">
            <span className="sr-only">{t.searchCourses}</span>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t.searchCourses}
              className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-base md:text-sm font-semibold outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <Button
            type="button"
            variant={showFilters ? "default" : "outline"}
            size="icon"
            className="size-11 rounded-xl"
            aria-label={showFilters ? t.hideFilters : t.showFilters}
            aria-expanded={showFilters}
            onClick={() => setShowFilters((visible) => !visible)}
          >
            <SlidersHorizontal className="size-5" aria-hidden="true" />
          </Button>
        </div>
        <div
          className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1"
          role="group"
          aria-label={t.passedCoursesTitle}
        >
          {(
            [
              { value: "all", label: t.filterAll },
              { value: "passed", label: t.filterPassed },
              { value: "failed", label: t.filterFailed },
            ] as const
          ).map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={statusFilter === option.value ? "default" : "ghost"}
              aria-pressed={statusFilter === option.value}
              className="h-auto min-h-11 whitespace-normal rounded-lg px-1 shadow-none"
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
                ...view.semesters.map((s): [string, string] => [s, semesterName(s)]),
              ]}
            />
            <FilterSelect
              label={t.academicYearFilter}
              value={yearFilter}
              onChange={setYearFilter}
              options={[
                ["all", t.allYears],
                ...view.academicYears.map((y): [string, string] => [y, y]),
              ]}
            />
          </div>
        </section>
      )}

      <section className="card-enter">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="section-label">{t.passedCoursesTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.showingCourses(visibleCourses.length)}
            </p>
          </div>
          {selectedGrade && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setSelectedGrade(null)}
            >
              {t.clearGradeFilter}
            </Button>
          )}
        </div>
        {visibleCourses.length ? (
          <div className="mt-3 space-y-4">
            {courseGroups.map((group) => (
              <div key={group.semester}>
                <div className="mb-2.5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-1">
                  <h2 className="truncate font-display text-base font-bold">
                    {semesterName(group.semester)}
                  </h2>
                  <p className="shrink-0 text-sm font-semibold text-muted-foreground">
                    {t.averageGrade}: <span className="text-foreground">{group.average}</span>
                  </p>
                </div>
                <ul className="overflow-hidden rounded-2xl border border-border bg-card px-3 shadow-card md:px-4">
                  {group.courses.map((course) => (
                    <PassedCourseRow
                      key={course.code}
                      course={course}
                      t={t}
                      semester={semesterName(course.semester)}
                    />
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

export function FilterSelect({
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
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ProgressMetric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-xl bg-primary-foreground/10 p-3 md:p-4">
      <p className="text-[0.6875rem] font-semibold leading-4 text-primary-foreground/70">{label}</p>
      <p className="mt-1 font-display text-lg font-bold md:text-xl">{value}</p>
      <p className="text-[0.625rem] font-bold text-primary-foreground/60">{unit}</p>
    </div>
  );
}

export function ProgressCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card-enter min-w-0 rounded-2xl border border-border bg-card p-4 shadow-card md:p-5">
      <p className="section-label">{title}</p>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function GroupingSwitch<T extends string>({
  value,
  onChange,
  label,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  label: string;
  options: Array<[T, string]>;
}) {
  return (
    <div
      className="mb-3 flex flex-wrap gap-1 rounded-xl bg-secondary p-1"
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
          className="h-auto min-h-11 flex-1 basis-auto whitespace-normal rounded-lg px-2 py-1.5 text-center leading-tight shadow-none"
        >
          {optionLabel}
        </Button>
      ))}
    </div>
  );
}

export function EctsChart({
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
    return (
      <div className="grid h-40 place-items-center text-sm font-semibold text-muted-foreground">
        —
      </div>
    );
  }

  return (
    <div aria-label="ECTS progress chart">
      <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[0.6875rem] font-bold text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary" />
            {earnedLabel}
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-success" />
            {expectedLabel}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-xl font-bold leading-none">
            {totalEarned}
            <span className="mx-1 text-muted-foreground">/</span>
            {totalExpected}
          </p>
          <p className="mt-1 text-[0.625rem] font-bold text-muted-foreground">ECTS</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="relative mt-10 h-36" style={{ minWidth: data.length * 44 }}>
          <div className="pointer-events-none absolute inset-x-0 top-1 bottom-7 flex flex-col justify-between">
            {[0, 1, 2, 3].map((line) => (
              <span key={line} className="border-t border-border/70" />
            ))}
          </div>
          <div
            className="absolute inset-0 grid items-end gap-2"
            style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
          >
            {data.map((item) => (
              <div
                key={item.label}
                className="group relative z-10 flex h-full min-w-0 flex-col items-center justify-end"
              >
                <div
                  role="tooltip"
                  className="pointer-events-none absolute bottom-[calc(100%-1.25rem)] left-1/2 z-20 w-max max-w-40 -translate-x-1/2 rounded-lg border border-border bg-foreground px-3 py-2 text-left text-[0.6875rem] font-semibold leading-4 text-background opacity-0 shadow-card transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  <span className="block font-bold">{item.label}</span>
                  <span className="block">
                    {earnedLabel}: {item.earned} ECTS
                  </span>
                  <span className="block">
                    {expectedLabel}: {item.expected} ECTS
                  </span>
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
                    <span className="mb-1 text-center text-[0.625rem] font-bold text-primary">
                      {item.earned}
                    </span>
                    <span
                      className="block min-h-1 rounded-t bg-primary"
                      style={{ height: `${Math.max(4, (item.earned / max) * 76)}%` }}
                    />
                  </div>
                  <div className="flex h-full w-5 flex-col justify-end sm:w-7">
                    <span className="mb-1 text-center text-[0.625rem] font-bold text-success">
                      {item.expected}
                    </span>
                    <span
                      className="block min-h-1 rounded-t bg-success"
                      style={{ height: `${Math.max(4, (item.expected / max) * 76)}%` }}
                    />
                  </div>
                </div>
                <span className="mt-2 max-w-full truncate text-center text-[0.625rem] font-bold text-muted-foreground sm:text-xs">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function GradeTrendChart({
  data,
  average,
  label,
}: {
  data: Array<{ label: string; value: number }>;
  average: string;
  label: string;
}) {
  const points = data.map((item, index) => {
    const x = data.length === 1 ? 50 : 6 + (index / (data.length - 1)) * 88;
    const y = 88 - (item.value / 5) * 72;
    return { ...item, x, y };
  });
  const linePoints =
    data.length === 1
      ? `6,${points[0]?.y ?? 88} 94,${points[0]?.y ?? 88}`
      : points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = `6,88 ${linePoints} 94,88`;

  if (!data.length) {
    return (
      <div className="grid h-40 place-items-center text-sm font-semibold text-muted-foreground">
        —
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-bold text-foreground">{average}</span>
          <span className="text-xs font-bold text-muted-foreground">{label}</span>
        </div>
        <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[0.625rem] font-bold text-primary">
          A = 5
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="relative mt-10 h-40 pl-6" style={{ minWidth: points.length * 44 + 24 }}>
          <div className="absolute inset-y-4 left-0 flex flex-col justify-between text-[0.5625rem] font-bold text-muted-foreground">
            <span>A</span>
            <span>B</span>
            <span>C</span>
            <span>D</span>
            <span>E</span>
          </div>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-32 w-full overflow-visible"
            aria-hidden="true"
          >
            {[16, 34, 52, 70, 88].map((y) => (
              <line
                key={y}
                x1="0"
                x2="100"
                y1={y}
                y2={y}
                className="stroke-border"
                strokeWidth="0.5"
              />
            ))}
            <polygon points={areaPoints} className="fill-primary/10" />
            <polyline
              points={linePoints}
              fill="none"
              className="stroke-primary"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((point) => (
              <circle
                key={`${point.label}-${point.x}`}
                cx={point.x}
                cy={point.y}
                r="2.8"
                className="fill-card stroke-primary"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          <div className="absolute top-0 right-0 left-6 h-32" aria-label="Grade development chart">
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
                  <span className="block">
                    {label}: {point.value.toFixed(1)}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`${point.label}. ${label}: ${point.value.toFixed(1)}.`}
                  className="size-10 rounded-full p-0 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span
                    className="size-2.5 rounded-full bg-primary ring-4 ring-card"
                    aria-hidden="true"
                  />
                </Button>
              </div>
            ))}
          </div>
          <div
            className="absolute right-0 bottom-0 left-6 grid gap-2"
            style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}
          >
            {points.map((point) => (
              <span
                key={point.label}
                className="truncate text-center text-[0.625rem] font-bold text-muted-foreground sm:text-xs"
              >
                {point.label}
                <span className="ml-1 text-primary">{point.value.toFixed(1)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PassedCourseRow({
  course,
  t,
  semester,
}: {
  course: CompletedCourse;
  t: ProgressCopy;
  semester: string;
}) {
  const failed = course.grade === "Fail";
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-2.5 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[0.6875rem] font-bold text-muted-foreground">
          {course.code} · {course.credits} {t.ectsUnit}
        </p>
        <h3
          className={`mt-1 truncate text-sm font-bold md:text-base ${failed ? "text-destructive" : "text-primary"}`}
        >
          {course.name}
        </h3>
        <p className="mt-1 truncate text-[0.6875rem] font-semibold text-muted-foreground">
          {t.studyPeriod} {course.period} · {t.completedOn} {course.completed}
        </p>
      </div>
      <span
        className={`shrink-0 font-display text-xl font-bold ${failed ? "text-destructive" : "text-primary"}`}
      >
        {course.grade}
      </span>
    </li>
  );
}
