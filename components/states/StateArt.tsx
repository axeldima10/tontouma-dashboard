"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { gsap, useGSAP, MEDIA } from "@/lib/motion/gsap";

const TONES = {
  green: { core: "bg-soft-green text-green-ink", ring: "border-green/25", dot: "bg-green" },
  danger: { core: "bg-danger-soft text-danger", ring: "border-danger/25", dot: "bg-danger" },
  warning: { core: "bg-warning-soft text-warning", ring: "border-warning/30", dot: "bg-warning" },
  neutral: { core: "bg-surface-3 text-muted", ring: "border-line-strong", dot: "bg-subtle" },
} as const;

export type StateTone = keyof typeof TONES;

/** Illustration vivante des états : icône au centre, anneaux qui respirent, satellite en orbite. */
export function StateArt({ icon, tone = "green" }: { icon: ReactNode; tone?: StateTone }) {
  const ref = useRef<HTMLDivElement>(null);
  const t = TONES[tone];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        gsap.from(".state-core", { scale: 0.5, autoAlpha: 0, duration: 0.8, ease: "back.out(1.8)" });
        gsap.from(".state-ring", { scale: 0.6, autoAlpha: 0, duration: 1.2, stagger: 0.12, ease: "tontouma" });
        gsap.to(".state-ring", {
          scale: 1.06,
          duration: 2.4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          stagger: 0.4,
          delay: 1,
        });
        gsap.to(".state-orbit", { rotation: 360, duration: 14, ease: "none", repeat: -1 });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} aria-hidden className="relative mx-auto grid size-36 place-items-center">
      <span className={cn("state-ring absolute inset-0 rounded-full border", t.ring)} />
      <span className={cn("state-ring absolute inset-5 rounded-full border border-dashed", t.ring)} />
      <span className="state-orbit absolute inset-0">
        <span className={cn("absolute top-[6px] left-1/2 size-2 -translate-x-1/2 rounded-full", t.dot)} />
      </span>
      <span className={cn("state-core grid size-16 place-items-center rounded-[20px] shadow-sm [&_svg]:size-7", t.core)}>
        {icon}
      </span>
    </div>
  );
}
