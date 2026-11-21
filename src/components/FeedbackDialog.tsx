import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Lang, ui } from "@/lib/copy";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

// Must match the check constraint in the feedback migration.
export const feedbackCategories = ["bug", "idea", "data", "design", "other"] as const;
export type FeedbackCategory = (typeof feedbackCategories)[number];
const MAX_LENGTH = 2000;

export function FeedbackDialog({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const t = ui[lang];
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next && state === "sent") {
      setCategory(null);
      setMessage("");
      setState("idle");
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !message.trim()) return;
    setState("sending");
    setError(null);
    const { error } = await getSupabase()
      .from("feedback")
      .insert({ category, message: message.trim() });
    if (error) {
      setError(error.message);
      setState("idle");
    } else setState("sent");
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t.feedbackTitle}</DialogTitle>
          <DialogDescription>{t.feedbackDescription}</DialogDescription>
        </DialogHeader>
        {state === "sent" ? (
          <p
            role="status"
            className="rounded-xl bg-success-soft p-3 text-sm font-semibold text-success"
          >
            {t.feedbackThanks}
          </p>
        ) : (
          <form onSubmit={send} className="space-y-4">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">{t.feedbackCategory}</legend>
              <div className="grid gap-2 min-[375px]:grid-cols-2">
                {feedbackCategories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={category === c}
                    onClick={() => setCategory(c)}
                    className={`min-h-11 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                      category === c
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border bg-secondary text-muted-foreground"
                    }`}
                  >
                    {t.feedbackCategories[c]}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">{t.feedbackMessage}</span>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={MAX_LENGTH}
                rows={5}
                required
                placeholder={t.feedbackPlaceholder}
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="h-11 w-full rounded-xl"
              disabled={
                !isSupabaseConfigured || !category || !message.trim() || state === "sending"
              }
            >
              {state === "sending" ? t.feedbackSending : t.feedbackSend}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
