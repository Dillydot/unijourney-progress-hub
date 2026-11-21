import { Button } from "@/components/ui/button";
import { feedbackCategories, type FeedbackCategory } from "@/components/FeedbackDialog";
import { ui } from "@/lib/copy";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — UniJourney" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

// Shape returned by the admin_metrics() database function.
type Metrics = {
  users: number;
  new_users_7d: number;
  active_users_7d: number;
  ladok_imports: number;
  ladok_imports_7d: number;
  courses: number;
  feedback: number;
  feedback_7d: number;
  feedback_by_category: Partial<Record<FeedbackCategory, number>>;
  top_programmes: { code: string; name: string | null; students: number }[];
};

type Feedback = {
  id: number;
  created_at: string;
  user_id: string | null;
  category: FeedbackCategory;
  message: string;
};

const labels = ui.en.feedbackCategories;
const dateTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Stockholm",
});

function Admin() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (!isSupabaseConfigured) return setSession(null);
    const { data } = getSupabase().auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <Shell>Loading…</Shell>;
  if (!session)
    return (
      <Shell>
        <p className="mb-4">Sign in with an admin account to see this page.</p>
        <Button asChild className="rounded-xl">
          <Link to="/" search={{ login: true }}>
            Sign in
          </Link>
        </Button>
      </Shell>
    );
  return <AdminData />;
}

function AdminData() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [filter, setFilter] = useState<FeedbackCategory | "all">("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    void Promise.all([
      supabase.rpc("admin_metrics"),
      supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500)
        .returns<Feedback[]>(),
    ]).then(([m, f]) => {
      const failed = m.error ?? f.error;
      if (failed) return setError(failed.message);
      setMetrics(m.data as Metrics);
      setFeedback(f.data ?? []);
    });
  }, []);

  if (error)
    return (
      <Shell>
        <p role="alert" className="text-destructive">
          {error === "not an admin" ? "This account is not an admin." : error}
        </p>
      </Shell>
    );
  if (!metrics) return <Shell>Loading…</Shell>;

  const shown = filter === "all" ? feedback : feedback.filter((f) => f.category === filter);

  return (
    <Shell>
      <section aria-label="Metrics" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Users" value={metrics.users} sub={`+${metrics.new_users_7d} this week`} />
        <Tile
          label="Active this week"
          value={metrics.active_users_7d}
          sub="signed in, last 7 days"
        />
        <Tile
          label="Ladok imports"
          value={metrics.ladok_imports}
          sub={`${metrics.ladok_imports_7d} updated this week`}
        />
        <Tile label="Feedback" value={metrics.feedback} sub={`+${metrics.feedback_7d} this week`} />
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-card">
        <h2 className="section-label mb-3">Top programmes</h2>
        {metrics.top_programmes.length ? (
          <ul className="space-y-1.5 text-sm">
            {metrics.top_programmes.map((p) => (
              <li key={p.code} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">
                  <span className="font-bold">{p.code}</span> {p.name}
                </span>
                <span className="font-semibold">{p.students}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No imports yet.</p>
        )}
      </section>

      <section className="mt-6">
        <h2 className="section-label mb-3">Feedback</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {(["all", ...feedbackCategories] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={filter === c}
              onClick={() => setFilter(c)}
              className={`min-h-9 rounded-full border px-3 text-xs font-semibold ${
                filter === c
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-secondary text-muted-foreground"
              }`}
            >
              {c === "all"
                ? `All (${metrics.feedback})`
                : `${labels[c]} (${metrics.feedback_by_category[c] ?? 0})`}
            </button>
          ))}
        </div>
        {shown.length ? (
          <ul className="space-y-3">
            {shown.map((f) => (
              <li key={f.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 font-bold text-primary">
                    {labels[f.category]}
                  </span>
                  <span>{dateTime.format(new Date(f.created_at))}</span>
                  <span>· {f.user_id ? "signed in" : "demo visitor"}</span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm">{f.message}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No feedback here yet.</p>
        )}
      </section>
    </Shell>
  );
}

function Tile({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-4 py-8 text-foreground">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">UniJourney admin</h1>
        <Link to="/" className="text-sm font-semibold text-primary">
          Back to app
        </Link>
      </div>
      {children}
    </main>
  );
}
