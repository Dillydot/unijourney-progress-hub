// School assignments come from owningSchoolCode on KTH’s published syllabuses.
import schoolByProgramme from "./kth-programme-schools.json";

type CatalogueRow = {
  programmeCode: string;
  title: string;
  titleOtherLanguage: string;
};

export function programmesFromCatalogue(raw: unknown) {
  const { programmes } = raw as {
    programmes: [string, { first: CatalogueRow[]; second: CatalogueRow[] }][];
  };
  if (!Array.isArray(programmes)) throw new Error("KTH programme catalogue: unexpected format");

  const schools: Partial<Record<string, string>> = schoolByProgramme;
  return programmes.flatMap(([degree, { first, second }]) =>
    [...new Map([...first, ...second].map((row) => [row.programmeCode, row])).values()].map(
      (row) => ({
        code: row.programmeCode,
        title: row.title,
        titleSv: row.titleOtherLanguage,
        degree,
        school: schools[row.programmeCode] ?? "",
      }),
    ),
  );
}

export function termsFromProgramme(raw: unknown): string[] {
  const { programmeTerms } = raw as { programmeTerms: string[] };
  return (programmeTerms ?? [])
    .filter((term) => /^\d{4}[12]$/.test(term))
    .sort()
    .reverse();
}

export function kthSyllabusUrl(code: string, term: string, lang: "en" | "sv") {
  return `https://www.kth.se/student/kurser/program/${encodeURIComponent(code)}${term ? `/${encodeURIComponent(term)}/arskurs1` : ""}?l=${lang}`;
}
