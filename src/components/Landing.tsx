import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

// Images live in public/landing/.
const img = (name: string) => `/landing/${name}`;

const features = [
  {
    n: "01",
    t: "A clear path to your degree",
    d: "See your programme structure at a glance — mandatory and elective courses by year and semester — and organize your studies with a plan that shows exactly what's next.",
    bullets: [
      "Programme structure laid out by year and semester",
      "Mandatory and elective courses, ECTS and study periods",
      "Your own plan, from first course to graduation",
    ],
  },
  {
    n: "02",
    t: "Never miss a deadline",
    d: "Smart push notifications tell you what needs you now, and everything lands on one friendly calendar you can actually read.",
    bullets: [
      "Exams, course registrations and course applications",
      "University news and events, new grades, seminars and lectures",
      "All of it on a user-friendly calendar, with reminders",
    ],
  },
  {
    n: "03",
    t: "Track your academic progress",
    d: "Visual graphs and pie charts turn your record into something you can read in seconds — credits earned, courses passed, what still needs another try.",
    bullets: [
      "Credits per semester against your expected plan",
      "Passed and failed courses, counted and colour-coded",
      "Graphs and pie charts, from study period to full degree",
    ],
  },
];

const screens = [
  {
    src: img("dashboard.png"),
    t: "Dashboard",
    d: "Academic year at a glance — programme progress, credits and the next deadline, right when you open the app.",
  },
  {
    src: img("progress.png"),
    t: "Progress",
    d: "Credits earned against your expected study plan — see how far you've come and what's still ahead.",
  },
  {
    src: img("plan.png"),
    t: "Plan",
    d: "Explore mandatory and elective courses by year, semester and study period, and build your programme plan.",
  },
  {
    src: img("calendar.png"),
    t: "Calendar",
    d: "Lectures, seminars, exams and registrations on a clear monthly view — with reminders and map links to rooms.",
  },
  {
    src: img("news.png"),
    t: "News",
    d: "Stories from your university, filtered by topic — choose which notifications you want to receive.",
  },
];

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

const heroScreen = img("dashboard.png");

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
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);

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
        <nav className="flex items-center gap-8 text-sm text-muted-foreground">
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
              Your university years, <em className="text-primary">mapped out.</em>
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
            <div className="float-slow rounded-[2.6rem] border-[6px] border-ink bg-ink shadow-2xl">
              <button
                type="button"
                onClick={() => setZoom({ src: heroScreen, alt: "UniJourney dashboard screen" })}
                aria-label="Enlarge dashboard screen"
                className="block w-full cursor-zoom-in"
              >
                <img
                  src={heroScreen}
                  alt="UniJourney dashboard screen"
                  className="block w-full rounded-[2rem]"
                />
              </button>
            </div>
            <div className="absolute -bottom-4 -left-8 rounded-2xl bg-ink p-4 text-ink-foreground shadow-xl">
              <p className="text-xs opacity-70">Reminder</p>
              <p className="text-sm font-semibold">Deadline in 2 days</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="max-w-xl text-4xl font-semibold md:text-5xl">What UniJourney gives you.</h2>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Three things every student needs: know where you're going, never miss what's due, and see
          how far you've come.
        </p>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.n}
              className="flex flex-col rounded-2xl border bg-card p-8 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="font-serif text-4xl text-primary">{f.n}</span>
              <h3 className="mt-6 text-2xl font-semibold">{f.t}</h3>
              <p className="mt-3 text-muted-foreground">{f.d}</p>
              <ul className="mt-6 space-y-3 border-t pt-6">
                {f.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    >
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="screens" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="max-w-xl text-4xl font-semibold md:text-5xl">Inside the app</h2>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Five core views keep your whole student life in one place.
        </p>
        <div className="mt-14 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 lg:grid lg:grid-cols-5 lg:overflow-visible">
          {screens.map((s) => (
            <div key={s.t} className="w-[250px] shrink-0 snap-center lg:w-auto">
              <div className="rounded-[1.9rem] border bg-card p-1.5 shadow-lg">
                <button
                  type="button"
                  onClick={() => setZoom({ src: s.src, alt: `UniJourney ${s.t} screen` })}
                  aria-label={`Enlarge ${s.t} screen`}
                  className="block w-full cursor-zoom-in transition-transform hover:scale-[1.02]"
                >
                  <img
                    src={s.src}
                    alt={`UniJourney ${s.t} screen`}
                    className="block w-full rounded-[1.5rem]"
                  />
                </button>
              </div>
              <h3 className="mt-5 text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
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

      <section id="team" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="max-w-xl text-4xl font-semibold md:text-5xl">
          The people behind UniJourney
        </h2>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          The dynamic team behind UniJourney, an app for students by students. Reach out on LinkedIn
          — we're always happy to talk.
        </p>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {team.map((m) => (
            <a
              key={m.name}
              href={m.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-2xl border bg-card p-8 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <img
                src={m.src}
                alt={`Portrait of ${m.name}`}
                className="h-28 w-28 rounded-full object-cover ring-2 ring-primary/25 ring-offset-4 ring-offset-card"
              />
              <h3 className="mt-6 text-2xl font-semibold">{m.name}</h3>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-primary">
                {m.role}
              </p>
              <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-primary">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
                  <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0z" />
                </svg>
                Connect on LinkedIn
                <span className="transition group-hover:translate-x-1">→</span>
              </span>
            </a>
          ))}
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
          aria-label={zoom.alt}
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
          <img
            src={zoom.src}
            alt={zoom.alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-[2rem] bg-card p-2 shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
