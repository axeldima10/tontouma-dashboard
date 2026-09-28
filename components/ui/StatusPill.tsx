<<<<<<< HEAD
import type { ReactNode } from "react";
import type { BorneStatus } from "@/lib/api/contract";
import { cn } from "@/lib/cn";

export type Tone = "success" | "warning" | "danger" | "neutral" | "info";

const TONES: Record<Tone, { pill: string; dot: string }> = {
  success: { pill: "bg-brand-soft text-brand-ink", dot: "bg-brand" },
  warning: { pill: "bg-warning-soft text-warning", dot: "bg-[#f5a122]" },
  danger: { pill: "bg-destructive-soft text-destructive", dot: "bg-destructive" },
  info: { pill: "bg-info-soft text-info", dot: "bg-info" },
  neutral: { pill: "bg-accent text-muted-foreground", dot: "bg-subtle" },
};

type StatusPillProps = { tone: Tone; children: ReactNode; pulse?: boolean; className?: string };

/** Pastille de statut : point coloré + libellé (jamais la couleur seule). */
export function StatusPill({ tone, children, pulse, className }: StatusPillProps) {
  const t = TONES[tone];
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap", t.pill, className)}>
      <span className="relative flex size-1.5">
        {pulse && <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", t.dot)} />}
        <span className={cn("relative inline-flex size-1.5 rounded-full", t.dot)} />
=======
import { cn } from "@/lib/cn";

export type Tone = "success" | "warning" | "danger" | "neutral" | "info" | "violet";

const TONES: Record<Tone, string> = {
  success: "bg-soft-green text-green-ink ring-green/25",
  warning: "bg-warning-soft text-warning ring-warning/25",
  danger: "bg-danger-soft text-danger ring-danger/25",
  neutral: "bg-surface-3 text-muted ring-line-strong",
  info: "bg-info-soft text-info ring-info/25",
  violet: "bg-violet-soft text-violet ring-violet/25",
};

const DOTS: Record<Tone, string> = {
  success: "bg-green",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-subtle",
  info: "bg-info",
  violet: "bg-violet",
};

type StatusPillProps = {
  tone: Tone;
  children: React.ReactNode;
  /** Point qui respire — pour signaler un état vivant (en cours, en ligne). */
  pulse?: boolean;
  className?: string;
};

export function StatusPill({ tone, children, pulse, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      <span className="relative flex size-1.5" aria-hidden>
        {pulse && <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", DOTS[tone])} />}
        <span className={cn("relative size-1.5 rounded-full", DOTS[tone])} />
>>>>>>> 939f032 (First Commit)
      </span>
      {children}
    </span>
  );
}
<<<<<<< HEAD

/** Publié / Brouillon : ce que voient (ou non) les citoyens. */
export function PublicationPill({ active, className }: { active: boolean; className?: string }) {
  return (
    <StatusPill tone={active ? "success" : "warning"} className={className}>
      {active ? "Publié" : "Brouillon"}
    </StatusPill>
  );
}

export function ActivePill({ active, on = "Actif", off = "Inactif" }: { active: boolean; on?: string; off?: string }) {
  return <StatusPill tone={active ? "success" : "neutral"}>{active ? on : off}</StatusPill>;
}

export const BORNE_STATUS_LABEL: Record<BorneStatus, string> = {
  ACTIVE: "En service",
  MAINTENANCE: "Maintenance",
  HORS_SERVICE: "Hors service",
};

const BORNE_TONE: Record<BorneStatus, Tone> = { ACTIVE: "success", MAINTENANCE: "warning", HORS_SERVICE: "danger" };

export function BornePill({ status }: { status: BorneStatus }) {
  return (
    <StatusPill tone={BORNE_TONE[status]} pulse={status === "ACTIVE"}>
      {BORNE_STATUS_LABEL[status]}
    </StatusPill>
  );
}

/** Petit compteur (badges de navigation, onglets). */
export function CountBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("tabular inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground", className)}>
      {children}
    </span>
  );
}
=======
>>>>>>> 939f032 (First Commit)
