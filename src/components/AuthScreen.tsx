import { useState } from "react";
import { GraduationCap, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabase } from "@/lib/supabase";

const copy = {
  en: {
    title: "Sign in to UniJourney",
    intro: "We'll email you a sign-in link. No password needed.",
    email: "Email",
    send: "Email me a link",
    sending: "Sending…",
    sent: (email: string) => `Check ${email} and open the link on this device.`,
    other: "Use another email",
  },
  sv: {
    title: "Logga in på UniJourney",
    intro: "Vi mejlar dig en inloggningslänk. Inget lösenord behövs.",
    email: "E-post",
    send: "Mejla mig en länk",
    sending: "Skickar…",
    sent: (email: string) => `Kolla ${email} och öppna länken på den här enheten.`,
    other: "Använd en annan e-post",
  },
};

export function AuthScreen({ lang }: { lang: "en" | "sv" }) {
  const t = copy[lang];
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("sending");
    setError(null);
    const { error } = await getSupabase().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
      setState("idle");
    } else setState("sent");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-10">
      <span className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-brand">
        <GraduationCap className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-5 font-display text-2xl font-bold">{t.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t.intro}</p>

      {state === "sent" ? (
        <div
          className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-card"
          role="status"
        >
          <Mail className="size-5 text-primary" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold">{t.sent(email.trim())}</p>
          <Button
            type="button"
            variant="ghost"
            className="mt-3 px-0"
            onClick={() => setState("idle")}
          >
            {t.other}
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="block text-sm font-semibold" htmlFor="email">
            {t.email}
          </label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
          {error && (
            <p className="text-sm font-semibold text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="h-11 w-full" disabled={state === "sending"}>
            {state === "sending" ? t.sending : t.send}
          </Button>
        </form>
      )}
    </main>
  );
}
