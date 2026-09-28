"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CountUp } from "@/lib/motion/CountUp";
import { useSpotlightTilt } from "@/lib/motion/usePointerEffects";
import type { Tone } from "./StatusPill";

const ICON_TONES: Record<Tone, string> = {
  success: "bg-soft-green text-green-ink",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-surface-3 text-muted",
  info: "bg-info-soft text-info",
  violet: "bg-violet-soft text-violet",
};

type KpiTileProps = {
  label: string;
  value: number;
  icon: ReactNode;
  tone?: Tone;
  /** Ligne de contexte sous le libellé (« +3 ce mois »). */
  hint?: ReactNode;
  /** Suffixe collé à la valeur (« / 5 »). */
  suffix?: string;
  href?: string;
  className?: string;
};

export function KpiTile({ label, value, icon, tone = "success", hint, suffix, href, className }: KpiTileProps) {
  const ref = useSpotlightTilt<HTMLDivElement>(2.5);
  const body = (
    <>
      <span className={cn("grid size-9 place-items-center rounded-[11px] [&_svg]:size-[18px]", ICON_TONES[tone])}>
        {icon}
      </span>
      <p className="font-display tabular mt-4 text-[28px] leading-none font-semibold text-text">
        <CountUp value={value} />
        {suffix && <span className="ml-1 text-base font-medium text-subtle">{suffix}</span>}
      </p>
      <p className="mt-2 text-[13px] font-medium text-text">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </>
  );

  return (
    <div
      ref={ref}
      className={cn(
        "surface spotlight group relative min-w-0 p-4 transition-[border-color] duration-300 will-change-transform hover:border-green/40",
        className,
      )}
    >
      {href ? (
        <Link href={href} className="block rounded-[inherit] after:absolute after:inset-0 after:content-['']">
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  );
}
