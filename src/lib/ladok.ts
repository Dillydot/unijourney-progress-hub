// Parses the text of Ladok PDF certificates (English versions) into structured data.
// Name and personal identity number are deliberately NOT extracted (GDPR: we never store them).

export type LadokGrade = "A" | "B" | "C" | "D" | "E" | "FX" | "F" | "P";

/** `code` is set when the transcript was created with "Codes" ticked (module code for parts, e.g. INL1). */
export type TranscriptCourse = {
  code: string | null;
  name: string;
  credits: number;
  grade: LadokGrade;
  date: string;
};
export type Transcript = {
  printDate: string;
  controlCode: string;
  totalCredits: number;
  courses: TranscriptCourse[];
  /** "Parts of uncompleted courses": modules already passed in courses not yet finished. */
  partial: PartialCourse[];
};
export type PartialCourse = {
  code: string | null;
  name: string;
  credits: number;
  parts: TranscriptCourse[];
};

export type RegisteredCourse = {
  code: string;
  name: string;
  credits: number;
  start: string;
  end: string;
};
export type Registration = {
  printDate: string;
  controlCode: string;
  programme: { code: string; name: string; credits: number; start: string; end: string } | null;
  courses: RegisteredCourse[];
};

export type StudentCourse = {
  code: string | null;
  name: string;
  credits: number;
  start: string | null;
  end: string | null;
  grade: LadokGrade | null;
  gradeDate: string | null;
  /** Credits already earned: all of them when completed, passed parts otherwise. */
  earnedCredits: number;
  status: "completed" | "ongoing" | "awaiting_result";
};

const DATE = String.raw`\d{4}-\d{2}-\d{2}`;
const NUM = String.raw`\d+(?:\.\d+)?`;

const lines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/** `code` tells the upload screen which Ladok setting the student has to change. */
export class LadokError extends Error {
  constructor(
    readonly code: "swedish" | "wrong_document" | "missing_codes" | "unreadable",
    message: string,
  ) {
    super(message);
  }
}

// shortcut: Swedish detected by header words only; parse Swedish PDFs if students keep picking it
function checkDocument(text: string, title: string) {
  if (/Utskriftsdatum|Resultatintyg|Registreringsintyg/.test(text))
    throw new LadokError("swedish", "The PDF is in Swedish; create it again with language English");
  if (!text.includes(title)) throw new LadokError("wrong_document", `Not a Ladok "${title}" PDF`);
}

function field(text: string, re: RegExp, what: string): string {
  const m = text.match(re);
  if (!m?.[1]) throw new LadokError("unreadable", `Ladok PDF: could not find ${what}`);
  return m[1];
}

const printDate = (text: string) =>
  field(text, new RegExp(`Print date\\s*\\n(${DATE})`), "print date");
const controlCode = (text: string) => field(text, /control code:\s*([A-Z0-9]+)/i, "control code");

export function parseTranscript(text: string): Transcript {
  checkDocument(text, "Transcript of Records");

  const row = new RegExp(`^(.*?)\\s*(${NUM}) hp (A|B|C|D|E|FX|F|P) (${DATE})(?: \\d+)?$`);
  const partHeader = new RegExp(`^(.*?)\\s*\\((${NUM}) hp\\)$`);
  const courses: TranscriptCourse[] = [];
  const partial: PartialCourse[] = [];
  let section: "completed" | "partial" | null = null;
  let pendingName = ""; // long names can wrap onto several lines before the row's tail
  const hasCodes = /^Code Name Scope Grade/m.test(text);
  // With "Codes" ticked the first word of every row is the course or module code.
  const split = (full: string) => {
    const [first = "", ...rest] = full.trim().split(" ");
    return hasCodes ? { code: first, name: rest.join(" ") } : { code: null, name: full.trim() };
  };

  for (const line of lines(text)) {
    if (line === "Completed courses") section = "completed";
    else if (line === "Parts of uncompleted courses") section = "partial";
    else if (line === "Summation") section = null;
    else if (section && !/^(Code )?Name Scope Grade/.test(line)) {
      const h = section === "partial" ? line.match(partHeader) : null;
      if (h) {
        partial.push({ ...split(pendingName + h[1]), credits: Number(h[2]), parts: [] });
        pendingName = "";
        continue;
      }
      const m = line.match(row);
      if (!m) {
        pendingName += `${line} `;
        continue;
      }
      const entry = {
        ...split(pendingName + m[1]),
        credits: Number(m[2]),
        grade: m[3] as LadokGrade,
        date: m[4]!,
      };
      pendingName = "";
      if (section === "completed") courses.push(entry);
      else {
        const parent = partial.at(-1);
        if (!parent) throw new LadokError("unreadable", "Ladok PDF: course part without a course");
        parent.parts.push(entry);
      }
    }
  }

  return {
    printDate: printDate(text),
    controlCode: controlCode(text),
    totalCredits: Number(
      field(text, new RegExp(`Credited education\\s*\\n(${NUM}) hp`), "total credits"),
    ),
    courses,
    partial,
  };
}

