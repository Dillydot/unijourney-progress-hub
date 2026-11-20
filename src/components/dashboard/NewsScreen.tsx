import { Lang } from "@/lib/copy";
import { ExternalLink } from "lucide-react";
import { useState } from "react";

export type NewsCategory = "research" | "education" | "campus" | "innovation";

export const newsCopy = {
  en: {
    label: "KTH News",
    title: "News from KTH",
    latest: "Latest news",
    viewAll: "View all news",
    intro:
      "The latest stories from KTH. Choose which notifications you want on the Profile screen.",
    notifyTitle: "Notify me about",
    notifyIntro: "Choose which notifications you want to receive.",
    all: "All",
    on: "On",
    off: "Off",
    prefs: {
      research: "Research",
      education: "Education",
      campus: "Campus life",
      innovation: "Innovation",
      grades: "New grades",
      registration: "Registration",
      application: "Application",
    },
    read: "Read on kth.se",
    cats: {
      research: "Research",
      education: "Education",
      campus: "Campus life",
      innovation: "Innovation",
    },
  },
  sv: {
    label: "KTH-nyheter",
    title: "Nyheter från KTH",
    latest: "Senaste nyheterna",
    viewAll: "Visa alla nyheter",
    intro: "De senaste nyheterna från KTH. Välj vilka notiser du vill få på profilsidan.",
    notifyTitle: "Notiser om",
    notifyIntro: "Välj vilka notiser du vill få.",
    all: "Alla",
    on: "På",
    off: "Av",
    prefs: {
      research: "Forskning",
      education: "Utbildning",
      campus: "Campusliv",
      innovation: "Innovation",
      grades: "Nya betyg",
      registration: "Registrering",
      application: "Ansökan",
    },
    read: "Läs på kth.se",
    cats: {
      research: "Forskning",
      education: "Utbildning",
      campus: "Campusliv",
      innovation: "Innovation",
    },
  },
} as const;

export type NotificationPrefKey = keyof (typeof newsCopy)["en"]["prefs"];

export const defaultNotificationPrefs: Record<NotificationPrefKey, boolean> = {
  research: true,
  education: true,
  campus: false,
  innovation: true,
  grades: true,
  registration: true,
  application: true,
};

export const profilePrefKeys: NotificationPrefKey[] = [
  "grades",
  "registration",
  "application",
  "research",
  "education",
  "campus",
  "innovation",
];

export const kthNews: Array<{
  id: number;
  category: NewsCategory;
  date: string;
  title: string;
  summary: string;
  isNew?: boolean;
}> = [
  {
    id: 1,
    category: "research",
    date: "8 Oct 2026",
    isNew: true,
    title: "New battery material could double storage capacity",
    summary:
      "KTH researchers present a sodium-based material that may make grid storage cheaper and more sustainable.",
  },
  {
    id: 2,
    category: "innovation",
    date: "7 Oct 2026",
    isNew: true,
    title: "KTH Innovation opens applications for autumn idea programme",
    summary:
      "Students with a business idea can apply for coaching, funding and workspace before 30 October.",
  },
  {
    id: 3,
    category: "education",
    date: "5 Oct 2026",
    title: "Course registration for study period 3 opens soon",
    summary: "Remember to register for spring courses between 15 October and 15 November in Ladok.",
  },
  {
    id: 4,
    category: "campus",
    date: "3 Oct 2026",
    title: "Nobel Week lecture series comes to KTH Campus",
    summary:
      "Open lectures with Nobel laureates in Q-huset throughout December — free for all students.",
  },
  {
    id: 5,
    category: "research",
    date: "30 Sep 2026",
    title: "AI model helps predict traffic congestion in Stockholm",
    summary:
      "A joint project with the City of Stockholm uses machine learning to cut commuting times.",
  },
  {
    id: 6,
    category: "campus",
    date: "26 Sep 2026",
    title: "New study spaces open in the KTH Library",
    summary:
      "Over 200 new seats, group rooms and quiet zones are now available on the Valhallavägen campus.",
  },
];

export function NewsScreen({ lang }: { lang: Lang }) {
  const c = newsCopy[lang];
  const [filter, setFilter] = useState<NewsCategory | "all">("all");
  const cats = Object.keys(c.cats) as NewsCategory[];
  const items = kthNews.filter((n) => filter === "all" || n.category === filter);

  return (
    <section id="news" className="card-enter scroll-mt-6 space-y-3 md:col-span-12">
      <div>
        <div className="flex items-center gap-2">
          <p className="section-label">{c.label}</p>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            Example data
          </span>
        </div>
        <h1 className="mt-1 font-display text-xl font-bold md:text-2xl">{c.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{c.intro}</p>
      </div>

      <div className="flex flex-wrap gap-1.5 rounded-2xl bg-secondary p-1.5">
        {(["all", ...cats] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
            className={`min-h-10 rounded-full px-3 py-1.5 text-xs font-semibold touch-manipulation ${filter === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            {k === "all" ? c.all : c.cats[k]}
          </button>
        ))}
      </div>

      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((n) => (
          <li
            key={n.id}
            className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="rounded-full bg-primary-soft px-2 py-0.5 font-semibold text-primary">
                {c.cats[n.category]}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                {n.isNew && <span className="size-2 rounded-full bg-success" aria-label="New" />}
                {n.date}
              </span>
            </div>
            <h3 className="mt-1.5 text-sm font-bold leading-snug">{n.title}</h3>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{n.summary}</p>
            <a
              href={
                lang === "sv"
                  ? "https://www.kth.se/aktuellt/nyheter"
                  : "https://www.kth.se/en/aktuellt/nyheter"
              }
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary"
            >
              {c.read} <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
