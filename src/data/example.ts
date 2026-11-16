import { IconComponent } from "@/components/dashboard/parts";
import { Award, BellRing, Clock, Globe, Newspaper } from "lucide-react";

export const nextDeadline = {
  title: "Study period 3 registration",
  course: "Research Methods",
  courseCode: "TTBEM01",
  date: "20 November 2026",
  iso: "2026-11-20T23:59:00",
};

export type Tone = "primary" | "success" | "warning" | "destructive";

export type NotificationTarget = "dashboard" | "progress" | "plan" | "news" | "profile";

export const notifications: Array<{
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
}> = [
  {
    type: "New grade",
    icon: Award,
    title: "New grade published",
    body: "Business Development — result: B. Well done!",
    time: "Today · 08:12",
    tone: "success",
    unread: true,
    target: "progress",
  },
  {
    type: "New grade",
    icon: Award,
    title: "New grade published",
    body: "Project Management — result: Fail. You can re-register for the re-exam.",
    time: "Yesterday · 16:40",
    tone: "destructive",
    unread: true,
    target: "progress",
  },
  {
    type: "KTH news",
    icon: Newspaper,
    title: "New story from KTH",
    body: "KTH rises in the latest global university ranking. Read the full story.",
    time: "Yesterday · 09:05",
    tone: "primary",
    unread: true,
    target: "news",
  },
  {
    type: "Approaching deadline",
    icon: Clock,
    title: "Deadline approaching",
    body: "Research Methods project proposal is due 20 November 2026.",
    time: "Monday · 10:22",
    tone: "warning",
    unread: false,
    target: "dashboard",
  },
  {
    type: "Application deadline",
    icon: Globe,
    title: "Apply for courses",
    body: "Course applications for spring 2027 close 20 January 2027 on universityadmissions.se.",
    time: "Today · 07:30",
    tone: "warning",
    unread: true,
    target: "plan",
    href: "https://www.universityadmissions.se/intl/start",
    linkKey: "applyOnAdmissions",
  },
  {
    type: "Registration deadline",
    icon: BellRing,
    title: "Register for courses in Ladok",
    body: "Push notification: registration for study period 3 closes 12 January 2027 in Ladok.",
    time: "Yesterday · 18:15",
    tone: "primary",
    unread: true,
    target: "plan",
    href: "https://ladok.se/",
    linkKey: "registerOnLadok",
    push: true,
  },
];

export const toneChip: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
};
