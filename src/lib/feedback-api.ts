import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { feedbackCategories, type FeedbackCategory } from "./feedback";

// Saves feedback as the sender (anonymous or signed in, so the database rules still apply),
// then emails the team. A failed email never loses the feedback.
export const sendFeedback = createServerFn({ method: "POST" })
  .validator((input: { category: string; message: string; accessToken?: string | null }) => {
    if (!feedbackCategories.includes(input.category as FeedbackCategory))
      throw new Error("Invalid category");
    const message = String(input.message ?? "").trim();
    if (!message || message.length > 2000) throw new Error("Invalid message");
    const accessToken = typeof input.accessToken === "string" ? input.accessToken : null;
    return { category: input.category as FeedbackCategory, message, accessToken };
  })
  .handler(async ({ data }) => {
    const url = import.meta.env["VITE_SUPABASE_URL"] as string;
    const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string;
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: data.accessToken ? { headers: { Authorization: `Bearer ${data.accessToken}` } } : {},
    });
    const { error } = await supabase
      .from("feedback")
      .insert({ category: data.category, message: data.message });
    if (error) return { error: error.message };

    await notifyTeam(data.category, data.message, Boolean(data.accessToken));
    return { error: null };
  });

async function notifyTeam(category: FeedbackCategory, message: string, signedIn: boolean) {
  const apiKey = process.env["RESEND_API_KEY"];
  const to = process.env["FEEDBACK_NOTIFY_TO"]
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!apiKey || !to?.length) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env["FEEDBACK_EMAIL_FROM"] || "UniJourney <onboarding@resend.dev>",
        to,
        subject: `New feedback: ${category}`,
        // Plain text: the message is user input and must not become HTML.
        text: `${message}\n\nCategory: ${category}\nFrom: ${signedIn ? "a signed-in student" : "a demo visitor"}\n\nAll feedback: https://unijourney.vercel.app/admin`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error(`Feedback email failed: ${res.status} ${await res.text()}`);
  } catch (e) {
    console.error("Feedback email failed", e);
  }
}
