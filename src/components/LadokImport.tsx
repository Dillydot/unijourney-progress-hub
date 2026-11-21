import { Fragment, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  ShieldCheck,
  Square,
  SquareCheck,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LadokError,
  mergeLadok,
  parseRegistration,
  parseTranscript,
  type Registration,
  type Transcript,
} from "@/lib/ladok";
import { getSupabase } from "@/lib/supabase";
import { toCourseRow } from "@/lib/student-view";

type Lang = "en" | "sv";
type Kind = "transcript" | "registration";

// Ladok's form labels as students see them (English UI). The PDF must be created in English.
const copy = {
  en: {
    title: "Import your studies from Ladok",
    intro:
      "Create two PDFs in Ladok and add them here. They are read on this device and never uploaded; we only save your courses, grades and credits.",
    open: "Open Ladok",
    where:
      "In Ladok, go to Transcripts and certificates → Create. Fill in the form exactly like this:",
    field: "Field",
    include: "Include",
    tick: "Tick",
    untick: "Leave empty",
    transcript: {
      title: "1. Transcript of records",
      fields: [
        ["Type", "Official transcript of records"],
        ["Define", "All completed courses"],
        ["Language", "English"],
      ],
      include: [
        ["Passed modules in not completed courses", true],
        ["Passed modules for completed courses", false],
        ["Credited education", true],
        ["Issued degrees/certificates", false],
        ["Internship", false],
        ["Codes", true],
        ["Education levels", false],
        ["Grading table per course", false],
      ],
    },
    registration: {
      title: "2. Certificate of registration",
      fields: [
        ["Type", "Certificate of Registration"],
        ["Select", "All registrations arranged by programme"],
        ["Language", "English"],
      ],
      include: [
        ["Codes for courses, programmes, etc.", true],
        ["Rate of study, teaching hours, type of instruction and study location", true],
        ["Courses with early discontinuation", false],
        ["Supervisor", false],
        ["Study activity and study funding", false],
      ],
    },
    then: "Then click Create and download the PDF.",
    drop: "Add both PDFs here",
    dropHint: "Drag them onto this box or choose files. One at a time works too.",
    choose: "Choose PDFs",
    waiting: "Waiting for this PDF",
    name: "Your name (shown on your profile)",
    save: "Save to UniJourney",
    saving: "Saving…",
    cancel: "Cancel",
    ok: (n: number, hp: number) => `${n} courses · ${hp} hp`,
    summary: (programme: string, hp: number, total: number) => `${programme}: ${hp} of ${total} hp`,
    errors: {
      swedish: "This PDF is in Swedish. Create it again in Ladok with Language: English.",
      other: "This isn't a Ladok transcript of records or certificate of registration.",
      missing_codes:
        "Course codes are missing. Tick “Codes for courses, programmes, etc.” in Ladok.",
      no_programme:
        "No programme found. Choose “All registrations arranged by programme” in Ladok.",
      unreadable: "We couldn't read this PDF. Use the original PDF downloaded from Ladok.",
    },
  },
  sv: {
    title: "Importera dina studier från Ladok",
    intro:
      "Skapa två PDF:er i Ladok och lägg till dem här. De läses på den här enheten och laddas aldrig upp; vi sparar bara kurser, betyg och poäng.",
    open: "Öppna Ladok",
    where:
      "I Ladok: Intyg → Skapa. Fyll i formuläret exakt så här (PDF:en måste vara på engelska):",
    field: "Fält",
    include: "Inkludera",
    tick: "Kryssa i",
    untick: "Lämna tom",
    transcript: {
      title: "1. Resultatintyg",
      fields: [
        ["Typ", "Officiellt resultatintyg"],
        ["Avgränsa", "Alla avslutade kurser"],
        ["Språk", "Engelska"],
      ],
      include: [
        ["Godkända moduler i ej avslutade kurser", true],
        ["Godkända moduler i avslutade kurser", false],
        ["Tillgodoräknad utbildning", true],
        ["Utfärdade examina/bevis", false],
        ["Praktik", false],
        ["Koder", true],
        ["Utbildningsnivåer", false],
        ["Betygsfördelning per kurs", false],
      ],
    },
    registration: {
      title: "2. Registreringsintyg",
      fields: [
        ["Typ", "Registreringsintyg"],
        ["Välj", "Alla registreringar ordnade efter program"],
        ["Språk", "Engelska"],
      ],
      include: [
        ["Koder för kurser, program m.m.", true],
        ["Studietakt, undervisningstid, undervisningsform och studieort", true],
        ["Kurser med tidigt avbrott", false],
        ["Handledare", false],
        ["Studieaktivitet och studiefinansiering", false],
      ],
    },
    then: "Klicka sedan på Skapa och ladda ner PDF:en.",
    drop: "Lägg till båda PDF:erna här",
    dropHint: "Dra dem hit eller välj filer. En i taget går också bra.",
    choose: "Välj PDF:er",
    waiting: "Väntar på denna PDF",
    name: "Ditt namn (visas på din profil)",
    save: "Spara i UniJourney",
    saving: "Sparar…",
    cancel: "Avbryt",
    ok: (n: number, hp: number) => `${n} kurser · ${hp} hp`,
    summary: (programme: string, hp: number, total: number) => `${programme}: ${hp} av ${total} hp`,
    errors: {
      swedish: "PDF:en är på svenska. Skapa den igen i Ladok med Språk: Engelska.",
      other: "Det här är varken ett resultatintyg eller ett registreringsintyg från Ladok.",
      missing_codes: "Kurskoder saknas. Kryssa i ”Koder för kurser, program m.m.” i Ladok.",
      no_programme:
        "Inget program hittades. Välj ”Alla registreringar ordnade efter program” i Ladok.",
      unreadable: "Vi kunde inte läsa PDF:en. Använd original-PDF:en från Ladok.",
    },
  },
} as const;

