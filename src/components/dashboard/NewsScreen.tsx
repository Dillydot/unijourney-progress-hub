import { Lang } from "@/lib/copy";
import { getKthNews } from "@/lib/kth-api";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";

export const newsCopy = {
  en: {
    label: "KTH News",
    title: "News from KTH",
    intro: "The latest stories from KTH.",
    source: "From kth.se",
    loading: "Loading news from kth.se…",
    failed: "Couldn't load news from kth.se right now.",
    archive: "All news on kth.se",
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
  },
  sv: {
    label: "KTH-nyheter",
    title: "Nyheter från KTH",
    intro: "De senaste nyheterna från KTH.",
    source: "Från kth.se",
    loading: "Hämtar nyheter från kth.se…",
    failed: "Kunde inte hämta nyheter från kth.se just nu.",
    archive: "Alla nyheter på kth.se",
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

const archiveUrl = {
  en: "https://www.kth.se/en/om/nyheter/centrala-nyheter",
  sv: "https://www.kth.se/om/nyheter/centrala-nyheter",
};

export function NewsScreen({ lang }: { lang: Lang }) {
  const c = newsCopy[lang];
  const news = useQuery({
    queryKey: ["kth-news", lang],
    queryFn: () => getKthNews({ data: { lang } }),
    staleTime: 60 * 60 * 1000,
  });
  const fmt = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <section id="news" className="card-enter scroll-mt-6 space-y-3 md:col-span-12">
      <div>
        <div className="flex items-center gap-2">
          <p className="section-label">{c.label}</p>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {c.source}
          </span>
        </div>
        <h1 className="mt-1 font-display text-xl font-bold md:text-2xl">{c.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{c.intro}</p>
      </div>

      {news.isLoading && <p className="text-sm text-muted-foreground">{c.loading}</p>}
      {news.isError && (
        <p className="text-sm font-semibold text-destructive" role="alert">
          {c.failed}
        </p>
      )}

      <ul className="grid gap-3 md:grid-cols-2">
        {news.data?.slice(0, 10).map((n) => (
          <li key={n.href}>
            <a
              href={n.href}
              target="_blank"
              rel="noreferrer"
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-colors hover:bg-secondary"
            >
              {n.image && (
                <img
                  src={n.image}
                  alt={n.imageAlt ?? ""}
                  loading="lazy"
                  className="aspect-[16/9] w-full object-cover"
                />
              )}
              <div className="flex flex-1 flex-col p-3">
                <p className="text-xs text-muted-foreground">{fmt(n.date)}</p>
                <h3 className="mt-1 text-sm font-bold leading-snug">{n.title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{n.summary}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-semibold text-primary">
                  {c.read} <ExternalLink className="size-3.5" aria-hidden="true" />
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>

      {news.data && (
        <a
          href={archiveUrl[lang]}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          {c.archive} <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      )}
    </section>
  );
}
