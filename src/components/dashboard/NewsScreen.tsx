import type { Lang } from "@/lib/copy";
import { getKthNewsThemes, getKthThemeNews } from "@/lib/kth-api";
import { kthNewsArchive, kthNewsThemeUrl, type KthNewsStory } from "@/lib/kth-news";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ExternalLink } from "lucide-react";

export const newsCopy = {
  en: {
    label: "KTH News",
    title: "News from KTH",
    themes: "News themes",
    allNews: "Latest news",
    openTheme: "Open this theme on KTH",
    themesUnavailable: "Could not load KTH’s news themes.",
    themeUnavailable: "No articles are available here. Open the theme on KTH to browse it.",
    latest: "Latest news",
    loadingLatest: "Loading news from KTH…",
    readArchive: "Open the KTH news archive",
    viewAll: "View all news",
    notifyTitle: "Notify me about",
    notifyIntro: "Choose which notifications you want to receive.",
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
    themes: "Nyhetsteman",
    allNews: "Senaste nyheterna",
    openTheme: "Öppna temat på KTH",
    themesUnavailable: "Det gick inte att hämta KTH:s nyhetsteman.",
    themeUnavailable: "Inga artiklar kan visas här. Öppna temat på KTH för att läsa mer.",
    latest: "Senaste nyheterna",
    loadingLatest: "Hämtar nyheter från KTH…",
    readArchive: "Öppna KTH:s nyhetsarkiv",
    viewAll: "Visa alla nyheter",
    notifyTitle: "Notiser om",
    notifyIntro: "Välj vilka notiser du vill få.",
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

export function NewsScreen({
  lang,
  stories,
  loading,
}: {
  lang: Lang;
  stories: KthNewsStory[];
  loading: boolean;
}) {
  const c = newsCopy[lang];
  const [theme, setTheme] = useState("");
  const themes = useQuery({
    queryKey: ["kth-news-themes", lang],
    queryFn: () => getKthNewsThemes({ data: lang }),
    staleTime: 30 * 60_000,
  });
  const themeNews = useQuery({
    queryKey: ["kth-news-theme", lang, theme],
    queryFn: () => getKthThemeNews({ data: { lang, slug: theme } }),
    enabled: Boolean(theme),
    staleTime: 30 * 60_000,
  });
  const items = theme ? (themeNews.data ?? []) : stories;
  const pending = theme ? themeNews.isPending : loading;

  return (
    <section id="news" className="card-enter scroll-mt-6 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold md:text-3xl">{c.title}</h1>
        <a
          href={kthNewsArchive(lang)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          {c.readArchive}
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      </header>

      <label className="block max-w-sm space-y-1.5">
        <span className="block text-sm font-bold">{c.themes}</span>
        <select
          value={theme}
          onChange={(event) => setTheme(event.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-base focus-visible:outline-2 focus-visible:outline-primary"
        >
          <option value="">{c.allNews}</option>
          {themes.data?.map(({ slug, title }) => (
            <option key={slug} value={slug}>
              {title}
            </option>
          ))}
        </select>
      </label>
      {themes.isError && (
        <p role="status" className="text-sm text-muted-foreground">
          {c.themesUnavailable}
        </p>
      )}
      {theme && (
        <a
          href={kthNewsThemeUrl(lang, theme)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          {c.openTheme}
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      )}
      {theme && !pending && !items.length && (
        <p role="status" className="text-sm text-muted-foreground">
          {c.themeUnavailable}
        </p>
      )}

      {pending && (
        <p role="status" className="text-sm text-muted-foreground">
          {c.loadingLatest}
        </p>
      )}
      {items.length > 0 && (
        <ul className="grid grid-cols-2 gap-2.5 sm:gap-4">
          {items.map((story) => (
            <li key={story.url} className="min-w-0">
              <a
                href={story.url}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-primary"
              >
                {story.image && (
                  <img
                    src={story.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-20 w-full bg-secondary object-cover sm:h-32"
                  />
                )}
                <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:p-3">
                  {story.date && <p className="text-xs text-muted-foreground">{story.date}</p>}
                  <h2 className="text-sm leading-snug font-bold wrap-break-word group-hover:underline sm:text-base">
                    {story.title}
                  </h2>
                  <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-semibold text-primary">
                    {c.read}
                    <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
