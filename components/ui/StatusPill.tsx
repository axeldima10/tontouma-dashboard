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
      </span>
      {children}
    </span>
  );
}
