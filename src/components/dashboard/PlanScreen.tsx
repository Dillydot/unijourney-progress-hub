import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getKthPlan, getKthProgrammes, getKthProgrammeTerms } from "@/lib/kth-api";
import { kthSyllabusUrl } from "@/lib/kth-programmes";
import { useQuery } from "@tanstack/react-query";
import { useState, type Dispatch, type SetStateAction } from "react";
import type { Lang, ProgressCopy } from "@/lib/copy";
import type { PlanCourse, ProgrammePlan } from "@/lib/kth";
import { ExternalLink, Info } from "lucide-react";

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
  cohort: string;
};

export const emptyProgrammeSelection: ProgrammeSelection = {
  degree: "",
  school: "",
  programme: null,
  cohort: "",
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
  setSelection: Dispatch<SetStateAction<ProgrammeSelection>>;
}) {
  const [browserOpen, setBrowserOpen] = useState(false);
  const [draft, setDraft] = useState(selection);
  const { degree, school } = draft;
  const draftCode = draft.programme?.code ?? "";
  const { programme: selectedProgramme, cohort } = selection;
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

  const cohorts = useQuery({
    queryKey: ["kth-programme-terms", code],
    queryFn: () => getKthProgrammeTerms({ data: code }),
    enabled: Boolean(code),
    staleTime: 12 * 60 * 60 * 1000,
  });
  const draftCohorts = useQuery({
    queryKey: ["kth-programme-terms", draftCode],
    queryFn: () => getKthProgrammeTerms({ data: draftCode }),
    enabled: browserOpen && Boolean(draftCode),
    staleTime: 12 * 60 * 60 * 1000,
  });
  const term = cohort || cohorts.data?.[0] || "";
  const selectedPlan = useQuery({
    queryKey: ["kth-programme-structure", code, term],
    queryFn: () => getKthPlan({ data: { programmeCode: code, term, includeDetails: false } }),
    enabled: Boolean(code && term),
    staleTime: 12 * 60 * 60 * 1000,
  });

  const plan = code ? selectedPlan.data : homePlan;
  const loading = code ? cohorts.isLoading || selectedPlan.isLoading : homeLoading;
  const failed = code ? cohorts.isError || selectedPlan.isError : homeFailed;
  const syllabusCode = code || (!demo && programmeCode !== "—" ? programmeCode : "");
  const syllabusTerm = code ? term : programmeTerm;

  const semesters = [
    { label: t.autumnSemester, season: "Autumn", periods: ["P1", "P2"] },
    { label: t.springSemester, season: "Spring", periods: ["P3", "P4"] },
  ];
  const registered = new Set(myCodes);

  function renderCourseGroups(courses: PlanCourse[]) {
    return (["mandatory", "elective"] as const).map((kind) => {
      const group = courses.filter((course) => course.kind === kind);
      if (!group.length) return null;

      return (
        <div key={kind}>
          <h5
            className={`mb-1 text-xs font-bold ${kind === "mandatory" ? "text-primary" : "text-success"}`}
          >
            {kind === "mandatory" ? t.mandatoryCourses : t.electiveOptions}
          </h5>
          <ul className="space-y-1">
            {group.map((course) => (
              <li key={`${course.code}-${course.applicationCode}`}>
                <PlanCourseCard
                  course={course}
                  t={t}
                  lang={lang}
                  mine={registered.has(course.code)}
                  demo={demo && !code}
                />
              </li>
            ))}
          </ul>
        </div>
      );
    });
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
            {code && term ? ` · ${term.slice(0, 4)}` : ""}
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
                    cohort: "",
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
              <ProgrammeSelect
                label={t.admissionCohort}
                value={draft.cohort}
                placeholder={t.chooseCohort}
                disabled={!draftCohorts.data?.length}
                onChange={(value) => setDraft((current) => ({ ...current, cohort: value }))}
              >
                {draftCohorts.data?.map((value) => (
                  <option key={value} value={value}>
                    {value.endsWith("2") ? t.autumnSemester : t.springSemester} {value.slice(0, 4)}
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
          {plan.notes.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-border bg-primary-soft p-3 text-sm">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <ul className="space-y-1">
                {plan.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          )}
          {Array.from({ length: Math.ceil(plan.years) }, (_, index) => index + 1).map((year) => {
            const yearCourses = plan.courses.filter((course) => course.year === year);
            const yearHeading = `plan-year-${year}`;
            const otherCourses = yearCourses.filter(
              (course) =>
                !semesters.some(
                  ({ periods, season }) =>
                    periods.includes(course.period) ||
                    (!course.period && course.semester.startsWith(season)),
                ),
            );

            return (
              <section
                key={year}
                aria-labelledby={yearHeading}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
              >
                <h2
                  id={yearHeading}
                  className="bg-primary-soft px-3 py-2 font-display text-lg font-bold text-primary"
                >
                  {t.yearN(year)}
                </h2>
                <div className="grid divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                  {semesters.map(({ label, season, periods }) => {
                    const unconfirmed = yearCourses.filter(
                      (course) => !course.period && course.semester.startsWith(season),
                    );
                    const calendarYear = yearCourses
                      .find(
                        (course) => periods.includes(course.period) || unconfirmed.includes(course),
                      )
                      ?.semester.match(/\b\d{4}\b/)?.[0];

                    return (
                      <section key={label} className="min-w-0 space-y-2 p-2.5">
                        <h3 className="font-display text-base font-bold">
                          {label}
                          {calendarYear ? ` ${calendarYear}` : ""}
                        </h3>
                        <div className="grid gap-2 min-[380px]:grid-cols-2">
                          {periods.map((period) => {
                            const periodCourses = yearCourses.filter(
                              (course) => course.period === period,
                            );

                            return (
                              <section
                                key={period}
                                className="min-w-0 space-y-2 rounded-lg bg-secondary/55 p-2"
                              >
                                <h4 className="text-sm font-bold">
                                  {t.studyPeriod} {period.slice(1)}
                                </h4>
                                {periodCourses.length === 0 ? (
                                  <p className="text-xs text-muted-foreground">
                                    {t.noPlannedCourses}
                                  </p>
                                ) : (
                                  renderCourseGroups(periodCourses)
                                )}
                              </section>
                            );
                          })}
                        </div>
                        {unconfirmed.length > 0 && (
                          <section className="space-y-2 rounded-lg bg-secondary/55 p-2">
                            <h4 className="text-sm font-bold">{t.unconfirmedStudyPeriod}</h4>
                            <div className="grid gap-2 min-[380px]:grid-cols-2">
                              {renderCourseGroups(unconfirmed)}
                            </div>
                          </section>
                        )}
                      </section>
                    );
                  })}
                </div>
                {otherCourses.length > 0 && (
                  <section className="space-y-2 border-t border-border p-2.5">
                    <h4 className="text-sm font-bold">{t.otherStudyPeriods}</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {renderCourseGroups(otherCourses)}
                    </div>
                  </section>
                )}
              </section>
            );
          })}
        </>
      )}
    </section>
  );
}

function ProgrammeSelect({
  label,
  value,
  placeholder,
  disabled,
  onChange,
  children,
}: {
  label: string;
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="min-w-0 space-y-1.5 text-xs font-semibold">
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
  t,
  lang,
  mine,
  demo,
}: {
  course: PlanCourse;
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
          {course.credits} {t.ectsUnit}
          {course.spansTwoPeriods ? ` · ${course.period}` : ""}
        </span>
        {mine && <span className="text-primary">{t.yourCourse}</span>}
      </p>
      {course.dates && (
        <p className="text-[11px] leading-tight text-muted-foreground">{course.dates}</p>
      )}
    </a>
  );
}
