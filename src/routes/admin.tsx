import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { feedbackCategories, type FeedbackCategory } from "@/components/FeedbackDialog";
import { ui } from "@/lib/copy";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { Link, createFileRoute } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
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
  feedback_new: number;
  funnel: {
    signed_up: number;
    imported: number;
    returned: number;
    returned_after_7d: number;
    old_enough_7d: number;
    returned_after_30d: number;
    old_enough_30d: number;
  };
  weekly: { week: string; signups: number; active: number }[];
  feedback_by_category: Partial<Record<FeedbackCategory, number>>;
  top_programmes: { code: string; name: string | null; students: number }[];
};

type Feedback = {
  id: number;
  created_at: string;
  user_id: string | null;
  category: FeedbackCategory;
  message: string;
  status: FeedbackStatus;
};

const statuses = ["new", "seen", "resolved"] as const;
type FeedbackStatus = (typeof statuses)[number];

const labels = ui.en.feedbackCategories;
const percent = (part: number, whole: number) =>
  whole ? `${Math.round((part / whole) * 100)}%` : "–";
const weekLabel = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
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

  if (session === undefined) return <Shell signedIn={false}>Loading…</Shell>;
  if (!session)
    return (
      <Shell signedIn={false}>
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
  const [hideResolved, setHideResolved] = useState(true);
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

  async function setStatus(id: number, status: FeedbackStatus) {
    const before = feedback;
    setFeedback((list) => list.map((f) => (f.id === id ? { ...f, status } : f)));
    const { error } = await getSupabase().from("feedback").update({ status }).eq("id", id);
    if (error) {
      setFeedback(before);
      alert(`Could not change the status: ${error.message}`);
    }
  }

  const shown = feedback.filter(
    (f) =>
      (filter === "all" || f.category === filter) && !(hideResolved && f.status === "resolved"),
  );
  const newCount = feedback.filter((f) => f.status === "new").length;
  const funnel = metrics.funnel;
  const weeks = metrics.weekly.map((w) => ({ ...w, label: weekLabel.format(new Date(w.week)) }));

  return (
    <Shell>
      <section aria-label="Metrics" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Users" value={metrics.users} sub={`+${metrics.new_users_7d} this week`} />
        <Tile
          label="Active this week"
          value={metrics.active_users_7d}
          sub="opened the app, last 7 days"
        />
        <Tile
          label="Ladok imports"
          value={metrics.ladok_imports}
          sub={`${metrics.ladok_imports_7d} updated this week`}
        />
        <Tile label="Feedback" value={metrics.feedback} sub={`+${metrics.feedback_7d} this week`} />
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <h2 className="section-label mb-3">From sign-up to coming back</h2>
          <ol className="space-y-3">
            <FunnelStep label="Signed up" value={funnel.signed_up} of={funnel.signed_up} />
            <FunnelStep label="Imported Ladok" value={funnel.imported} of={funnel.signed_up} />
            <FunnelStep
              label="Came back on a later day"
              value={funnel.returned}
              of={funnel.signed_up}
            />
          </ol>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <h2 className="section-label mb-3">Retention</h2>
          <dl className="grid grid-cols-2 gap-3">
            <Retention
              label="Back after 7+ days"
              value={funnel.returned_after_7d}
              of={funnel.old_enough_7d}
            />
            <Retention
              label="Back after 30+ days"
              value={funnel.returned_after_30d}
              of={funnel.old_enough_30d}
            />
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Out of users who signed up at least 7 / 30 days ago. Daily visits are counted from this
            release on, so earlier weeks look lower than they were.
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-2">
        <WeeklyChart title="Sign-ups per week" rows={weeks} dataKey="signups" />
        <WeeklyChart title="Active users per week" rows={weeks} dataKey="active" />
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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-label">Feedback · {newCount} new</h2>
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <input
              type="checkbox"
              checked={hideResolved}
              onChange={(e) => setHideResolved(e.target.checked)}
            />
            Hide resolved
          </label>
        </div>
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
                <div className="mt-3 flex gap-1.5" role="group" aria-label="Status">
                  {statuses.map((st) => (
                    <button
                      key={st}
                      type="button"
                      aria-pressed={f.status === st}
                      onClick={() => void setStatus(f.id, st)}
                      className={`min-h-8 rounded-lg border px-2.5 text-xs font-semibold capitalize ${
                        f.status === st
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
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

function FunnelStep({ label, value, of }: { label: string; value: number; of: number }) {
  return (
    <li>
      <div className="flex justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="font-semibold">
          {value} <span className="text-muted-foreground">· {percent(value, of)}</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-secondary">
        <div
          className="h-2 rounded-full bg-primary"
          style={{ width: of ? `${(value / of) * 100}%` : 0 }}
        />
      </div>
    </li>
  );
}

function Retention({ label, value, of }: { label: string; value: number; of: number }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-bold">{percent(value, of)}</dd>
      <dd className="text-xs text-muted-foreground">
        {value} of {of}
      </dd>
    </div>
  );
}

function WeeklyChart({
  title,
  rows,
  dataKey,
}: {
  title: string;
  rows: { label: string; signups: number; active: number }[];
  dataKey: "signups" | "active";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <h2 className="section-label mb-3">{title}</h2>
      <ChartContainer
        config={{ [dataKey]: { label: title, color: "var(--primary)" } }}
        className="h-44 w-full"
      >
        <BarChart data={rows} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar
            dataKey={dataKey}
            fill={`var(--color-${dataKey})`}
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ChartContainer>
      <details className="mt-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer">Show as table</summary>
        <table className="mt-2 w-full">
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td>Week of {r.label}</td>
                <td className="text-right font-semibold text-foreground">{r[dataKey]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
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

function Shell({ children, signedIn = true }: { children: React.ReactNode; signedIn?: boolean }) {
  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-4 py-8 text-foreground">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">UniJourney admin</h1>
        {signedIn && (
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-xl"
            onClick={() => void getSupabase().auth.signOut()}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Log out
          </Button>
        )}
      </div>
      {children}
    </main>
  );
}
