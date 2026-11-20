export type KthNewsStory = { url: string; title: string; date: string; image?: string };

const origin = "https://www.kth.se";

export function kthNewsArchive(lang: "en" | "sv") {
  return `${origin}${lang === "en" ? "/en" : ""}/om/nyheter/centrala-nyheter`;
}

function plainText(value: string) {
  const entities: Record<string, string> = {
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    nbsp: " ",
  };
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity, name: string) => {
      if (!name.startsWith("#")) return entities[name] ?? entity;
      const hex = name[1]?.toLowerCase() === "x";
      const point = Number.parseInt(name.slice(hex ? 2 : 1), hex ? 16 : 10);
      return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
    })
    .replace(/\s+/g, " ")
    .trim();
}

function officialUrl(value: string | undefined, path: RegExp) {
  if (!value) return undefined;
  try {
    const url = new URL(value.replace(/&amp;/g, "&"), origin);
    return url.origin === origin && path.test(url.pathname) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function articleImage(item: string) {
  const photo = item.match(/<figure\b[\s\S]*?<img\b([^>]+)>/)?.[1] ?? "";
  const thumbnail = photo.match(/srcset="([^"]+)"/)?.[1]?.match(/(?:^|,\s*)(\S+) 406w/)?.[1];
  return officialUrl(thumbnail ?? photo.match(/\ssrc="([^"]+)"/)?.[1], /^\/polopoly_fs\//);
}

export function latestKthNewsFromPage(html: string) {
  const items = html.match(/<ul class="listing">([\s\S]*?)<\/ul>/)?.[1] ?? "";
  const stories = new Map<string, KthNewsStory>();

  for (const [, item = ""] of items.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)) {
    const url = officialUrl(
      item.match(/<a\b[^>]*class="readMore"[^>]*\shref="([^"]+)"/)?.[1],
      /^\/(?:en\/)?om\/nyheter\/centrala-nyheter\/[^/]+-1\.\d+$/,
    );
    const title = plainText(item.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? "");
    if (!url || !title || stories.has(url)) continue;
    const date = plainText(
      item.match(/<div class="date">[\s\S]*?<span>([^<]+)<\/span>/)?.[1] ?? "",
    );
    const image = articleImage(item);
    stories.set(url, { url, title, date, ...(image ? { image } : {}) });
    if (stories.size === 12) break;
  }

  if (!stories.size) throw new Error("KTH news listing is unavailable");
  return [...stories.values()];
}

const themePath = /^\/(?:en\/)?om\/nyheter\/nyhetsteman\/([a-z0-9-]+-1\.\d+)$/;

export function kthNewsThemeUrl(lang: "en" | "sv", slug: string) {
  return `${origin}${lang === "en" ? "/en" : ""}/om/nyheter/nyhetsteman/${slug}`;
}

export function kthNewsThemesFromPage(html: string) {
  const menu = html.match(/<nav id="mainMenu"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? "";
  const themes = new Map<string, string>();
  for (const [, href = "", content = ""] of menu.matchAll(
    /<a\b[^>]*\shref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g,
  )) {
    const slug = themePath.exec(href)?.[1];
    const title = plainText(content).replace(/^(?:Theme|Tema):\s*/i, "");
    if (slug && title) themes.set(slug, title.replace("Tech & Democray", "Tech & Democracy"));
  }
  if (!themes.size) throw new Error("KTH news themes are unavailable");
  return [...themes].map(([slug, title]) => ({ slug, title }));
}

export function kthThemeNewsFromPage(html: string): KthNewsStory[] {
  const content = html.match(/<article id="mainContent"[^>]*>([\s\S]*)/)?.[1] ?? "";
  const stories = new Map<string, KthNewsStory>();

  const articlePath = /^\/(?:en\/)?om\/nyheter\/(?:centrala-nyheter|lokala-nyheter)\/[^/]+-1\.\d+$/;

  function add(item: string) {
    const heading = item.match(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/)?.[1];
    const listLink = item.match(/<a class="newsLink" href="([^"]+)">([\s\S]*?)<\/a>/);
    const title = plainText(heading ?? listLink?.[2] ?? "");
    const links = [...item.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)];
    const url = links.map((match) => officialUrl(match[1], articlePath)).find(Boolean);
    if (!title || !url || stories.has(url)) return;

    const date = plainText(item.match(/<div class="date">([^<]+)<\/div>/)?.[1] ?? "");
    const image = articleImage(item);
    stories.set(url, { url, title, date, ...(image ? { image } : {}) });
  }

  for (const [, type = "", item = ""] of content.matchAll(
    /<article class="block (teaser|news)\b[^>]*>([\s\S]*?)<\/article>/g,
  )) {
    if (type === "teaser") {
      add(item);
      continue;
    }

    for (const card of item.split(/<div class="description(?: withImage)?">/).slice(1)) add(card);
    for (const [, row = ""] of item.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)) {
      if (row.includes('class="newsLink"')) add(row);
    }
  }

  return [...stories.values()];
}

export function kthArticleImageFromPage(html: string) {
  return (
    officialUrl(
      html.match(/<meta property="og:image" content="([^"]+)"/)?.[1],
      /^\/polopoly_fs\//,
    ) ?? articleImage(html.match(/<article id="mainContent"[^>]*>([\s\S]*)/)?.[1] ?? "")
  );
}
