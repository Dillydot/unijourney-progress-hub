import { AuthScreen } from "@/components/AuthScreen";
import { LadokImport } from "@/components/LadokImport";
import { Dashboard, type Tab } from "@/components/dashboard/Dashboard";
import { Button } from "@/components/ui/button";
import { Lang } from "@/lib/copy";
import { physicsDemoEvents, physicsDemoPlan, physicsDemoView } from "@/lib/physics-demo";
import { CourseRow, ProfileRow, buildStudentView } from "@/lib/student-view";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { login?: true } =>
    search["login"] === true ? { login: true } : {},
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
  const [lang, setLang] = useState<Lang>("en");
  const [session, setSession] = useState<Session | null>(null);
  const { login } = Route.useSearch();

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const { data } = getSupabase().auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  if (session) {
    return (
      <AuthenticatedDashboard
        key={session.user.id}
        session={session}
        lang={lang}
        setLang={setLang}
      />
    );
  }
  if (login) return <AuthScreen lang={lang} />;
  return <DemoDashboard lang={lang} setLang={setLang} />;
}

type LanguageProps = {
  lang: Lang;
  setLang: React.Dispatch<React.SetStateAction<Lang>>;
};

function DemoDashboard({ lang, setLang }: LanguageProps) {
  return (
    <Dashboard
      view={physicsDemoView}
      lang={lang}
      setLang={setLang}
      demoPlan={physicsDemoPlan}
      demoEvents={physicsDemoEvents}
    />
  );
}

function AuthenticatedDashboard({ session, lang, setLang }: LanguageProps & { session: Session }) {
  const supabase = getSupabase();
  const [data, setData] = useState<StoredData | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reimport, setReimport] = useState(false);
  const [returnTab, setReturnTab] = useState<Tab>("dashboard");

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
    void load();
    // Counts today as active for admin retention; failing is harmless. .then() sends the request.
    void supabase.rpc("track_activity").then();
  }, []);
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
  if (data === undefined)
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
          void load().finally(() => setReimport(false));
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
      initialTab={returnTab}
      onReimport={(tab) => {
        setReturnTab(tab);
        setReimport(true);
      }}
      onSignOut={() => void supabase.auth.signOut()}
    />
  );
}
