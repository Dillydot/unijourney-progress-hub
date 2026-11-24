import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getKthPlan, getKthProgrammes } from "@/lib/kth-api";
import { cn } from "@/lib/utils";
import { kthSyllabusUrl } from "@/lib/kth-programmes";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { Lang, ProgressCopy } from "@/lib/copy";
import { plannedCredits, type PlanCourse, type ProgrammePlan } from "@/lib/kth";
import { ChevronRight, ExternalLink, Info } from "lucide-react";

const studyPeriods = ["P1", "P2", "P3", "P4"];
const courseKey = (course: PlanCourse) =>
  JSON.stringify([course.code, course.kind, course.applicationCode]);

function groupCourses(courses: PlanCourse[]) {
  const groups = new Map<string, PlanCourse[]>();
  for (const course of courses) {
    const key = courseKey(course);
    const group = groups.get(key) ?? [];
    group.push(course);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export const degreeLabels: Record<string, Record<Lang, string>> = {
  TARKU: { en: "Architecture", sv: "Arkitekt" },
  CING: { en: "Master of Science in Engineering", sv: "Civilingenjör" },
  YHOGE: { en: "Bachelor of Science in Engineering", sv: "Högskoleingenjör" },
  GKAND: { en: "Bachelor’s", sv: "Kandidat" },
  HOGSK: { en: "Higher education diploma", sv: "Högskoleexamen" },
  TMAST: { en: "Master’s", sv: "Master" },
  GMAGB: { en: "One-year master’s", sv: "Magister" },
  TBAS: { en: "Preparatory studies", sv: "Förberedande utbildning" },
  OVRIGA: { en: "Other programmes", sv: "Övriga program" },
};

export const schoolNames: Record<string, Record<Lang, string>> = {
  ABE: {
    en: "School of Architecture and the Built Environment",
    sv: "Skolan för arkitektur och samhällsbyggnad",
  },
  CBH: {
    en: "School of Engineering Sciences in Chemistry, Biotechnology and Health",
    sv: "Skolan för kemi, bioteknologi och hälsa",
  },
  EECS: {
    en: "School of Electrical Engineering and Computer Science",
    sv: "Skolan för elektroteknik och datavetenskap",
  },
  ITM: {
    en: "School of Industrial Engineering and Management",
    sv: "Skolan för industriell teknik och management",
  },
  SCI: {
    en: "School of Engineering Sciences",
    sv: "Skolan för teknikvetenskap",
  },
};

export type ProgrammeSelection = {
  degree: string;
  school: string;
  programme: { code: string; title: string; titleSv: string } | null;
};

export const emptyProgrammeSelection: ProgrammeSelection = {
  degree: "",
  school: "",
  programme: null,
};

export function PlanScreen({
  lang,
  t,
  plan: homePlan,
  loading: homeLoading,
  failed: homeFailed,
  programmeCode,
  programmeName,
  programmeTerm,
  myCodes,
  demo,
  selection,
  latestCohort,
  setSelection,
}: {
  lang: Lang;
  t: ProgressCopy;
  plan: ProgrammePlan | undefined;
  loading: boolean;
  failed: boolean;
  programmeCode: string;
  programmeName: string;
  programmeTerm: string;
  myCodes: string[];
  demo: boolean;
  selection: ProgrammeSelection;
  latestCohort: { term: string; loading: boolean; failed: boolean };
  setSelection: Dispatch<SetStateAction<ProgrammeSelection>>;
}) {
  const [browserOpen, setBrowserOpen] = useState(false);
  const [draft, setDraft] = useState(selection);
  const { degree, school } = draft;
  const draftCode = draft.programme?.code ?? "";
  const { programme: selectedProgramme } = selection;
  const code = selectedProgramme?.code ?? "";
  const catalogue = useQuery({
    queryKey: ["kth-programmes"],
    queryFn: () => getKthProgrammes(),
    staleTime: 12 * 60 * 60 * 1000,
  });
  const options = catalogue.data ?? [];
  const degrees = [...new Set(options.map((programme) => programme.degree))];
  const degreeProgrammes = options.filter((programme) => programme.degree === degree);
  const schools = [
    ...new Set(degreeProgrammes.map((programme) => programme.school || "unlisted")),
  ].sort();
  const programmeOptions = degreeProgrammes.filter(
    (programme) => (programme.school || "unlisted") === school,
  );
  const nameOf = (programme: NonNullable<ProgrammeSelection["programme"]>) =>
    (lang === "sv" ? programme.titleSv : programme.title) || programme.title;

  const { term } = latestCohort;
  const selectedPlan = useQuery({
    queryKey: ["kth-programme-structure", code, term],
    queryFn: () => getKthPlan({ data: { programmeCode: code, term, includeDetails: false } }),
    enabled: Boolean(code && term),
    staleTime: 12 * 60 * 60 * 1000,
  });

  const plan = code ? selectedPlan.data : homePlan;
  const loading = code ? latestCohort.loading || selectedPlan.isLoading : homeLoading;
  const failed = code ? latestCohort.failed || selectedPlan.isError : homeFailed;
  const syllabusCode = code || (!demo && programmeCode !== "—" ? programmeCode : "");
  const syllabusTerm = code ? term : programmeTerm;

  const semesters = [
    { label: t.autumnSemester, season: "Autumn", periods: ["P1", "P2"] },
    { label: t.springSemester, season: "Spring", periods: ["P3", "P4"] },
  ];
  const registered = new Set(myCodes);
  const [details, setDetails] = useState<{ title: string; courses: PlanCourse[] }>();
  const detailsTrigger = useRef<HTMLButtonElement>(null);
  const credits = (value: number) =>
    `${value.toLocaleString(lang, { maximumFractionDigits: 2 })} ${t.ectsUnit}`;

  function openDetails(trigger: HTMLButtonElement, title: string, courses: PlanCourse[]) {
    detailsTrigger.current = trigger;
    setDetails({ title, courses });
  }

  return (
    <section id="courses" className="card-enter scroll-mt-6 space-y-3">
      <header className="rounded-2xl border border-primary/20 bg-primary-soft px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="section-label text-primary">
            {code ? t.browseKthProgrammes : demo ? t.demoProgrammePlan : t.planTitle}
          </p>
          {(code || programmeCode !== "—") && (
            <span className="rounded-lg bg-primary px-2.5 py-1 text-xs font-extrabold text-primary-foreground">
              {code || programmeCode}
            </span>
          )}
          {plan && plan.notes.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="ml-auto rounded-full text-primary"
                  aria-label={t.programmeNotes}
                >
                  <Info className="size-4" aria-hidden="true" />
                  Info
                </Button>
              </DialogTrigger>
              <DialogContent
                aria-describedby={undefined}
                className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto overscroll-contain rounded-2xl p-4 sm:p-6"
              >
                <DialogTitle className="pr-8 leading-snug">{t.programmeNotes}</DialogTitle>
                <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                  {plan.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <h1 className="mt-2 font-display text-2xl leading-tight font-bold wrap-anywhere md:text-3xl">
          {selectedProgramme ? nameOf(selectedProgramme) : plan?.name || programmeName}
        </h1>
        {code && (
          <button
            type="button"
            onClick={() => setSelection(emptyProgrammeSelection)}
            className="mt-1 mr-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline"
          >
            {demo ? t.demoProgrammePlan : t.planTitle} · {programmeCode}
          </button>
        )}
        {syllabusCode && (
          <a
            href={kthSyllabusUrl(syllabusCode, syllabusTerm, lang)}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            {t.officialSyllabus}
            {code && term
              ? ` · ${term.endsWith("2") ? t.autumnSemester : t.springSemester} ${term.slice(0, 4)}`
              : ""}
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        )}
      </header>

      <Dialog
        open={browserOpen}
        onOpenChange={(open) => {
          if (open) setDraft(selection);
          setBrowserOpen(open);
        }}
      >
        <DialogTrigger asChild>
          <Button type="button" variant="outline" className="min-h-11 rounded-xl">
            {t.browseKthProgrammes}
          </Button>
        </DialogTrigger>
        <DialogContent
          aria-describedby={undefined}
          className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto overscroll-contain rounded-2xl p-4 sm:p-6"
        >
          <DialogTitle className="pr-8">{t.browseKthProgrammes}</DialogTitle>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!draft.programme) return;
              setSelection(draft);
              setBrowserOpen(false);
            }}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <ProgrammeSelect
                label={t.degreeType}
                value={degree}
                placeholder={t.chooseDegree}
                disabled={!catalogue.data}
                onChange={(value) => setDraft({ ...emptyProgrammeSelection, degree: value })}
              >
                {degrees.map((value) => (
                  <option key={value} value={value}>
                    {degreeLabels[value]?.[lang] ?? value}
                  </option>
                ))}
              </ProgrammeSelect>
              <ProgrammeSelect
                label={t.kthSchool}
                value={school}
                placeholder={t.chooseSchool}
                disabled={!degree}
                onChange={(value) =>
                  setDraft({ ...emptyProgrammeSelection, degree, school: value })
                }
              >
                {schools.map((value) => {
                  const name = schoolNames[value]?.[lang];
                  return (
                    <option key={value} value={value}>
                      {value === "unlisted"
                        ? t.unlistedSchool
                        : name
                          ? `${value} (${name})`
                          : value}
                    </option>
                  );
                })}
              </ProgrammeSelect>
              <ProgrammeSelect
                className="sm:col-span-2"
                label={t.programme}
                value={draftCode}
                placeholder={t.chooseProgramme}
                disabled={!school}
                onChange={(value) =>
                  setDraft({
                    degree,
                    school,
                    programme:
                      programmeOptions.find((programme) => programme.code === value) ?? null,
                  })
                }
              >
                {programmeOptions
                  .sort((a, b) => nameOf(a).localeCompare(nameOf(b), lang))
                  .map((programme) => (
                    <option key={programme.code} value={programme.code}>
                      {nameOf(programme)} ({programme.code})
                    </option>
                  ))}
              </ProgrammeSelect>
            </div>
            {catalogue.isLoading && (
              <p role="status" className="text-sm text-muted-foreground">
                {t.catalogueLoading}
              </p>
            )}
            {catalogue.isError && (
              <p role="alert" className="text-sm text-muted-foreground">
                {t.catalogueFailed}{" "}
                <a
                  href="https://www.kth.se/student/kurser/kurser-inom-program"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-primary underline"
                >
                  {t.officialSyllabus}
                </a>
              </p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={!draft.programme} className="min-h-11 rounded-xl">
                {t.chooseProgramme}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {!plan ? (
        <p
          className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground"
          role={failed ? "alert" : "status"}
        >
          {loading ? t.planLoading : code && !term && !failed ? t.noPublishedCohorts : t.planFailed}
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
              {t.mandatoryCourses}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-success" aria-hidden="true" />
              {t.electiveOptions}
            </span>
          </div>
          {[
            ...new Set([
              ...Array.from({ length: Math.ceil(plan.years) }, (_, index) => index + 1),
              ...plan.courses.map((course) => course.year),
            ]),
          ]
            .sort((a, b) => a - b)
            .map((year) => {
              const yearCourses = plan.courses.filter((course) => course.year === year);
              const yearTitle = t.yearN(year);
              const unscheduled = yearCourses.filter(
                (course) => !studyPeriods.includes(course.period),
              );
              const mandatoryCredits = plannedCredits({ ...plan, courses: yearCourses }, []);

              return (
                <section
                  key={year}
                  className="space-y-2 rounded-2xl border border-border bg-card p-2 shadow-card sm:p-4"
                >
                  <h2>
                    <button
                      type="button"
                      onClick={(event) => openDetails(event.currentTarget, yearTitle, yearCourses)}
                      className="flex min-h-11 w-full flex-wrap items-center gap-2 rounded-lg px-2 text-left hover:bg-secondary/60 focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <span className="mr-auto font-display text-lg font-bold">{yearTitle}</span>
                      {mandatoryCredits > 0 && (
                        <span className="text-xs font-semibold text-muted-foreground">
                          {credits(mandatoryCredits)} · {t.mandatoryCourses}
                        </span>
                      )}
                      <ChevronRight className="size-4 text-primary" aria-hidden="true" />
                    </button>
                  </h2>
                  <div className="grid grid-cols-2 gap-1.5">
                    {semesters.map(({ label, season, periods }) => {
                      const courses = yearCourses.filter(
                        (course) =>
                          periods.includes(course.period) ||
                          (!studyPeriods.includes(course.period) &&
                            course.semester.startsWith(season)),
                      );
                      const calendarYear = courses
                        .find((course) => course.semester.startsWith(season))
                        ?.semester.match(/\b\d{4}\b/)?.[0];
                      const title = calendarYear ? `${label} ${calendarYear}` : label;
                      return (
                        <button
                          key={season}
                          type="button"
                          className="flex min-h-10 items-center justify-center gap-1 rounded-lg bg-secondary px-1 text-center text-xs font-semibold hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-primary sm:text-sm"
                          onClick={(event) =>
                            openDetails(event.currentTarget, `${yearTitle} · ${title}`, courses)
                          }
                        >
                          {title}
                          <ChevronRight className="size-3 shrink-0" aria-hidden="true" />
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {studyPeriods.map((period) => (
                      <button
                        key={period}
                        type="button"
                        className="min-h-9 rounded-md border border-border text-xs font-bold text-primary hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-primary"
                        aria-label={`${yearTitle} · ${t.studyPeriod} ${period.slice(1)}`}
                        onClick={(event) =>
                          openDetails(
                            event.currentTarget,
                            `${yearTitle} · ${t.studyPeriod} ${period.slice(1)}`,
                            yearCourses.filter((course) => course.period === period),
                          )
                        }
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                  {(["mandatory", "elective"] as const).map((kind) => {
                    const scheduled = yearCourses.filter(
                      (course) => course.kind === kind && studyPeriods.includes(course.period),
                    );
                    const unpublished = unscheduled.filter((course) => course.kind === kind);
                    if (!scheduled.length && !unpublished.length) return null;
                    const label = kind === "mandatory" ? t.mandatoryCourses : t.electiveOptions;
                    return (
                      <div key={kind} className="space-y-1.5 border-t border-border pt-2">
                        <h3 className="px-1 text-xs font-bold">{label}</h3>
                        {scheduled.length > 0 && (
                          <div className="grid grid-flow-row-dense grid-cols-4 gap-1.5">
                            {groupCourses(scheduled).flatMap((courses) => {
                              const columns = [
                                ...new Set(
                                  courses.map((course) => studyPeriods.indexOf(course.period) + 1),
                                ),
                              ].sort((a, b) => a - b);
                              const start = columns[0] ?? 1;
                              const end = columns.at(-1) ?? start;
                              const blocks =
                                end - start + 1 === columns.length
                                  ? [{ start, end, courses }]
                                  : columns.map((column) => ({
                                      start: column,
                                      end: column,
                                      courses: courses.filter(
                                        (course) => course.period === studyPeriods[column - 1],
                                      ),
                                    }));
                              return blocks.map((block) => {
                                const first = block.courses[0]!;
                                return (
                                  <button
                                    key={`${courseKey(first)}-${block.start}`}
                                    type="button"
                                    style={{ gridColumn: `${block.start} / ${block.end + 1}` }}
                                    onClick={(event) =>
                                      openDetails(event.currentTarget, first.name, block.courses)
                                    }
                                    className={cn(
                                      "flex min-h-16 min-w-0 flex-col items-start justify-between gap-1 rounded-lg border border-transparent px-1.5 py-2 text-left hover:border-current focus-visible:outline-2 focus-visible:outline-primary sm:px-3",
                                      first.kind === "mandatory"
                                        ? "bg-primary-soft text-primary"
                                        : "bg-success-soft text-success",
                                    )}
                                  >
                                    <span className="wrap-anywhere text-xs leading-tight font-semibold text-foreground sm:text-sm">
                                      {first.name}
                                    </span>
                                    <span className="text-[10px] leading-tight font-semibold sm:text-xs">
                                      {credits(
                                        block.courses.reduce(
                                          (total, course) => total + course.credits,
                                          0,
                                        ),
                                      )}
                                      {block.start !== block.end &&
                                        ` · P${block.start}–P${block.end}`}
                                    </span>
                                  </button>
                                );
                              });
                            })}
                          </div>
                        )}
                        {unpublished.length > 0 && (
                          <div className="rounded-lg border border-dashed border-border p-2">
                            <h4 className="text-xs font-semibold text-muted-foreground">
                              {t.unconfirmedStudyPeriod}
                            </h4>
                            <ul className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                              {groupCourses(unpublished).map(
                                ([first, ...rest]) =>
                                  first && (
                                    <li key={courseKey(first)}>
                                      <button
                                        type="button"
                                        onClick={(event) =>
                                          openDetails(event.currentTarget, first.name, [
                                            first,
                                            ...rest,
                                          ])
                                        }
                                        className="flex min-h-10 w-full items-center gap-2 rounded-md bg-secondary/60 px-2 py-1 text-left hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"
                                      >
                                        <span className="min-w-0 flex-1 wrap-anywhere text-xs font-semibold">
                                          {first.name}
                                        </span>
                                        <span className="shrink-0 text-[10px] text-muted-foreground">
                                          {credits(
                                            [first, ...rest].reduce(
                                              (sum, course) => sum + course.credits,
                                              0,
                                            ),
                                          )}
                                        </span>
                                        <ChevronRight
                                          className="size-3 shrink-0 text-primary"
                                          aria-hidden="true"
                                        />
                                      </button>
                                    </li>
                                  ),
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </section>
              );
            })}
        </>
      )}
      <Dialog
        open={Boolean(details)}
        onOpenChange={(open) => {
          if (!open) setDetails(undefined);
        }}
      >
        {details && (
          <DialogContent
            aria-describedby={undefined}
            className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-2xl p-4 sm:p-6"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              detailsTrigger.current?.focus();
            }}
          >
            <DialogTitle className="pr-8 leading-snug">{details.title}</DialogTitle>
            {details.courses.length === 0 && (
              <p className="text-sm text-muted-foreground">{t.noPlannedCourses}</p>
            )}
            {(["mandatory", "elective"] as const).map((kind) => {
              const groups = groupCourses(details.courses.filter((course) => course.kind === kind));
              if (groups.length === 0) return null;
              return (
                <div key={kind} className="space-y-2">
                  <h3 className="text-sm font-bold">
                    {kind === "mandatory" ? t.mandatoryCourses : t.electiveOptions}
                  </h3>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {groups.map(
                      ([first, ...rest]) =>
                        first && (
                          <li key={courseKey(first)}>
                            <PlanCourseCard
                              course={first}
                              credits={credits(
                                first.credits +
                                  rest.reduce((sum, course) => sum + course.credits, 0),
                              )}
                              periods={[
                                ...new Set(
                                  [first, ...rest].map((course) => course.period).filter(Boolean),
                                ),
                              ]
                                .sort()
                                .join(", ")}
                              t={t}
                              lang={lang}
                              mine={registered.has(first.code)}
                              demo={demo && !code}
                            />
                          </li>
                        ),
                    )}
                  </ul>
                </div>
              );
            })}
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}

function ProgrammeSelect({
  className,
  label,
  value,
  placeholder,
  disabled,
  onChange,
  children,
}: {
  className?: string;
  label: string;
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("min-w-0 space-y-1.5 text-xs font-semibold", className)}>
      <span className="block">{label}</span>
      <select
        className="h-11 w-full min-w-0 truncate rounded-lg border border-border bg-background px-2 text-base md:text-sm focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
    </label>
  );
}

function PlanCourseCard({
  course,
  credits,
  periods,
  t,
  lang,
  mine,
  demo,
}: {
  course: PlanCourse;
  credits: string;
  periods: string;
  t: ProgressCopy;
  lang: Lang;
  mine: boolean;
  demo: boolean;
}) {
  const courseUrl = demo
    ? `https://www.kth.se/student/kurser/sokkurs?l=${lang}`
    : `https://www.kth.se/student/kurser/kurs/${encodeURIComponent(course.code)}?l=${lang}`;

  return (
    <a
      href={courseUrl}
      target="_blank"
      rel="noreferrer"
      className="block min-h-11 space-y-0.5 rounded-md border border-border bg-card px-2 py-1.5 transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-primary"
      aria-label={`${course.name} · ${demo ? t.kthCatalogue : t.officialCoursePage}`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <p className="text-xs leading-tight font-bold wrap-anywhere">{course.name}</p>
        <ExternalLink className="mt-0.5 size-3 shrink-0 text-primary" aria-hidden="true" />
      </div>
      <p className="flex flex-wrap items-center gap-x-2 text-[11px] leading-tight font-semibold text-muted-foreground">
        <span>{course.code}</span>
        <span>
          {credits} · {periods || t.unconfirmedStudyPeriod}
        </span>
        {mine && <span className="text-primary">{t.yourCourse}</span>}
      </p>
      {course.dates && (
        <p className="text-[11px] leading-tight text-muted-foreground">{course.dates}</p>
      )}
    </a>
  );
}
