import { notifications, toneChip } from "@/data/example";
import { ProgressCopy } from "@/lib/copy";
import { StudentView } from "@/lib/student-view";
import { Check, ChevronRight, Copy, ExternalLink, UserRound } from "lucide-react";
import { useState } from "react";

export type IconComponent = typeof UserRound;

export function StatTile({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: IconComponent;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 font-display text-sm font-bold leading-none md:text-base">
        <Icon className="size-3 shrink-0 text-primary-foreground/60" aria-hidden="true" />
        <span className="min-w-0 truncate">
          {value}
          {unit && (
            <span className="ml-0.5 text-[10px] font-bold text-primary-foreground/70">{unit}</span>
          )}
        </span>
      </p>
      <p className="mt-1 line-clamp-2 text-[10px] font-semibold leading-3 text-primary-foreground/70">
        {label}
      </p>
    </div>
  );
}

export function GradeRow({
  grade,
  resultText,
}: {
  grade: StudentView["recentGrades"][number];
  resultText: string;
}) {
  const failed = grade.grade === "Fail";
  return (
    <li className="flex items-center gap-3 py-2 first:pt-1 last:pb-0">
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-lg font-display text-xs font-bold ${failed ? "bg-destructive/10 text-destructive" : "bg-success-soft text-success"}`}
      >
        {grade.grade}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold leading-5">{grade.name}</h3>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          <span className="truncate">{grade.code}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{resultText}</span>
        </p>
      </div>
      <p className="shrink-0 text-xs font-bold text-muted-foreground">{grade.credits}</p>
    </li>
  );
}

export const notificationRowClass =
  "flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left transition-colors first:pt-2 last:pb-0 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function NotificationRow({
  note,
  t,
  onOpen,
}: {
  note: (typeof notifications)[number];
  t: ProgressCopy;
  onOpen: () => void;
}) {
  const Icon = note.icon;
  const linkLabel = note.linkKey === "registerOnLadok" ? t.registerOnLadok : t.applyOnAdmissions;
  const content = (
    <>
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-lg ${toneChip[note.tone]}`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
            {note.type}
            {note.push && (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary">
                {t.pushChip}
              </span>
            )}
          </p>
          {note.unread && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}
        </div>
        <h3 className="mt-1 text-sm font-bold leading-5">{note.title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{note.body}</p>
        <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          {note.time}
          {!note.href && <ChevronRight className="size-3.5 text-primary" aria-hidden="true" />}
        </p>
        {note.href && (
          <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-primary">
            {linkLabel}
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </span>
        )}
      </div>
    </>
  );

  return (
    <li>
      {note.href ? (
        <a
          href={note.href}
          target="_blank"
          rel="noreferrer"
          onClick={onOpen}
          className={notificationRowClass}
        >
          {content}
        </a>
      ) : (
        <button type="button" onClick={onOpen} className={notificationRowClass}>
          {content}
        </button>
      )}
    </li>
  );
}

export function DetailRow({
  icon: Icon,
  label,
  value,
  chip,
}: {
  icon: IconComponent;
  label: string;
  value: string;
  chip?: string;
}) {
  return (
    <div className="grid grid-cols-[2rem_1fr] gap-3 py-2.5 first:pt-1 last:pb-0">
      <span className="grid size-8 place-items-center rounded-lg bg-secondary text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-bold leading-5 text-card-foreground">{value}</p>
        {chip && (
          <span className="mt-2 inline-flex rounded-md bg-primary-soft px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide text-primary">
            {chip}
          </span>
        )}
      </div>
    </div>
  );
}

export function CopyButton({
  value,
  label,
  tone,
  copyVerb = "Copy",
  copiedWord = "copied",
}: {
  value: string;
  label: string;
  tone: "secondary" | "card";
  copyVerb?: string;
  copiedWord?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copyValue}
      aria-label={copied ? `${label} ${copiedWord}` : `${copyVerb} ${label}`}
      className={`grid size-9 shrink-0 place-items-center rounded-lg transition-colors ${
        tone === "secondary"
          ? "bg-card text-muted-foreground hover:text-primary"
          : "border border-border text-muted-foreground hover:bg-secondary hover:text-primary"
      }`}
    >
      {copied ? (
        <Check className="size-4 text-success" strokeWidth={3} aria-hidden="true" />
      ) : (
        <Copy className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}

export function NavItem({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: IconComponent;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:bg-secondary hover:text-primary"
      }`}
    >
      <Icon className="size-5" aria-hidden="true" />
      <span className="text-[0.6875rem] font-bold">{label}</span>
    </button>
  );
}
