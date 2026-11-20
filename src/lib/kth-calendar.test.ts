import { expect, test } from "bun:test";
import { kthCalendarUrl } from "./kth-calendar";

test("accepts personal KTH iCalendar subscription links", () => {
  const path = "www.kth.se/social/user/123456/icalendar/sample-token";
  expect(kthCalendarUrl(`https://${path}`)?.href).toBe(`https://${path}`);
  expect(kthCalendarUrl(`webcal://${path}`)?.href).toBe(`https://${path}`);
});

test("only accepts supported calendar endpoints", () => {
  expect(kthCalendarUrl("https://www.kth.se/social/home/calendar/ical/sample")).not.toBeNull();
  expect(kthCalendarUrl("https://cloud.timeedit.net/kth/web/student/ri.ics")).not.toBeNull();
  expect(kthCalendarUrl("https://www.kth.se/social/home/calendar/settings/")).toBeNull();
  expect(kthCalendarUrl("https://www.kth.se/social/user/123456/icalendar/")).toBeNull();
  expect(kthCalendarUrl("https://example.com/social/user/123456/icalendar/sample")).toBeNull();
});
