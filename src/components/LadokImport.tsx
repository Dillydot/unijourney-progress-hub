import { useState } from "react";
import { CheckCircle2, ExternalLink, FileText, ShieldCheck, TriangleAlert } from "lucide-react";
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
import { supabase } from "@/lib/supabase";
import { toCourseRow } from "@/lib/student-view";

type Lang = "en" | "sv";
type Kind = "transcript" | "registration";

const copy = {
  en: {
    title: "Import your studies from Ladok",
    intro:
      "Download two PDFs from Ladok and add them here. They are read on this device and never uploaded; we only save your courses, grades and credits.",
    open: "Open Ladok",
    where: "In Ladok: Transcripts and certificates → Create",
    transcript: {
      title: "1. Official transcript of records",
      steps: [
        "Type: Official transcript of records",
        "Define: All completed courses",
        "Language: English",
        "Include: ✓ Passed modules in not completed courses, ✓ Credited education, ✓ Codes",
      ],
    },
    registration: {
      title: "2. Certificate of Registration",
      steps: [
        "Type: Certificate of Registration",
        "Select: All registrations arranged by programme",
        "Language: English",
        "Include: leave as it is (Codes must stay ticked)",
      ],
    },
    choose: "Choose PDF",
    name: "Your name (shown on your profile)",
    save: "Save to UniJourney",
    saving: "Saving…",
    cancel: "Cancel",
    ok: (n: number, hp: number) => `${n} courses · ${hp} hp`,
    summary: (programme: string, hp: number, total: number) => `${programme}: ${hp} of ${total} hp`,
    errors: {
      swedish: "This PDF is in Swedish. Create it again in Ladok with Language: English.",
      wrong_document: {
        transcript: "This isn't an Official transcript of records.",
        registration: "This isn't a Certificate of Registration.",
      },
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
      "Ladda ner två PDF:er från Ladok och lägg till dem här. De läses på den här enheten och laddas aldrig upp; vi sparar bara kurser, betyg och poäng.",
    open: "Öppna Ladok",
    where: "I Ladok: Intyg → Skapa",
    transcript: {
      title: "1. Officiellt resultatintyg",
      steps: [
        "Typ: Officiellt resultatintyg",
        "Avgränsa: Alla avslutade kurser",
        "Språk: Engelska",
        "Inkludera: ✓ Godkända moduler i ej avslutade kurser, ✓ Tillgodoräknad utbildning, ✓ Koder",
      ],
    },
    registration: {
      title: "2. Registreringsintyg",
      steps: [
        "Typ: Registreringsintyg",
        "Välj: Alla registreringar ordnade efter program",
        "Språk: Engelska",
        "Inkludera: lämna som det är (Koder måste vara ikryssat)",
      ],
    },
    choose: "Välj PDF",
    name: "Ditt namn (visas på din profil)",
    save: "Spara i UniJourney",
    saving: "Sparar…",
    cancel: "Avbryt",
    ok: (n: number, hp: number) => `${n} kurser · ${hp} hp`,
    summary: (programme: string, hp: number, total: number) => `${programme}: ${hp} av ${total} hp`,
    errors: {
      swedish: "PDF:en är på svenska. Skapa den igen i Ladok med Språk: Engelska.",
      wrong_document: {
        transcript: "Det här är inte ett officiellt resultatintyg.",
        registration: "Det här är inte ett registreringsintyg.",
      },
      missing_codes: "Kurskoder saknas. Kryssa i ”Koder för kurser, program m.m.” i Ladok.",
      no_programme:
        "Inget program hittades. Välj ”Alla registreringar ordnade efter program” i Ladok.",
      unreadable: "Vi kunde inte läsa PDF:en. Använd original-PDF:en från Ladok.",
    },
  },
};

async function pdfText(file: File) {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
  return (await extractText(pdf, { mergePages: true })).text;
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
  const [errors, setErrors] = useState<Partial<Record<Kind, string>>>({});
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function read(kind: Kind, file: File | undefined) {
    if (!file) return;
    setErrors((e) => ({ ...e, [kind]: undefined }));
    try {
      const text = await pdfText(file);
      if (kind === "transcript") setTranscript(parseTranscript(text));
      else {
        const reg = parseRegistration(text);
        if (!reg.programme) throw new LadokError("unreadable", "no programme");
        setRegistration(reg);
      }
    } catch (e) {
      const code = e instanceof LadokError ? e.code : "unreadable";
      const message =
        code === "wrong_document"
          ? t.errors.wrong_document[kind]
          : e instanceof LadokError && e.message === "no programme"
            ? t.errors.no_programme
            : t.errors[code];
      setErrors((prev) => ({ ...prev, [kind]: message }));
      if (kind === "transcript") setTranscript(null);
      else setRegistration(null);
    }
  }

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
    const { error } = await supabase.rpc("import_ladok", {
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
    setSaving(false);
    if (error) setSaveError(error.message);
    else onDone();
  }

  const docCard = (kind: Kind, parsed: { courses: unknown[] } | null, hp: number) => (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <h2 className="font-display text-base font-bold">{t[kind].title}</h2>
      <ol className="mt-2 space-y-1 text-sm text-muted-foreground">
        {t[kind].steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-bold text-primary hover:bg-secondary">
        <FileText className="size-4" aria-hidden="true" />
        {t.choose}
        <input
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => void read(kind, e.target.files?.[0])}
        />
      </label>
      {parsed && !errors[kind] && (
        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-success">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {t.ok(parsed.courses.length, hp)}
        </p>
      )}
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
    <main className="mx-auto max-w-2xl space-y-4 px-5 py-8">
      <h1 className="font-display text-2xl font-bold">{t.title}</h1>
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
        {t.intro}
      </p>
      <a
        href="https://www.student.ladok.se/"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm font-bold text-primary underline-offset-4 hover:underline"
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
            className="h-10 border-primary-foreground/30 bg-primary-foreground text-foreground"
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
