// Notifications derived from data we already have: the KTH plan and the imported Ladok grades.
// shortcut: computed in the browser on each visit, no push/email; add a cron + Resend for reminders.
import type { IconComponent } from "@/components/dashboard/parts";
import { Award, BellRing, CalendarClock } from "lucide-react";
import type { PlanEvent } from "./kth";
import type { CompletedCourse } from "./student-view";

export type Tone = "primary" | "success" | "warning" | "destructive";
export type NotificationTarget = "dashboard" | "progress" | "plan" | "news" | "profile";

export type Notification = {
  id: string;
  type: string;
  icon: IconComponent;
  title: string;
  body: string;
  time: string;
  tone: Tone;
  unread: boolean;
  target: NotificationTarget;
  href?: string;
  linkKey?: "applyOnAdmissions" | "registerOnLadok";
  push?: boolean;
};

export const toneChip: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
};

const DAY = 864e5;
const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / DAY);
const fmt = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/** Registration windows in the next 30 days, courses starting in the next 14, grades from the last 30. */
export function buildNotifications(
  events: PlanEvent[],
  courses: CompletedCourse[],
  today: string,
): Notification[] {
  const upcoming: Notification[] = events.flatMap((e): Notification[] => {
    const days = daysBetween(today, e.date);
    if (days < 0) return [];
    if (e.kind === "registration" && days <= 30) {
      const closes = e.id.endsWith("-close");
      return [
        {
          id: e.id,
          type: closes ? "Registration deadline" : "Registration opens",
          icon: BellRing,
          title: e.title,
          body: `${e.code ? `${e.code} · ` : ""}${fmt(e.date)}${days === 0 ? " (today)" : ` (in ${days} days)`}`,
          time: fmt(e.date),
          tone: closes ? "warning" : "primary",
          unread: true,
          target: "plan",
          href: e.href,
          linkKey: "registerOnLadok",
        },
      ];
    }
    if (e.kind === "course" && e.id.endsWith("-start") && days <= 14)
      return [
        {
          id: e.id,
          type: "Course starts",
          icon: CalendarClock,
          title: e.title,
          body: `${e.code} · ${fmt(e.date)}`,
          time: fmt(e.date),
          tone: "primary",
          unread: true,
          target: "plan",
        },
      ];
    return [];
  });

  const grades: Notification[] = courses
    .filter((c) => {
      const days = daysBetween(c.sortKey, today);
      return days >= 0 && days <= 30;
    })
    .reverse()
    .map((c) => ({
      id: `grade-${c.code}-${c.sortKey}`,
      type: "New grade",
      icon: Award,
      title: `${c.name}: ${c.grade}`,
      body: `${c.code} · ${c.credits} ECTS`,
      time: c.completed,
      tone: c.grade === "Fail" ? "destructive" : "success",
      unread: true,
      target: "progress",
    }));

  return [...upcoming, ...grades];
}
