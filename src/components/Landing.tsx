import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  Map,
  ZoomIn,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Images live in public/landing/.
const img = (name: string) => `/landing/${name}`;

const setupSteps = [
  {
    title: "Upload your Ladok documents",
    description:
      "Download your transcript of records and certificate of registration from Ladok as PDFs. Sign in to UniJourney and upload both in Progress to see your grades and earned credits.",
  },
  {
    title: "Choose your programme",
    description:
      "In Plan, select Browse KTH programmes. Choose your degree type, such as BSc or MSc, then your school and programme to see its required and elective courses.",
  },
  {
    title: "Connect your schedule",
    description:
      "Copy your personal iCalendar link from KTH Calendar Settings. In UniJourney, go to Calendar, select Connect your schedule, and paste the link to see your timetable.",
  },
];

const features = [
  {
    icon: Map,
    title: "A clear path to your degree",
    description:
      "Browse your programme by year, semester and study period. See required and elective courses and how many ECTS each is worth.",
  },
  {
    icon: CalendarDays,
    title: "Stay on top of deadlines",
    description:
      "See lectures, seminars, exams, application and registration dates in one calendar. Get updates on grades and university news.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Track your academic progress",
    description:
      "See passed and failed courses at a glance. Compare the credits you’ve earned each semester with your study plan.",
  },
];

const screens = [
  {
    src: img("dashboard.png"),
    crop: { left: 14, top: 8, width: 393, height: 852, imageWidth: 428 },
    t: "Dashboard",
    d: "Academic year at a glance — programme progress, credits and the next deadline, right when you open the app.",
  },
  {
    src: img("progress.png"),
    crop: { left: 26, top: 10, width: 393, height: 852, imageWidth: 457 },
    t: "Progress",
    d: "Credits earned against your expected study plan — see how far you've come and what's still ahead.",
  },
  {
    src: img("plan.png"),
    crop: { left: 10, top: 10, width: 393, height: 852, imageWidth: 422 },
    t: "Plan",
    d: "Explore mandatory and elective courses by year, semester and study period, and build your programme plan.",
  },
  {
    src: img("calendar.png"),
    crop: { left: 12, top: 7, width: 393, height: 852, imageWidth: 427 },
    t: "Calendar",
    d: "See lectures, seminars, exams and registrations in weekly and monthly views. Open an event for details and map links.",
  },
  {
    src: img("news.png"),
    crop: { left: 6, top: 16, width: 393, height: 852, imageWidth: 423 },
    t: "News",
    d: "Stories from your university, filtered by topic — choose which notifications you want to receive.",
  },
] as const;

const roadmap = [
  {
    s: "Done",
    t: "Concept & research",
    d: "Interviews with students about their biggest study pains.",
  },
  {
    s: "Done",
    t: "Working prototype",
    d: "Planner, progress, calendar and news — live and ready to try.",
  },
  {
    s: "Now",
    t: "Testing with students",
    d: "Real students using the app and shaping what comes next.",
  },
  { s: "Later", t: "Public launch", d: "Available for students everywhere." },
];

const team = [
  {
    name: "Angelos Zacharioudakis",
    role: "Software engineering & technical leadership",
    src: img("team-portrait-1.png"),
    linkedin: "https://www.linkedin.com/in/angelos-zacharioudakis/",
  },
  {
    name: "Damianos Damianakis",
    role: "Business development & UI/UX design",
    src: img("team-portrait-3.jpeg"),
    linkedin: "https://www.linkedin.com/in/damianos-damianakis/",
  },
  {
    name: "Mathilde Willems",
    role: "Finance & partnership management",
    src: img("team-portrait-2.jpeg"),
    linkedin: "https://www.linkedin.com/in/mathilde-willems-352993384/",
  },
];

type Screenshot = (typeof screens)[number];

function ScreenshotImage({ screen }: { screen: Screenshot }) {
  const { left, top, width, height, imageWidth } = screen.crop;
  return (
    <span
      className="relative block overflow-hidden bg-card"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <img
        src={screen.src}
        alt={`UniJourney ${screen.t} screen`}
        className="absolute max-w-none"
        style={{
          width: `${(imageWidth / width) * 100}%`,
          left: `${(-left / width) * 100}%`,
          top: `${(-top / height) * 100}%`,
        }}
      />
    </span>
  );
}

