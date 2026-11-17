import { useMemo, useState } from "react";
import { Bell, BellRing, ChevronLeft, ChevronRight, ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Lang = "en" | "sv";
export type CalendarKind = "course" | "lecture" | "seminar" | "exam" | "application" | "registration";

export type CalendarEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  start?: string;
  end?: string;
  kind: CalendarKind;
  title: string;
  code?: string;
  room?: string;
  location?: string; // street address used for the Google Maps link
  href?: string;
};

const copy = {
  en: {
    title: "Calendar",
    intro: "Course dates, exam periods and registration deadlines from kth.se. Open a course for its full schedule in TimeEdit.",
    example: "From kth.se",
    week: "Week",
    month: "Month",
    today: "Today",
    prev: "Previous",
    next: "Next",
    weekShort: "Week",
    nothing: "Nothing scheduled",
    allDay: "All day",
    open: "Open",
    openMaps: "Open in Google Maps",
    setReminder: "Remind me",
    removeReminder: "Remove reminder",
    reminderOn: "Reminder on",
    remindersSet: "reminders set",
    kinds: {
      course: "Course",
      lecture: "Lecture",
      seminar: "Seminar",
      exam: "Exam",
      application: "Application",
      registration: "Registration",
    },
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    locale: "en-GB",
  },
  sv: {
    title: "Kalender",
    intro: "Kursdatum, tentaperioder och anmälningsdatum från kth.se. Öppna en kurs för hela schemat i TimeEdit.",
    example: "Från kth.se",
    week: "Vecka",
    month: "Månad",
    today: "Idag",
    prev: "Föregående",
    next: "Nästa",
    weekShort: "Vecka",
    nothing: "Inget planerat",
    allDay: "Heldag",
    open: "Öppna",
    openMaps: "Öppna i Google Maps",
    setReminder: "Påminn mig",
    removeReminder: "Ta bort påminnelse",
    reminderOn: "Påminnelse på",
    remindersSet: "påminnelser satta",
    kinds: {
      course: "Kurs",
      lecture: "Föreläsning",
      seminar: "Seminarium",
      exam: "Tenta",
      application: "Ansökan",
      registration: "Registrering",
    },
    days: ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"],
    locale: "sv-SE",
  },
} as const;

const kindStyle: Record<CalendarKind, { dot: string; chip: string }> = {
  course: { dot: "bg-primary", chip: "bg-primary-soft text-primary" },
  lecture: { dot: "bg-primary", chip: "bg-primary-soft text-primary" },
  seminar: { dot: "bg-success", chip: "bg-success-soft text-success" },
  exam: { dot: "bg-destructive", chip: "bg-destructive/10 text-destructive" },
  application: { dot: "bg-warning", chip: "bg-warning-soft text-warning-foreground" },
  registration: { dot: "bg-foreground", chip: "bg-secondary text-foreground" },
};

const pad = (n: number) => String(n).padStart(2, "0");
export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = (k: string) => {
  const [y = 0, m = 1, d = 1] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfWeek = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
const isoWeek = (d: Date) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - y0.getTime()) / 86_400_000 + 1) / 7);
};

/** Google Maps deep link — opens the location directly, no API key needed. */
const mapsUrl = (location: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location}, KTH, Stockholm`)}`;

