import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
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
    d: "See lectures, seminars, exams and registrations in weekly and monthly views. Open an event for details and map links.",
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

      <section id="team" aria-labelledby="team-heading" className="border-t bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <h2 id="team-heading" className="text-4xl font-semibold md:text-5xl">
            The people behind UniJourney
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">Built by students, for students.</p>
          <ul className="mt-8 grid gap-3 md:mt-10 md:grid-cols-3 md:gap-6">
            {team.map((member) => (
              <li key={member.name} className="min-w-0">
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name} on LinkedIn`}
                  className="group grid h-full grid-cols-[minmax(0,2fr)_minmax(0,3fr)] overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:flex md:flex-col"
                >
                  <div className="relative min-h-32 overflow-hidden bg-secondary md:aspect-[4/3]">
                    <img
                      src={member.src}
                      alt=""
                      width={800}
                      height={800}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 size-full object-cover object-[center_35%] motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-4 md:p-5">
                    <h3 className="wrap-anywhere text-lg leading-tight font-semibold lg:text-xl">
                      {member.name}
                    </h3>
                    <p className="text-sm leading-snug text-muted-foreground">{member.role}</p>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-primary md:pt-4">
                      LinkedIn
                      <ArrowUpRight className="size-4" aria-hidden="true" />
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
