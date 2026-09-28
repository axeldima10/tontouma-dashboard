"use client";

import { useId, useRef } from "react";
import { cn } from "@/lib/cn";
import { gsap, useGSAP, MEDIA } from "@/lib/motion/gsap";

type ProgressBarProps = {
  /** Ratio entre 0 et 1. */
  value: number;
  label: string;
  tone?: "green" | "warning" | "danger";
  className?: string;
  delay?: number;
};

const FILLS = { green: "bg-green", warning: "bg-warning", danger: "bg-danger" } as const;

/** Barre qui se remplit (scaleX, pas de width animée). */
export function ProgressBar({ value, label, tone = "green", className, delay = 0.2 }: ProgressBarProps) {
  const fillRef = useRef<HTMLSpanElement>(null);
  const ratio = Math.max(0, Math.min(1, value));

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        gsap.fromTo(fillRef.current, { scaleX: 0 }, { scaleX: ratio, duration: 1.2, delay, ease: "tontouma" });
      });
      mm.add(MEDIA.reduce, () => {
        gsap.set(fillRef.current, { scaleX: ratio });
      });
      return () => mm.revert();
    },
    { dependencies: [ratio] },
  );

  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(ratio * 100)}
      className={cn("block h-2 overflow-hidden rounded-full bg-surface-3", className)}
    >
      <span
        ref={fillRef}
        className={cn("block h-full w-full origin-left rounded-full", FILLS[tone])}
        style={{ transform: `scaleX(${ratio})` }}
      />
    </span>
  );
}

type ProgressRingProps = {
  value: number;
  size?: number;
  stroke?: number;
  label: string;
  children?: React.ReactNode;
};

/** Anneau de progression SVG, tracé animé. */
export function ProgressRing({ value, size = 132, stroke = 10, label, children }: ProgressRingProps) {
  const arcRef = useRef<SVGCircleElement>(null);
  const gradientId = `ring-${useId().replace(/:/g, "")}`;
  const ratio = Math.max(0, Math.min(1, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        gsap.fromTo(
          arcRef.current,
          { strokeDashoffset: circumference },
          { strokeDashoffset: circumference * (1 - ratio), duration: 1.6, delay: 0.3, ease: "tontouma" },
        );
      });
      return () => mm.revert();
    },
    { dependencies: [ratio, circumference] },
  );

  return (
    <div
      role="img"
      aria-label={`${label} : ${Math.round(ratio * 100)} %`}
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--green)" />
            <stop offset="100%" stopColor="#35d07f" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle
          ref={arcRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