export function CalendarScreen({ lang, events }: { lang: Lang; events: CalendarEvent[] }) {
  const c = copy[lang];
  const [view, setView] = useState<"week" | "month">("week");
  const todayKey = toKey(new Date());
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(todayKey);
  const [reminders, setReminders] = useState<Set<string>>(new Set());
  const toggleReminder = (id: string) =>
    setReminders((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const byDay = useMemo(() => {
    const m: Record<string, CalendarEvent[]> = {};
    for (const e of events) (m[e.date] ??= []).push(e);
    return m;
  }, [events]);

  const weekStart = startOfWeek(cursor);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthFirst = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = startOfWeek(monthFirst);
  const monthDays = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  const shift = (dir: number) =>
    setCursor((d) => (view === "week" ? addDays(d, dir * 7) : new Date(d.getFullYear(), d.getMonth() + dir, 1)));

  const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString(c.locale, o);
  const heading =
    view === "week"
      ? `${c.weekShort} ${isoWeek(weekStart)} · ${fmt(weekStart, { day: "numeric", month: "short" })} – ${fmt(addDays(weekStart, 6), { day: "numeric", month: "short", year: "numeric" })}`
      : fmt(monthFirst, { month: "long", year: "numeric" });

  return (
    <section id="calendar" className="space-y-3">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">{c.title}</h1>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">{c.example}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{c.intro}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label={c.title} className="inline-flex rounded-full bg-secondary p-1">
          {(["week", "month"] as const).map((v) => (
            <Button key={v} size="sm" variant={view === v ? "default" : "ghost"} aria-pressed={view === v} className="h-8 rounded-full px-4" onClick={() => setView(v)}>
              {c[v]}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {reminders.size > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              <BellRing className="size-3.5" />
              {reminders.size} {c.remindersSet}
            </span>
          )}
          <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => { setCursor(new Date()); setSelected(todayKey); }}>
            {c.today}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {(Object.keys(kindStyle) as CalendarKind[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className={cn("size-2 rounded-full", kindStyle[k].dot)} />
            {c.kinds[k]}
          </span>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <Button size="icon" variant="ghost" className="size-9 rounded-full" aria-label={c.prev} onClick={() => shift(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <p className="text-center text-sm font-bold capitalize text-foreground">{heading}</p>
          <Button size="icon" variant="ghost" className="size-9 rounded-full" aria-label={c.next} onClick={() => shift(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {view === "week" ? (
          <ol className="divide-y divide-border">
            {weekDays.map((d) => {
              const key = toKey(d);
              const list = byDay[key] ?? [];
              return (
                <li key={key} className="flex gap-3 py-2">
                  <div className={cn("flex w-10 shrink-0 flex-col items-center rounded-lg py-1", key === todayKey ? "bg-primary text-primary-foreground" : "text-foreground")}>
                    <span className="text-[10px] font-semibold uppercase opacity-80">{c.days[(d.getDay() + 6) % 7]}</span>
                    <span className="text-base font-extrabold leading-tight">{d.getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {list.length === 0 ? (
                      <p className="pt-1 text-xs text-muted-foreground">{c.nothing}</p>
                    ) : (
                      list.map((e) => <EventItem key={e.id} e={e} c={c} reminded={reminders.has(e.id)} onToggleReminder={() => toggleReminder(e.id)} />)
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <>
            <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase text-muted-foreground">
              {c.days.map((d) => <span key={d} className="py-1">{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((d) => {
                const key = toKey(d);
                const list = byDay[key] ?? [];
                const inMonth = d.getMonth() === monthFirst.getMonth();
                const kinds = Array.from(new Set(list.map((e) => e.kind)));
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelected(key)}
                    aria-pressed={selected === key}
                    aria-label={`${fmt(d, { day: "numeric", month: "long" })}, ${list.length}`}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-start gap-1 rounded-xl pt-1.5 text-sm font-semibold transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      !inMonth && "text-muted-foreground/50",
                      key === todayKey && "text-primary",
                      selected === key && "bg-primary text-primary-foreground hover:bg-primary",
                    )}
                  >
                    {d.getDate()}
                    <span className="flex gap-0.5">
                      {kinds.slice(0, 4).map((k) => (
                        <span key={k} className={cn("size-1.5 rounded-full", selected === key ? "bg-primary-foreground" : kindStyle[k].dot)} />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 border-t border-border pt-2.5">
              <p className="mb-2 text-sm font-bold capitalize text-foreground">
                {fmt(fromKey(selected), { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <div className="space-y-1.5">
                {(byDay[selected] ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">{c.nothing}</p>
                ) : (
                  (byDay[selected] ?? []).map((e) => <EventItem key={e.id} e={e} c={c} reminded={reminders.has(e.id)} onToggleReminder={() => toggleReminder(e.id)} />)
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function EventItem({ e, c, reminded, onToggleReminder }: { e: CalendarEvent; c: (typeof copy)[Lang]; reminded: boolean; onToggleReminder: () => void }) {
  const mapsHref = e.location ? mapsUrl(e.location) : undefined;
  const body = (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", kindStyle[e.kind].chip)}>{c.kinds[e.kind]}</span>
        <span className="text-xs font-semibold text-muted-foreground">{e.start ? `${e.start}–${e.end}` : c.allDay}</span>
        {e.code && <span className="text-xs text-muted-foreground">· {e.code}</span>}
        {reminded && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary">
            <BellRing className="size-3" /> {c.reminderOn}
          </span>
        )}
        <button
          type="button"
          onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); onToggleReminder(); }}
          aria-pressed={reminded}
          aria-label={reminded ? c.removeReminder : c.setReminder}
          title={reminded ? c.removeReminder : c.setReminder}
          className={cn(
            "ml-auto inline-flex size-7 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            reminded ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          {reminded ? <BellRing className="size-3.5" /> : <Bell className="size-3.5" />}
        </button>
      </div>
      <p className="mt-0.5 text-[13px] font-semibold leading-snug text-foreground">{e.title}</p>
      {e.room && (
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3" /> {e.room}
        </p>
      )}
      {e.href && (
        <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-primary">
          {c.open} {new URL(e.href).hostname.replace("www.", "")} <ExternalLink className="size-3" />
        </p>
      )}
      {mapsHref && (
        <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-primary">
          {c.openMaps} <ExternalLink className="size-3" />
        </p>
      )}
    </>
  );
  const cls = cn("block rounded-xl border-l-4 bg-secondary/50 px-3 py-1.5", {
    "border-primary": e.kind === "lecture",
    "border-success": e.kind === "seminar",
    "border-destructive": e.kind === "exam",
    "border-warning": e.kind === "application",
    "border-foreground": e.kind === "registration",
  });
  const linkHref = e.href ?? mapsHref;
  return linkHref ? (
    <a
      href={linkHref}
      target="_blank"
      rel="noreferrer"
      aria-label={e.href ? undefined : `${e.title} — ${c.openMaps}`}
      className={cn(cls, "cursor-pointer transition-colors hover:bg-secondary")}
    >
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}
