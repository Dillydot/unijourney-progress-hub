import { expect, test } from "bun:test";
import type { PlanEvent } from "./kth";
import { buildNotifications } from "./notifications";
import type { CompletedCourse } from "./student-view";

const ev = (id: string, date: string, kind: PlanEvent["kind"]): PlanEvent => ({
  id,
  date,
  kind,
  title: id,
  code: "ME2003",
  href: "https://www.student.ladok.se/",
});

test("only near-term events and recent grades become notifications", () => {
  const events = [
    ev("a-reg-close", "2026-11-10", "registration"), // past
    ev("b-reg-close", "2026-12-01", "registration"), // in 14 days
    ev("c-reg-open", "2027-02-01", "registration"), // too far
    ev("d-start", "2026-11-20", "course"),
    ev("d-end", "2026-11-25", "course"), // end days are not notified
  ];
  const grade = (code: string, sortKey: string) =>
    ({ code, sortKey, name: code, grade: "B", credits: 6, completed: sortKey }) as CompletedCourse;
  const notes = buildNotifications(
    events,
    [grade("OLD", "2026-09-01"), grade("NEW", "2026-11-05")],
    "2026-11-17",
  );
  expect(notes.map((n) => n.id)).toEqual(["b-reg-close", "d-start", "grade-NEW-2026-11-05"]);
  expect(notes[0]).toMatchObject({
    tone: "warning",
    body: "ME2003 · 1 December 2026 (in 14 days)",
  });
});