async function pdfText(file: File) {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
  return (await extractText(pdf, { mergePages: true })).text;
}

// Tells admins an import failed. Only the kind of failure is sent, never text from the PDF.
function logFailure(
  stage: "read" | "save",
  code: string,
  document: Kind | "other" | null,
  detail: string,
) {
  void getSupabase()
    .from("import_failures")
    .insert({ stage, code, document, detail: detail.slice(0, 300) })
    .then();
}

export function LadokImport({
  lang,
  defaultName,
  onDone,
  onCancel,
}: {
  lang: Lang;
  defaultName: string;
  onDone: () => void;
  onCancel?: (() => void) | undefined;
}) {
  const t = copy[lang];
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [errors, setErrors] = useState<Partial<Record<Kind | "other", string | undefined>>>({});
  const [dragging, setDragging] = useState(false);
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Students can drop both PDFs at once, in any order: try each parser and keep the one that fits.
  async function read(file: File) {
    let kind = "other" as Kind | "other";
    try {
      const text = await pdfText(file);
      try {
        kind = "transcript";
        setTranscript(parseTranscript(text));
      } catch (e) {
        if (!(e instanceof LadokError && e.code === "wrong_document")) throw e;
        kind = "registration";
        const reg = parseRegistration(text);
        if (!reg.programme) throw new LadokError("unreadable", "no programme");
        setRegistration(reg);
      }
      setErrors((prev) => ({ ...prev, [kind]: undefined, other: undefined }));
    } catch (e) {
      const code = e instanceof LadokError ? e.code : "unreadable";
      // A Swedish PDF fails before we know which document it is.
      if (code === "wrong_document" || code === "swedish") kind = "other";
      // LadokError messages are fixed strings; other errors (from the PDF reader) send only their name.
      logFailure(
        "read",
        e instanceof LadokError && e.message === "no programme" ? "no_programme" : code,
        kind,
        e instanceof LadokError ? e.message : e instanceof Error ? e.name : "unknown",
      );
      const message =
        code === "wrong_document"
          ? t.errors.other
          : e instanceof LadokError && e.message === "no programme"
            ? t.errors.no_programme
            : t.errors[code];
      setErrors((prev) => ({ ...prev, [kind]: message }));
      if (kind === "transcript") setTranscript(null);
      if (kind === "registration") setRegistration(null);
    }
  }

  const readAll = (files: FileList | null | undefined) => {
    for (const f of files ?? []) void read(f);
  };

  const merged =
    transcript && registration
      ? mergeLadok(transcript, registration, new Date().toISOString().slice(0, 10))
      : null;
  const earned = merged ? Math.round(merged.reduce((s, c) => s + c.earnedCredits, 0) * 10) / 10 : 0;

  async function save() {
    if (!merged || !registration?.programme || !transcript) return;
    setSaving(true);
    setSaveError(null);
    const p = registration.programme;
    const { error } = await getSupabase().rpc("import_ladok", {
      p_profile: {
        display_name: name.trim() || null,
        programme_code: p.code,
        programme_name: p.name,
        programme_credits: p.credits,
        programme_start: p.start,
        programme_end: p.end,
        transcript_printed: transcript.printDate,
        registration_printed: registration.printDate,
      },
      p_courses: merged.map(toCourseRow),
    });
    if (error) {
      setSaving(false);
      setSaveError(error.message);
      logFailure(
        "save",
        error.code ? "save_" + error.code.toLowerCase() : "save_error",
        null,
        error.message,
      );
    } else onDone();
  }

  const docCard = (kind: Kind, parsed: { courses: unknown[] } | null, hp: number) => (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="font-display text-base font-bold">{t[kind].title}</h2>
        {parsed && !errors[kind] ? (
          <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-success">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            {t.ok(parsed.courses.length, hp)}
          </span>
        ) : (
          <span className="shrink-0 text-xs font-semibold text-muted-foreground">{t.waiting}</span>
        )}
      </div>
      <dl className="mt-3 grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-3 wrap-anywhere gap-y-1 text-sm">
        {t[kind].fields.map(([label, value]) => (
          <Fragment key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </Fragment>
        ))}
        <dt className="text-muted-foreground">{t.include}</dt>
        <dd>
          <ul className="space-y-1">
            {t[kind].include.map(([label, on]) => (
              <li
                key={label}
                className={`flex items-start gap-2 ${on ? "font-semibold" : "text-muted-foreground"}`}
              >
                {on ? (
                  <SquareCheck
                    className="mt-0.5 size-4 shrink-0 text-success"
                    aria-label={t.tick}
                  />
                ) : (
                  <Square className="mt-0.5 size-4 shrink-0" aria-label={t.untick} />
                )}
                {label}
              </li>
            ))}
          </ul>
        </dd>
      </dl>
      <p className="mt-3 text-xs font-semibold text-muted-foreground">{t.then}</p>
      {errors[kind] && (
        <p
          className="mt-2 flex items-start gap-2 text-sm font-semibold text-destructive"
          role="alert"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {errors[kind]}
        </p>
      )}
    </section>
  );

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-5">
      <h1 className="font-display text-2xl font-bold">{t.title}</h1>
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
        {t.intro}
      </p>
      <a
        href="https://www.student.ladok.se/"
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary underline-offset-4 hover:underline"
      >
        {t.open} <ExternalLink className="size-4" aria-hidden="true" />
      </a>
      <p className="text-xs font-semibold text-muted-foreground">{t.where}</p>

      {docCard("transcript", transcript, transcript?.totalCredits ?? 0)}
      {docCard(
        "registration",
        registration,
        registration?.courses.reduce((s, c) => s + c.credits, 0) ?? 0,
      )}

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          readAll(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-4 text-center transition-colors focus-within:ring-2 focus-within:ring-primary sm:p-6 ${dragging ? "border-primary bg-primary-soft" : "border-border hover:bg-secondary"}`}
      >
        <Upload className="size-6 text-primary" aria-hidden="true" />
        <span className="font-display text-base font-bold">{t.drop}</span>
        <span className="text-sm text-muted-foreground">{t.dropHint}</span>
        <span className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-bold text-primary">
          <FileText className="size-4" aria-hidden="true" />
          {t.choose}
        </span>
        <input
          type="file"
          accept="application/pdf"
          multiple
          className="sr-only"
          onChange={(e) => {
            readAll(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {errors.other && (
        <p className="flex items-start gap-2 text-sm font-semibold text-destructive" role="alert">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {errors.other}
        </p>
      )}

      {merged && registration?.programme && (
        <section className="space-y-3 rounded-2xl bg-primary p-4 text-primary-foreground shadow-brand">
          <p className="font-display text-base font-bold">
            {t.summary(registration.programme.code, earned, registration.programme.credits)}
          </p>
          <label className="block text-sm font-semibold" htmlFor="display-name">
            {t.name}
          </label>
          <Input
            id="display-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 border-primary-foreground/30 bg-primary-foreground text-foreground"
          />
          {saveError && (
            <p className="text-sm font-semibold" role="alert">
              {saveError}
            </p>
          )}
          <Button
            type="button"
            variant="secondary"
            className="h-11 w-full"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? t.saving : t.save}
          </Button>
        </section>
      )}

      {onCancel && (
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t.cancel}
        </Button>
      )}
    </main>
  );
}
