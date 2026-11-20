import { createServerFn } from "@tanstack/react-start";
import { kthCalendarUrl, parseKthCalendar } from "./kth-calendar";

const MAX_BYTES = 2 * 1024 * 1024;

export const importKthCalendar = createServerFn({ method: "POST" })
  .validator((input: unknown) => (typeof input === "string" ? input : ""))
  .handler(async ({ data }) => {
    const url = kthCalendarUrl(data);
    if (!url) return { error: "invalid" } as const;

    try {
      const response = await fetch(url, {
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
        headers: { accept: "text/calendar, application/octet-stream" },
      });
      if (!response.ok || !response.body) return { error: "unavailable" } as const;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      let bytes = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > MAX_BYTES) {
          await reader.cancel();
          return { error: "unavailable" } as const;
        }
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();

      if (!text.trimStart().startsWith("BEGIN:VCALENDAR")) return { error: "invalid" } as const;
      return { events: parseKthCalendar(text) };
    } catch {
      // A subscription URL can contain a private token. Keep it out of error messages.
      return { error: "unavailable" } as const;
    }
  });
