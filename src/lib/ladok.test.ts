import { expect, test } from "bun:test";
import { LadokError, mergeLadok, parseRegistration, parseTranscript } from "./ladok";

// Fake student; layout copied from real KTH/Ladok PDF text as extracted by unpdf.
const transcript = `Official Transcript of Records Print date
2026-09-14
Name Personal identity number
Jane Doe 19990101-0000
Completed courses
Name Scope Grade Date Note
Technology-based Entrepreneurship 7.5 hp B 2025-10-09 1
A Very Long Course Name That Wraps Onto
Two Lines 6.0 hp A 2026-06-05 1
Transferred Course 5.0 hp P 2026-01-01
Parts of uncompleted courses
Name Scope Grade Date Note
Research Methods in Industrial Engineering and
Management
(7.5 hp)
Assignment 1.0 hp P 2026-09-04 2
Assignments 1.0 hp P 2026-09-18 2
Summation
Total included credited parts Credited education
20.5 hp
Notes and information
Check the certificate on: https://student.ladok.se/verifiera/ Personal identity number: 19990101-0000
Verifiable until: 2026-12-13 Control code: ABC123XYZ9`;

const registration = `Certificate of Registration Print date
2026-09-28
Name Personal identity number
Jane Doe 19990101-0000
TTBEM Master's Programme, Technology-based
Entrepreneurship (120.0 hp)
Study period: 2025-08-25 - 2027-05-31
Registered on
Code Name Scope Period Notes
ME2003 Research Methods in Industrial Engineering
and Management
Rate of study: 25 %, Teaching hours: Day-time, Type
of instruction: Normal teaching, Study location: KTH
Campus
7.5 hp 2026-08-24 - 2027-01-11
ME2188 Luxury Strategy and Business Reality
Rate of study: 25 %, Teaching hours: Day-time
3.0 hp 2026-08-24 - 2026-10-23
Check the certificate on: https://student.ladok.se/verifiera/ Personal identity number: 19990101-0000
Verifiable until: 2026-12-27 control code: QWE456RTY0
Page 1 / 2
Jane Doe Certificate of Registration KTH Royal Institute of
Technology
19990101-0000 2026-09-28
Code Name Scope Period Notes
ME2620 Technology-based Entrepreneurship
Rate of study: 50 %, Teaching hours: Day-time
7.5 hp 2025-08-25 - 2025-10-24
ME2999 A Very Long Course Name That Wraps
Onto Two Lines
Rate of study: 50 %
6.0 hp 2026-03-16 - 2026-06-01
Notes and information`;

test("parses transcript, including wrapped names", () => {
  const t = parseTranscript(transcript);
  expect(t.printDate).toBe("2026-09-14");
  expect(t.controlCode).toBe("ABC123XYZ9");
  expect(t.totalCredits).toBe(20.5);
  expect(t.courses.map((c) => c.name)).toEqual([
    "Technology-based Entrepreneurship",
    "A Very Long Course Name That Wraps Onto Two Lines",
    "Transferred Course",
  ]);
  expect(t.partial).toEqual([
    {
      name: "Research Methods in Industrial Engineering and Management",
      credits: 7.5,
      parts: [
        { name: "Assignment", credits: 1, grade: "P", date: "2026-09-04" },
        { name: "Assignments", credits: 1, grade: "P", date: "2026-09-18" },
      ],
    },
  ]);
  const earned = [...t.courses, ...t.partial.flatMap((p) => p.parts)].reduce((s, c) => s + c.credits, 0);
  expect(earned).toBe(t.totalCredits);
  expect(JSON.stringify(t)).not.toContain("19990101"); // never extract the personal number
});

test("parses registration across a page break", () => {
  const r = parseRegistration(registration);
  expect(r.programme).toEqual({
    code: "TTBEM",
    name: "Master's Programme, Technology-based Entrepreneurship",
    credits: 120,
    start: "2025-08-25",
    end: "2027-05-31",
  });
  expect(r.courses.map((c) => `${c.code} ${c.name} ${c.credits}`)).toEqual([
    "ME2003 Research Methods in Industrial Engineering and Management 7.5",
    "ME2188 Luxury Strategy and Business Reality 3",
    "ME2620 Technology-based Entrepreneurship 7.5",
    "ME2999 A Very Long Course Name That Wraps Onto Two Lines 6",
  ]);
});

test("merges grades with codes and derives status", () => {
  const merged = mergeLadok(parseTranscript(transcript), parseRegistration(registration), "2026-11-16");
  const byName = Object.fromEntries(merged.map((c) => [c.name, c]));
  expect(byName["Technology-based Entrepreneurship"]).toMatchObject({ code: "ME2620", grade: "B", status: "completed" });
  expect(byName["Research Methods in Industrial Engineering and Management"]).toMatchObject({
    status: "ongoing",
    earnedCredits: 2,
  });
  expect(merged.reduce((s, c) => s + c.earnedCredits, 0)).toBe(20.5);
  expect(byName["Luxury Strategy and Business Reality"]?.status).toBe("awaiting_result");
  expect(byName["Transferred Course"]).toMatchObject({ code: null, status: "completed" });
});

const errorCode = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return e instanceof LadokError ? e.code : "other";
  }
  return "none";
};

test("tells the student which Ladok setting is wrong", () => {
  expect(errorCode(() => parseTranscript(registration))).toBe("wrong_document");
  expect(errorCode(() => parseRegistration(transcript))).toBe("wrong_document");
  expect(errorCode(() => parseTranscript("Officiellt resultatintyg Utskriftsdatum\n2026-11-16"))).toBe("swedish");
});