export function parseRegistration(text: string): Registration {
  checkDocument(text, "Certificate of Registration");

  const prog = text.match(
    new RegExp(
      `\\n([A-Z]{4,6}) ([^(]+?) \\((${NUM}) hp\\)\\s*\\nStudy period: (${DATE}) - (${DATE})`,
    ),
  );
  const programme = prog
    ? {
        code: prog[1]!,
        name: prog[2]!.replace(/\s+/g, " "),
        credits: Number(prog[3]),
        start: prog[4]!,
        end: prog[5]!,
      }
    : null;

  const head = /^([A-Z]{2}\d{3,4}[A-Z]?) (.+)$/;
  const tail = new RegExp(`^(${NUM}) hp (${DATE}) - (${DATE})`);
  const courses: RegisteredCourse[] = [];
  let current: { code: string; name: string; nameDone: boolean } | null = null;

  for (const line of lines(text)) {
    const h = line.match(head);
    if (h) {
      current = { code: h[1]!, name: h[2]!, nameDone: false };
      continue;
    }
    if (!current) continue;
    const t = line.match(tail);
    if (t) {
      courses.push({
        code: current.code,
        name: current.name,
        credits: Number(t[1]),
        start: t[2]!,
        end: t[3]!,
      });
      current = null;
    } else if (line.startsWith("Rate of study:")) current.nameDone = true;
    else if (!current.nameDone) current.name += ` ${line}`;
  }

  // Without "Codes for courses, programmes" no row starts with a course code.
  if (courses.length === 0)
    throw new LadokError(
      "missing_codes",
      'No course codes found; tick "Codes for courses, programmes, etc." in Ladok',
    );
  return { printDate: printDate(text), controlCode: controlCode(text), programme, courses };
}

const key = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");
// Match on course code when the transcript has codes, otherwise on the (English) name.
const id = (c: { code: string | null; name: string }) => c.code ?? key(c.name);
function take<T>(map: Map<string, T>, r: RegisteredCourse): T | undefined {
  for (const k of [r.code, key(r.name)]) {
    const found = map.get(k);
    if (found !== undefined) {
      map.delete(k);
      return found;
    }
  }
  return undefined;
}

/** Joins both certificates: the transcript has grades, the registration has codes and periods. */
export function mergeLadok(
  transcript: Transcript,
  registration: Registration,
  today: string,
): StudentCourse[] {
  const graded = new Map(transcript.courses.map((c) => [id(c), c]));
  const partEarned = new Map(
    transcript.partial.map((p) => [id(p), p.parts.reduce((sum, part) => sum + part.credits, 0)]),
  );
  const result: StudentCourse[] = registration.courses.map((r) => {
    const g = take(graded, r);
    return {
      code: r.code,
      name: r.name,
      credits: r.credits,
      start: r.start,
      end: r.end,
      grade: g?.grade ?? null,
      gradeDate: g?.date ?? null,
      earnedCredits: g ? r.credits : (take(partEarned, r) ?? 0),
      status: g ? "completed" : r.end >= today ? "ongoing" : "awaiting_result",
    };
  });
  // Graded courses missing from the registration (e.g. credit transfers) still count.
  for (const g of graded.values())
    result.push({
      code: g.code,
      name: g.name,
      credits: g.credits,
      start: null,
      end: null,
      grade: g.grade,
      gradeDate: g.date,
      earnedCredits: g.credits,
      status: "completed",
    });

  return result.sort((a, b) =>
    (a.start ?? a.gradeDate ?? "").localeCompare(b.start ?? b.gradeDate ?? ""),
  );
}
