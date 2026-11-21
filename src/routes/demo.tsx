import { Dashboard } from "@/components/dashboard/Dashboard";
import { Lang } from "@/lib/copy";
import { physicsDemoEvents, physicsDemoPlan, physicsDemoView } from "@/lib/physics-demo";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demo — UniJourney" },
      {
        name: "description",
        content: "Try UniJourney with a sample physics student: progress, plan, calendar and news.",
      },
    ],
  }),
  component: Demo,
});

function Demo() {
  const [lang, setLang] = useState<Lang>("en");
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
