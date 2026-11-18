import { AuthScreen } from "@/components/AuthScreen";
import { LadokImport } from "@/components/LadokImport";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { Button } from "@/components/ui/button";
import { Lang } from "@/lib/copy";
import { CourseRow, ProfileRow, buildStudentView } from "@/lib/student-view";
import { getSupabase, useLocalPreview } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — UniJourney" },
      {
        name: "description",
        content:
          "Track academic progress, the next registration deadline, current courses, recent grades and notifications in one clean student dashboard.",
      },
      { property: "og:title", content: "Student Dashboard — UniJourney" },
      {
        property: "og:description",
        content:
          "Progress, registration deadlines, current courses, grades and notifications — your university journey at a glance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type StoredData = { profile: ProfileRow; courses: CourseRow[] } | null;

function Index() {
  return useLocalPreview ? <LocalPreview /> : <AuthenticatedDashboard />;
}

function LocalPreview() {
  const [lang, setLang] = useState<Lang>("en");
  const view = buildStudentView(
    {
      display_name: "Alex Morgan",
      programme_code: "TTBEM",
      programme_name: "Technology-based Entrepreneurship",
      programme_credits: 120,
      programme_start: "2026-08-24",
      programme_end: "2028-06-05",
      transcript_printed: null,
    },
    [
      {
        code: "ME2003",
        name: "Entrepreneurship",
        credits: 7.5,
        earned_credits: 7.5,
        start_date: "2026-08-24",
        end_date: "2026-10-23",
        grade: "A",
        grade_date: "2026-11-02",
        status: "completed",
      },
      {
        code: null,
        name: "Innovation Management",
        credits: 7.5,
        earned_credits: 0,
        start_date: "2026-10-26",
        end_date: "2027-01-15",
        grade: null,
        grade_date: null,
        status: "ongoing",
      },
      {
        code: "DEMO101",
        name: "Design Thinking",
        credits: 7.5,
        earned_credits: 7.5,
        start_date: "2026-08-24",
        end_date: "2026-10-23",
        grade: "B",
        grade_date: "2026-11-04",
        status: "completed",
      },
      {
        code: "DEMO102",
        name: "Market Research",
        credits: 7.5,
        earned_credits: 7.5,
        start_date: "2026-08-24",
        end_date: "2026-10-23",
        grade: "C",
        grade_date: "2026-11-06",
        status: "completed",
      },
      {
        code: "DEMO103",
        name: "Business Model Design",
        credits: 7.5,
        earned_credits: 0,
        start_date: "2026-08-24",
        end_date: "2026-10-23",
        grade: null,
        grade_date: null,
        status: "awaiting_result",
      },
      {
        code: "DEMO104",
        name: "Digital Product Design",
        credits: 7.5,
        earned_credits: 0,
        start_date: "2026-10-26",
        end_date: "2027-01-15",
        grade: null,
        grade_date: null,
        status: "ongoing",
      },
      {
        code: "DEMO105",
        name: "Entrepreneurial Finance",
        credits: 7.5,
        earned_credits: 0,
        start_date: "2026-10-26",
        end_date: "2027-01-15",
        grade: null,
        grade_date: null,
        status: "ongoing",
      },
      {
        code: "DEMO106",
        name: "Sustainable Venture Development",
        credits: 7.5,
        earned_credits: 0,
        start_date: "2026-10-26",
        end_date: "2027-01-15",
        grade: null,
        grade_date: null,
        status: "ongoing",
      },
    ],
    "",
    "2026-11-18",
  );
  return <Dashboard view={view} lang={lang} setLang={setLang} />;
}

function AuthenticatedDashboard() {
  const supabase = getSupabase();
  const [lang, setLang] = useState<Lang>("en");
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [data, setData] = useState<StoredData | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reimport, setReimport] = useState(false);
  const userId = session?.user.id;

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function load() {
    setLoadError(null);
    const [profile, courses] = await Promise.all([
      supabase.from("profiles").select("*").maybeSingle<ProfileRow>(),
      supabase.from("courses").select("*").returns<CourseRow[]>(),
    ]);
    const error = profile.error ?? courses.error;
    if (error) setLoadError(error.message);
    else setData(profile.data ? { profile: profile.data, courses: courses.data ?? [] } : null);
  }

  useEffect(() => {
    setData(undefined);
    if (userId) void load();
  }, [userId]);

  if (session === null) return <AuthScreen lang={lang} />;
  if (loadError)
    return (
      <main className="mx-auto max-w-sm px-5 py-16 text-center">
        <p className="text-sm font-semibold text-destructive" role="alert">
          {loadError}
        </p>
        <Button type="button" className="mt-4" onClick={() => void load()}>
          Retry
        </Button>
      </main>
    );
  if (!session || data === undefined)
    return (
      <main className="grid min-h-screen place-items-center text-sm font-semibold text-muted-foreground">
        …
      </main>
    );
  if (data === null || reimport)
    return (
      <LadokImport
        lang={lang}
        defaultName={data?.profile.display_name ?? ""}
        onDone={() => {
          setReimport(false);
          void load();
        }}
        onCancel={data ? () => setReimport(false) : undefined}
      />
    );

  return (
    <Dashboard
      view={buildStudentView(
        data.profile,
        data.courses,
        session.user.email ?? "",
        new Date().toISOString().slice(0, 10),
      )}
      lang={lang}
      setLang={setLang}
      onReimport={() => setReimport(true)}
      onSignOut={() => void supabase.auth.signOut()}
    />
  );
}