const arrow = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="h-4 w-4"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export function Landing() {
  const [zoom, setZoom] = useState<Screenshot | null>(null);
  const gallery = useRef<HTMLElement>(null);
  const screenshotRail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = gallery.current;
    if (!section || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target instanceof HTMLElement) {
            entry.target.setAttribute("data-visible", "true");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.25 },
    );
    section.querySelectorAll("[data-screenshot]").forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  function moveScreens(direction: number) {
    const rail = screenshotRail.current;
    if (!rail) return;
    const first = rail.children[0];
    const second = rail.children[1];
    if (!(first instanceof HTMLElement) || !(second instanceof HTMLElement)) return;
    rail.scrollBy({ left: direction * (second.offsetLeft - first.offsetLeft) });
  }

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  return (
    <div className="landing min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <a
          href="#"
          className="flex items-center gap-3 font-serif text-2xl font-semibold tracking-tight"
        >
          <img src={img("unijourney-logo.png")} alt="" className="h-10 w-10 shrink-0" />
          <span>UniJourney</span>
        </a>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground lg:gap-8">
          <a href="#how-it-works" className="hidden hover:text-foreground md:inline">
            How it works
          </a>
          <a href="#features" className="hidden hover:text-foreground md:inline">
            Features
          </a>
          <a href="#screens" className="hidden hover:text-foreground md:inline">
            Inside the app
          </a>
          <a href="#roadmap" className="hidden hover:text-foreground md:inline">
            Roadmap
          </a>
          <a href="#team" className="hidden hover:text-foreground md:inline">
            Team
          </a>
          <Link
            to="/"
            search={{ login: true }}
            className="rounded-full border border-primary/25 bg-card px-5 py-2 font-semibold text-primary transition hover:border-primary/60 hover:bg-secondary"
          >
            Log in
          </Link>
        </nav>
      </header>

      <section className="grid-paper">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-widest">
              Prototype live
            </span>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] md:text-7xl">
              Your university journey, <em className="text-primary">mapped out.</em>
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              UniJourney helps students organize their studies, keep up with deadlines and track
              academic progress — all in one app.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/demo"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Try the app {arrow}
              </Link>
              <Link
                to="/"
                search={{ login: true }}
                className="inline-flex rounded-full border border-primary/25 bg-card px-7 py-3 font-semibold text-primary transition hover:border-primary/60 hover:bg-secondary"
              >
                Log in
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[300px]">
            <div className="float-slow overflow-hidden rounded-[2rem] border-4 border-ink bg-ink shadow-2xl">
              <button
                type="button"
                onClick={() => setZoom(screens[0])}
                aria-label="Enlarge dashboard screen"
                className="block w-full cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
              >
                <ScreenshotImage screen={screens[0]} />
              </button>
            </div>
            <div className="absolute -bottom-4 -left-8 rounded-2xl bg-ink p-4 text-ink-foreground shadow-xl">
              <p className="text-xs opacity-70">Reminder</p>
              <p className="text-sm font-semibold">Deadline in 2 days</p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        aria-labelledby="how-it-works-title"
        className="border-y border-border bg-secondary/40"
      >
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <h2 id="how-it-works-title" className="text-4xl font-semibold md:text-5xl">
            How it works
          </h2>
          <ol className="mt-8 grid gap-3 md:grid-cols-3 md:gap-5">
            {setupSteps.map(({ title, description }, index) => (
              <li
                key={title}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-border bg-card p-4 md:flex md:flex-col md:p-6"
              >
                <span
                  aria-hidden="true"
                  className="grid size-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="features"
        aria-labelledby="features-title"
        className="mx-auto max-w-6xl px-6 py-14 md:py-24"
      >
        <h2 id="features-title" className="max-w-xl text-3xl font-semibold md:text-5xl">
          What UniJourney gives you
        </h2>
        <ul className="mt-6 grid gap-3 md:mt-10 md:grid-cols-3 md:gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-border bg-card p-4 md:flex md:flex-col md:gap-4 md:p-6"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary md:size-11">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-lg leading-tight font-semibold md:text-xl">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="screens" ref={gallery} className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-3xl font-semibold md:text-5xl">Inside the app</h2>
          <div className="flex gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => moveScreens(-1)}
              aria-label="Previous screenshot"
              className="grid size-10 place-items-center rounded-full border border-border bg-card text-primary hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => moveScreens(1)}
              aria-label="Next screenshot"
              className="grid size-10 place-items-center rounded-full border border-border bg-card text-primary hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div
          ref={screenshotRail}
          className="relative mt-5 flex snap-x snap-mandatory scroll-px-1 gap-3 overflow-x-auto px-1 pt-2 pb-3 motion-safe:scroll-smooth lg:mt-7 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible"
        >
          {screens.map((screen) => (
            <article
              key={screen.t}
              data-screenshot
              className="w-[min(68vw,220px)] shrink-0 snap-start lg:w-auto"
            >
              <button
                type="button"
                onClick={() => setZoom(screen)}
                aria-label={`Enlarge ${screen.t} screen`}
                className="relative block w-full cursor-zoom-in overflow-hidden rounded-2xl border border-border bg-card shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:transition-transform motion-safe:hover:-translate-y-1 [article[data-visible=true]_&]:motion-safe:animate-[screenshot-arrive_550ms_ease-out]"
              >
                <ScreenshotImage screen={screen} />
                <span
                  className="absolute right-2 bottom-2 grid size-8 place-items-center rounded-full border border-border bg-card text-primary shadow-sm"
                  aria-hidden="true"
                >
                  <ZoomIn className="size-4" />
                </span>
              </button>
              <h3 className="mt-2 text-lg font-semibold">{screen.t}</h3>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">{screen.d}</p>
            </article>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-6 rounded-2xl border border-primary/20 bg-secondary/70 p-8 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-2xl font-semibold">Want to click through it yourself?</h3>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Try the app with a sample student — tap through the dashboard, progress, plan,
              calendar and news views.
            </p>
          </div>
          <Link
            to="/demo"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-7 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Try the app {arrow}
          </Link>
        </div>
      </section>

      <section id="roadmap" className="bg-ink text-ink-foreground">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-4xl font-semibold md:text-5xl">The journey so far</h2>
          <div className="mt-14 grid gap-8 md:grid-cols-4">
            {roadmap.map((r) => (
              <div key={r.t} className="border-t border-ink-foreground/20 pt-6">
                <span
                  className={`text-xs font-bold uppercase tracking-widest ${r.s === "Now" ? "rounded-full bg-ink-foreground px-2 py-0.5 text-ink" : "opacity-70"}`}
                >
                  {r.s}
                </span>
                <h3 className="mt-3 text-xl font-semibold">{r.t}</h3>
                <p className="mt-2 text-sm opacity-70">{r.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="team" aria-labelledby="team-heading" className="border-t bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <h2 id="team-heading" className="text-4xl font-semibold md:text-5xl">
            The people behind UniJourney
          </h2>
          <p className="mt-3 max-w-xl text-lg text-muted-foreground">
            Have a question or an idea for UniJourney? Connect with us on LinkedIn. We’d love to
            hear from you.
          </p>
          <ul className="mt-8 grid gap-3 md:mt-10 md:grid-cols-3 md:gap-6">
            {team.map((member) => (
              <li key={member.name} className="min-w-0">
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Connect with ${member.name} on LinkedIn`}
                  className="group grid h-full grid-cols-[minmax(0,2fr)_minmax(0,3fr)] overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:flex md:flex-col"
                >
                  <div className="grid min-h-32 place-items-center bg-secondary/60 px-2 py-4 md:py-8">
                    <img
                      src={member.src}
                      alt=""
                      width={800}
                      height={800}
                      loading="lazy"
                      decoding="async"
                      className="aspect-square w-full max-w-24 rounded-full object-cover ring-2 ring-card motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105 md:max-w-40"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-4 md:p-5">
                    <h3 className="wrap-anywhere text-lg leading-tight font-semibold lg:text-xl">
                      {member.name}
                    </h3>
                    <p className="text-sm leading-snug text-muted-foreground">{member.role}</p>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-primary md:pt-4">
                      Connect on LinkedIn
                      <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} UniJourney
      </footer>

      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`UniJourney ${zoom.t} screen`}
          onClick={() => setZoom(null)}
        >
          <button
            type="button"
            onClick={() => setZoom(null)}
            aria-label="Close enlarged screenshot"
            className="absolute top-6 right-6 rounded-full bg-card p-3 text-foreground shadow-lg transition hover:bg-secondary"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-[min(100%,39dvh)] overflow-hidden rounded-xl border border-border shadow-2xl"
          >
            <ScreenshotImage screen={zoom} />
          </div>
        </div>
      )}
    </div>
  );
}
