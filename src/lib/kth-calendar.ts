import ICAL from "ical.js";
import type { CalendarEvent, CalendarKind } from "@/components/CalendarScreen";

export function kthCalendarUrl(input: string): URL | null {
  if (input.length > 4096) return null;
  try {
    const url = new URL(input.trim().replace(/^webcal:\/\//i, "https://"));
    const kthSocial =
      url.hostname === "www.kth.se" &&
      (/^\/social\/user\/\d+\/icalendar\/[A-Za-z0-9_-]+(?:\.ics)?\/?$/.test(url.pathname) ||
        /^\/social\/(?:[^/]+\/)*calendar\/ical(?:\/|$)/.test(url.pathname));
    const timeEdit =
      url.hostname === "cloud.timeedit.net" &&
      /^\/kth\/web\//.test(url.pathname) &&
      /\.ics$/i.test(url.pathname);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      !url.hash &&
      (kthSocial || timeEdit)
      ? url
      : null;
  } catch {
    return null;
  }
}

const stockholm = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Stockholm",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function dateAndTime(time: InstanceType<typeof ICAL.Time>) {
  const wallClock = time.toString();
  if (
    time.isDate ||
    time.zone === ICAL.Timezone.localTimezone ||
    time.zone.tzid === "Europe/Stockholm"
  ) {
    return { date: wallClock.slice(0, 10), clock: time.isDate ? "" : wallClock.slice(11, 16) };
  }
  const [date = "", clock = ""] = stockholm.format(time.toJSDate()).split(" ");
  return { date, clock };
}

function eventKind(event: InstanceType<typeof ICAL.Event>): CalendarKind | null {
  const label = `${event.summary ?? ""} ${event.component.getFirstPropertyValue("categories") ?? ""}`;
  if (/\b(exam|examination|tenta|tentamen)\b/i.test(label)) return "exam";
  if (/\b(seminar|seminarium)\b/i.test(label)) return "seminar";
  if (/\b(lecture|föreläsning)\b/i.test(label)) return "lecture";
  return null;
}

function httpsEventUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function parseKthCalendar(text: string, now = new Date()): CalendarEvent[] {
  const calendar = new ICAL.Component(ICAL.parse(text));
  if (calendar.name !== "vcalendar") throw new Error("Expected an iCalendar feed");

  const components = calendar.getAllSubcomponents("vevent");
  const exceptions = new Map<string, ICAL.Component[]>();
  for (const component of components) {
    if (!component.hasProperty("recurrence-id")) continue;
    const uid = new ICAL.Event(component).uid;
    const overrides = exceptions.get(uid) ?? [];
    overrides.push(component);
    exceptions.set(uid, overrides);
  }

  const results = new Map<string, CalendarEvent>();
  const year = 366 * 86_400_000;
  const earliest = new Date(now.getTime() - year).toISOString().slice(0, 10);
  const latest = new Date(now.getTime() + year).toISOString().slice(0, 10);
  let iterations = 0;

  function add(
    event: InstanceType<typeof ICAL.Event>,
    eventId: string,
    start: InstanceType<typeof ICAL.Time>,
    end: InstanceType<typeof ICAL.Time>,
  ) {
    if (event.component.getFirstPropertyValue("status") === "CANCELLED") return;
    const from = dateAndTime(start);
    const to = dateAndTime(end);
    const location = event.location;
    const href = httpsEventUrl(event.component.getFirstPropertyValue("url"));
    const description = event.description;
    const lastDate =
      end.isDate || (to.clock === "00:00" && to.date !== from.date)
        ? ICAL.Time.fromDateString(to.date).adjust(-1, 0, 0, 0)
        : null;
    const day = ICAL.Time.fromDateString(from.date);
    const through = lastDate?.toString() ?? to.date;

    do {
      if (++iterations > 25_000) throw new Error("Calendar is too large");
      const date = day.toString();
      const id = `kth:${event.uid}:${eventId}:${date}`;
      results.set(id, {
        id,
        date,
        kind: eventKind(event),
        title: event.summary || "KTH",
        ...(date === from.date && from.clock ? { start: from.clock } : {}),
        ...(date === to.date && to.clock && (date !== from.date || from.clock !== to.clock)
          ? { end: to.clock }
          : {}),
        ...(location ? { room: location, location } : {}),
        ...(description ? { description } : {}),
        ...(href ? { href } : {}),
      });
      day.adjust(1, 0, 0, 0);
    } while (day.toString() <= through);
  }

  for (const component of components) {
    if (component.hasProperty("recurrence-id") || !component.hasProperty("dtstart")) continue;
    const event = new ICAL.Event(component, {
      exceptions: exceptions.get(new ICAL.Event(component).uid) ?? [],
    });
    if (event.component.getFirstPropertyValue("status") === "CANCELLED") continue;
    if (!event.isRecurring()) {
      add(event, event.startDate.toString(), event.startDate, event.endDate);
      continue;
    }
    const iterator = event.iterator();
    for (let occurrence = iterator.next(); occurrence; occurrence = iterator.next()) {
      if (++iterations > 25_000) throw new Error("Calendar is too large");
      const date = occurrence.toString().slice(0, 10);
      if (date > latest) break;
      if (date < earliest) continue;
      const details = event.getOccurrenceDetails(occurrence);
      add(details.item, occurrence.toString(), details.startDate, details.endDate);
    }
  }
  return [...results.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || (a.start ?? "").localeCompare(b.start ?? ""),
  );
}
