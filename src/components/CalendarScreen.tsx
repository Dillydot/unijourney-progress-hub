import { useMemo, useRef, useState } from "react";
import {
  Bell,
  BellRing,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Link2,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { importKthCalendar } from "@/lib/kth-calendar-api";
import { cn } from "@/lib/utils";

type Lang = "en" | "sv";
export type CalendarKind = "lecture" | "seminar" | "exam" | "application" | "registration";

export type CalendarEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  start?: string;
  end?: string;
  kind: CalendarKind | null;
  title: string;
  code?: string;
  room?: string;
  location?: string; // street address used for the Google Maps link
  href?: string;
  description?: string;
};

const copy = {
  en: {
    title: "Calendar",
    intro:
      "Course dates, exam periods and registration deadlines from kth.se. Open a course for its full schedule in TimeEdit.",
    example: "From kth.se",
    connect: "Connect your schedule",
    connectDescription: "Add your personal KTH schedule to the UniJourney calendar.",
    openSettingsStep: "Open your KTH calendar settings",
    openSettings: "KTH Calendar Settings",
    copyLinkStep: "Sign in to KTH and copy your unique iCalendar link.",
    pasteLinkStep: "Paste your iCalendar link",
    linkPlaceholder: "Paste your link here",
    timeEdit: "Using TimeEdit?",
    timeEditHelp: "Copy the iCal link from Subscribe in My Schedule.",
    openSchedule: "Open KTH My Schedule",
    replaceCalendar: "Change link",
    importCalendar: "Import calendar",
    importing: "Loading calendar…",
    refreshCalendar: "Refresh",
    removeCalendar: "Remove",
    imported: (count: number) => `${count} calendar events loaded`,
    invalidFeed: "Paste the unique iCalendar link from KTH or TimeEdit.",
    unavailableFeed:
      "Could not load this calendar. Check that the subscription link still works and try again.",
    week: "Week",
    month: "Month",
    today: "Today",
    prev: "Previous",
    next: "Next",
    weekShort: "Week",
    nothing: "Nothing scheduled",
    moreEvents: (count: number) => `${count} more events`,
    allDay: "All day",
    open: "Open",
    openMaps: "Open in Google Maps",
    setReminder: "Remind me",
    removeReminder: "Remove reminder",
    reminderOn: "Reminder on",
    remindersSet: "reminders set",
    kinds: {
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
    intro:
      "Kursdatum, tentaperioder och anmälningsdatum från kth.se. Öppna en kurs för hela schemat i TimeEdit.",
    example: "Från kth.se",
    connect: "Anslut ditt schema",
    connectDescription: "Lägg till ditt personliga KTH-schema i UniJourneys kalender.",
    openSettingsStep: "Öppna dina kalenderinställningar på KTH",
    openSettings: "KTH:s kalenderinställningar",
    copyLinkStep: "Logga in på KTH och kopiera din unika iCalendar-länk.",
    pasteLinkStep: "Klistra in din iCalendar-länk",
    linkPlaceholder: "Klistra in din länk här",
    timeEdit: "Använder du TimeEdit?",
    timeEditHelp: "Kopiera iCal-länken från Prenumerera i Mitt schema.",
    openSchedule: "Öppna KTH:s Mitt schema",
    replaceCalendar: "Byt länk",
    importCalendar: "Importera kalender",
    importing: "Laddar kalendern…",
    refreshCalendar: "Uppdatera",
    removeCalendar: "Ta bort",
    imported: (count: number) => `${count} kalenderhändelser hämtade`,
    invalidFeed: "Klistra in en iCal-prenumerationslänk från KTH.",
    unavailableFeed:
      "Det gick inte att läsa kalendern. Kontrollera att prenumerationslänken fungerar och försök igen.",
    week: "Vecka",
    month: "Månad",
    today: "Idag",
    prev: "Föregående",
    next: "Nästa",
    weekShort: "Vecka",
    nothing: "Inget planerat",
    moreEvents: (count: number) => `${count} fler händelser`,
    allDay: "Heldag",
    open: "Öppna",
    openMaps: "Öppna i Google Maps",
    setReminder: "Påminn mig",
    removeReminder: "Ta bort påminnelse",
    reminderOn: "Påminnelse på",
    remindersSet: "påminnelser satta",
    kinds: {
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
  const [monthDetails, setMonthDetails] = useState<{ date: string; eventId?: string }>();
  const monthDetailsTrigger = useRef<HTMLButtonElement>(null);
  const [cursor, setCursor] = useState(() => new Date());
  const [reminders, setReminders] = useState<Set<string>>(new Set());
  const [connectOpen, setConnectOpen] = useState(false);
  const [link, setLink] = useState("");
  const [subscription, setSubscription] = useState<{ url: string; events: CalendarEvent[] }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<"invalid" | "unavailable">();

  async function loadSubscription(url: string, revealEvents: boolean) {
    setLoading(true);
    setError(undefined);
    try {
      const result = await importKthCalendar({ data: url });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSubscription({ url, events: result.events });
      setLink("");
      if (revealEvents) {
        setConnectOpen(false);
        const first = result.events.find((event) => event.date >= todayKey) ?? result.events.at(-1);
        if (first) {
          setCursor(fromKey(first.date));
        }
      }
    } catch {
      setError("unavailable");
    } finally {
      setLoading(false);
    }
  }

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
    for (const e of subscription?.events ?? []) (m[e.date] ??= []).push(e);
    for (const day of Object.values(m)) {
      day.sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));
    }
    return m;
  }, [events, subscription]);

  const weekStart = startOfWeek(cursor);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthFirst = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = startOfWeek(monthFirst);
  const monthLength = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const leadingDays = (monthFirst.getDay() + 6) % 7;
  const monthDays = Array.from({ length: Math.ceil((leadingDays + monthLength) / 7) * 7 }, (_, i) =>
    addDays(gridStart, i),
  );

  const shift = (dir: number) =>
    setCursor((d) =>
      view === "week" ? addDays(d, dir * 7) : new Date(d.getFullYear(), d.getMonth() + dir, 1),
    );

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
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {c.example}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{c.intro}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Dialog
          open={connectOpen}
          onOpenChange={(open) => {
            setConnectOpen(open);
            if (open) setError(undefined);
          }}
        >
          <DialogTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant={subscription ? "outline" : "default"}
              disabled={loading}
            >
              <Link2 className="size-4" aria-hidden="true" />
              {subscription ? c.replaceCalendar : c.connect}
            </Button>
          </DialogTrigger>
          <DialogContent className="top-[max(0.75rem,env(safe-area-inset-top))] max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-[calc(100%-2rem)] translate-y-0 gap-4 overflow-y-auto overscroll-contain rounded-2xl bg-linear-to-b from-primary-soft to-background p-5 sm:top-8 sm:max-h-[calc(100dvh-4rem)] sm:max-w-xl sm:rounded-3xl sm:p-7">
            <DialogHeader className="pr-7 text-left">
              <DialogTitle className="text-2xl font-bold text-primary sm:text-3xl">
                {c.connect}
              </DialogTitle>
              <DialogDescription>{c.connectDescription}</DialogDescription>
            </DialogHeader>

            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                if (!loading && link.trim()) void loadSubscription(link.trim(), true);
              }}
            >
              <ol className="relative space-y-4 before:absolute before:bottom-5 before:left-4 before:top-4 before:w-px before:bg-primary/20">
                <li className="relative grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-3">
                  <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    1
                  </span>
                  <div className="space-y-2 pt-1">
                    <p className="text-sm font-bold">{c.openSettingsStep}</p>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-auto min-h-9 whitespace-normal rounded-full text-left text-primary"
                    >
                      <a
                        href="https://www.kth.se/social/home/calendar/settings/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                        {c.openSettings}
                      </a>
                    </Button>
                  </div>
                </li>
                <li className="relative grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-3">
                  <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    2
                  </span>
                  <p className="pt-1 text-sm font-bold">{c.copyLinkStep}</p>
                </li>
                <li className="relative grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-3">
                  <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    3
                  </span>
                  <div className="space-y-2 pt-1">
                    <label htmlFor="kth-calendar-link" className="block text-sm font-bold">
                      {c.pasteLinkStep}
                    </label>
                    <Input
                      id="kth-calendar-link"
                      type="text"
                      inputMode="url"
                      autoCapitalize="none"
                      placeholder={c.linkPlaceholder}
                      autoComplete="off"
                      spellCheck={false}
                      className="h-11 min-w-0 rounded-xl bg-card"
                      value={link}
                      onChange={(event) => setLink(event.target.value)}
                      maxLength={4096}
                    />
                  </div>
                </li>
              </ol>

              <details className="rounded-xl border border-primary/15 bg-primary-soft px-3 py-2 text-sm">
                <summary className="cursor-pointer font-semibold text-primary">
                  {c.timeEdit}
                </summary>
                <p className="mt-1 text-muted-foreground">
                  {c.timeEditHelp}{" "}
                  <a
                    href="https://www.kth.se/en/student/studier/schema"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-primary underline"
                  >
                    {c.openSchedule}
                  </a>
                </p>
              </details>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error === "invalid" ? c.invalidFeed : c.unavailableFeed}
                </p>
              )}
              <Button
                type="submit"
                className="h-11 w-full rounded-xl"
                disabled={loading || !link.trim()}
              >
                {loading ? c.importing : c.importCalendar}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        {subscription && (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => void loadSubscription(subscription.url, false)}
            >
              {loading && !connectOpen ? c.importing : c.refreshCalendar}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={loading}
              onClick={() => {
                setSubscription(undefined);
                setError(undefined);
              }}
            >
              {c.removeCalendar}
            </Button>
            <p role="status" className="text-sm text-muted-foreground">
              {c.imported(subscription.events.length)}
            </p>
          </>
        )}
      </div>
      {!connectOpen && error && (
        <p role="alert" className="text-sm text-destructive">
          {error === "invalid" ? c.invalidFeed : c.unavailableFeed}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="group"
          aria-label={c.title}
          className="inline-flex rounded-full bg-secondary p-1"
        >
          {(["week", "month"] as const).map((v) => (
            <Button
              key={v}
              size="sm"
              variant={view === v ? "default" : "ghost"}
              aria-pressed={view === v}
              className="h-10 rounded-full px-3 sm:px-4"
              onClick={() => setView(v)}
            >
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
          <Button
            size="sm"
            variant="outline"
            className="h-10 rounded-full"
            onClick={() => {
              setCursor(new Date());
            }}
          >
            {c.today}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {(Object.keys(kindStyle) as CalendarKind[]).map((k) => (
          <span
            key={k}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          >
            <span className={cn("size-2 rounded-full", kindStyle[k].dot)} />
            {c.kinds[k]}
          </span>
        ))}
      </div>

      <div
        className={cn(
          "rounded-2xl border border-border bg-card shadow-sm",
          view === "week" ? "p-2 sm:p-3" : "py-2",
        )}
      >
        <div
          className={cn("mb-2 flex items-center justify-between gap-2", view === "month" && "px-2")}
        >
          <Button
            size="icon"
            variant="ghost"
            className="size-11 rounded-full sm:size-9"
            aria-label={c.prev}
            onClick={() => shift(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <p className="text-center text-sm font-bold capitalize text-foreground">{heading}</p>
          <Button
            size="icon"
            variant="ghost"
            className="size-11 rounded-full sm:size-9"
            aria-label={c.next}
            onClick={() => shift(1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {view === "week" ? (
          <ol className="divide-y divide-border">
            {weekDays.map((d) => {
              const key = toKey(d);
              const list = byDay[key] ?? [];
              return (
                <li key={key} className="flex gap-2 py-2 sm:gap-3">
                  <div
                    className={cn(
                      "flex w-10 shrink-0 flex-col items-center rounded-lg py-1",
                      key === todayKey ? "bg-primary text-primary-foreground" : "text-foreground",
                    )}
                  >
                    <span className="text-[10px] font-semibold uppercase opacity-80">
                      {c.days[(d.getDay() + 6) % 7]}
                    </span>
                    <span className="text-base font-extrabold leading-tight">{d.getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {list.length === 0 ? (
                      <p className="pt-1 text-xs text-muted-foreground">{c.nothing}</p>
                    ) : (
                      list.map((e) => (
                        <EventItem
                          key={e.id}
                          e={e}
                          c={c}
                          reminded={reminders.has(e.id)}
                          onToggleReminder={() => toggleReminder(e.id)}
                        />
                      ))
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <>
            <div className="grid grid-cols-7 text-center text-[10px] font-bold uppercase text-muted-foreground sm:text-xs">
              {c.days.map((day) => (
                <span key={day} className="py-2">
                  <span className="sm:hidden" aria-hidden="true">
                    {day.slice(0, 1)}
                  </span>
                  <span className="sr-only sm:not-sr-only">{day}</span>
                </span>
              ))}
            </div>
            <ol className="grid grid-cols-7">
              {monthDays.map((date) => {
                const key = toKey(date);
                const inMonth = date.getMonth() === monthFirst.getMonth();
                const events = inMonth ? (byDay[key] ?? []) : [];
                const extraCount = events.length - 3;
                return (
                  <li
                    key={key}
                    className="min-h-26 min-w-0 border-t border-border px-0.5 py-1.5 sm:min-h-28 sm:px-1.5 sm:py-2"
                  >
                    {inMonth && (
                      <>
                        <time
                          dateTime={key}
                          aria-current={key === todayKey ? "date" : undefined}
                          className="mb-1.5 flex justify-center"
                        >
                          <span className="sr-only">
                            {fmt(date, { weekday: "long", day: "numeric", month: "long" })}
                          </span>
                          <span
                            aria-hidden="true"
                            className={cn(
                              "grid size-6 place-items-center rounded-full text-sm font-bold sm:size-8 sm:text-base",
                              key === todayKey
                                ? "bg-primary text-primary-foreground"
                                : (date.getDay() === 0 || date.getDay() === 6) &&
                                    "text-muted-foreground",
                            )}
                          >
                            {date.getDate()}
                          </span>
                        </time>
                        <div className="space-y-0.5">
                          {events.slice(0, 3).map((event) => (
                            <button
                              key={event.id}
                              type="button"
                              title={event.title}
                              onClick={(click) => {
                                monthDetailsTrigger.current = click.currentTarget;
                                setMonthDetails({ date: key, eventId: event.id });
                              }}
                              className={cn(
                                "block min-h-6 w-full touch-manipulation truncate rounded-sm px-0.5 py-0.5 text-left text-[10px] font-semibold leading-tight hover:brightness-95 focus-visible:outline-2 focus-visible:outline-ring sm:rounded-md sm:px-1.5 sm:text-xs",
                                event.kind
                                  ? kindStyle[event.kind].chip
                                  : "bg-secondary text-foreground",
                              )}
                            >
                              <span className="hidden sm:inline">
                                {event.start ? `${event.start} ` : ""}
                              </span>
                              {event.title}
                            </button>
                          ))}
                          {extraCount > 0 && (
                            <button
                              type="button"
                              aria-label={c.moreEvents(extraCount)}
                              onClick={(click) => {
                                monthDetailsTrigger.current = click.currentTarget;
                                setMonthDetails({ date: key });
                              }}
                              className="block min-h-6 w-full touch-manipulation rounded-sm text-center text-[10px] font-semibold text-muted-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring sm:text-xs"
                            >
                              +{extraCount}
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ol>
            <Dialog
              open={Boolean(monthDetails)}
              onOpenChange={(open) => {
                if (!open) setMonthDetails(undefined);
              }}
            >
              {monthDetails && (
                <DialogContent
                  aria-describedby={undefined}
                  className="max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-[calc(100%-2rem)] overflow-y-auto overscroll-contain rounded-2xl p-4 sm:p-6"
                  onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    monthDetailsTrigger.current?.focus();
                  }}
                >
                  <DialogTitle className="pr-6 capitalize">
                    {fmt(fromKey(monthDetails.date), {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </DialogTitle>
                  <div className="space-y-2">
                    {byDay[monthDetails.date]
                      ?.filter(
                        (event) => !monthDetails.eventId || event.id === monthDetails.eventId,
                      )
                      .map((event) => (
                        <EventItem
                          key={event.id}
                          e={event}
                          c={c}
                          reminded={reminders.has(event.id)}
                          onToggleReminder={() => toggleReminder(event.id)}
                        />
                      ))}
                  </div>
                </DialogContent>
              )}
            </Dialog>
          </>
        )}
      </div>
    </section>
  );
}

function EventItem({
  e,
  c,
  reminded,
  onToggleReminder,
}: {
  e: CalendarEvent;
  c: (typeof copy)[Lang];
  reminded: boolean;
  onToggleReminder: () => void;
}) {
  const mapsHref = e.location ? mapsUrl(e.location) : undefined;
  const body = (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {e.kind && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              kindStyle[e.kind].chip,
            )}
          >
            {c.kinds[e.kind]}
          </span>
        )}
        <span className="text-xs font-semibold text-muted-foreground">
          {e.start && e.end ? `${e.start}–${e.end}` : (e.start ?? e.end ?? c.allDay)}
        </span>
        {e.code && <span className="text-xs text-muted-foreground">· {e.code}</span>}
        {reminded && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary">
            <BellRing className="size-3" /> {c.reminderOn}
          </span>
        )}
        <button
          type="button"
          onClick={onToggleReminder}
          aria-pressed={reminded}
          aria-label={reminded ? c.removeReminder : c.setReminder}
          title={reminded ? c.removeReminder : c.setReminder}
          className={cn(
            "ml-auto inline-flex size-10 shrink-0 items-center sm:size-8 justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            reminded
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          {reminded ? <BellRing className="size-3.5" /> : <Bell className="size-3.5" />}
        </button>
      </div>
      <p className="mt-0.5 text-[13px] font-semibold leading-snug text-foreground">{e.title}</p>
      {e.description && (
        <p className="mt-0.5 whitespace-pre-wrap break-words text-xs text-muted-foreground">
          {e.description}
        </p>
      )}
      {e.room && (
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3" /> {e.room}
        </p>
      )}
      {(e.href || mapsHref) && (
        <div className="flex flex-wrap gap-x-3">
          {e.href && (
            <a
              href={e.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              {c.open} {new URL(e.href).hostname.replace("www.", "")}
              <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
            </a>
          )}
          {mapsHref && (
            <a
              href={mapsHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              {c.openMaps}
              <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
            </a>
          )}
        </div>
      )}
    </>
  );
  const cls = cn("block min-w-0 wrap-anywhere rounded-xl border-l-4 bg-secondary/50 px-3 py-1.5", {
    "border-primary": e.kind === "lecture",
    "border-success": e.kind === "seminar",
    "border-destructive": e.kind === "exam",
    "border-warning": e.kind === "application",
    "border-foreground": e.kind === "registration",
  });
  return <div className={cls}>{body}</div>;
}
