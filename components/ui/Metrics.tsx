"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useId, type ReactNode } from "react";
import { CountUp } from "@/components/motion/Motion";
import { cn } from "@/lib/cn";

type KpiTileProps = {
  icon: ReactNode;
  label: string;
  value: number;
  hint?: ReactNode;
  href?: string;
  currency?: boolean;
  accent?: "brand" | "ink" | "warning" | "info";
  children?: ReactNode;
};

const ACCENTS = {
  brand: "bg-brand-soft text-brand-ink",
  ink: "bg-primary text-primary-foreground",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
};

/** Tuile de verre : icône dans une pastille, grand chiffre léger, libellé et détail. Soulevée au survol. */
export function KpiTile({ icon, label, value, hint, href, currency, accent = "ink", children }: KpiTileProps) {
  const body = (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="glass group relative h-full overflow-hidden rounded-[26px] p-5"
    >
      <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:animate-[shine_1.1s_ease] group-hover:opacity-100 dark:via-white/5" />
      <div className="flex items-start justify-between gap-3">
        <span className={cn("grid size-10 place-items-center rounded-2xl [&_svg]:size-[18px]", ACCENTS[accent])}>{icon}</span>
        {href && <span className="text-xs font-medium text-muted-foreground opacity-0 transition group-hover:opacity-100">Voir →</span>}
      </div>
      <p className="tabular mt-5 text-[34px] leading-none font-light tracking-[-0.03em] text-foreground">
        <CountUp value={value} currency={currency} />
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      {children && <div className="mt-4">{children}</div>}
    </motion.div>
  );
  return href ? (
    <Link href={href} className="block h-full rounded-[26px]">
      {body}
    </Link>
  ) : (
    body
  );
}

type RingProps = { value: number; max: number; size?: number; stroke?: number; children?: ReactNode; label: string };

/** Jauge circulaire (comme la grande jauge de la référence), animée au montage. */
export function ProgressRing({ value, max, size = 180, stroke = 12, children, label }: RingProps) {
  const gradientId = useId();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-foreground/[0.07]" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray="2 10"
          className="text-foreground/15"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - ratio) }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand)" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

type UsageMeterProps = { label: string; used: number; limit: number | null; icon?: ReactNode };

/** Consommation vs limite du plan : barre qui passe à l'ambre à 80 %, au rouge à la limite. */
export function UsageMeter({ label, used, limit, icon }: UsageMeterProps) {
  const ratio = limit ? Math.min(1, used / limit) : 0;
  const tone = !limit ? "bg-brand" : ratio >= 1 ? "bg-destructive" : ratio >= 0.8 ? "bg-[#f5a122]" : "bg-brand";
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-medium text-foreground [&_svg]:size-4 [&_svg]:text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="tabular text-muted-foreground">
          <b className="font-semibold text-foreground">{used}</b> / {limit ?? "∞"}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-foreground/[0.07]">
        <motion.div
          className={cn("h-full rounded-full", tone)}
          initial={{ width: 0 }}
          animate={{ width: limit ? `${Math.max(ratio * 100, used > 0 ? 3 : 0)}%` : "100%" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          style={{ opacity: limit ? 1 : 0.25 }}
        />
      </div>
      {limit !== null && used >= limit && <p className="mt-1.5 text-xs font-medium text-destructive">Limite du plan atteinte.</p>}
    </div>
  );
}

type SegmentBarProps = { segments: { value: number; className: string; label: string }[] };

/** Barre segmentée (répartition des bornes par statut). */
export function SegmentBar({ segments }: SegmentBarProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  return (
    <div>
      <div className="flex h-2 gap-1 overflow-hidden rounded-full">
        {total === 0 ? (
          <div className="hatch h-full flex-1 rounded-full" />
        ) : (
          segments
            .filter((s) => s.value > 0)
            .map((s, i) => (
              <motion.div
                key={s.label}
                className={cn("h-full rounded-full", s.className)}
                initial={{ flexGrow: 0 }}
                animate={{ flexGrow: s.value }}
                transition={{ duration: 0.9, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] }}
              />
            ))
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", s.className)} />
            {s.label} <b className="tabular font-semibold text-foreground">{s.value}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
