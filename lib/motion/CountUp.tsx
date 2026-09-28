"use client";

import { useRef } from "react";
import { gsap, useGSAP, MEDIA } from "./gsap";

const formatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

type CountUpProps = {
  value: number;
  className?: string;
  delay?: number;
  suffix?: string;
};

/** Compteur qui défile jusqu'à sa valeur. Le rendu serveur affiche déjà la valeur finale. */
export function CountUp({ value, className, delay = 0.15, suffix = "" }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        const counter = { v: 0 };
        el.textContent = `${formatter.format(0)}${suffix}`;
        gsap.to(counter, {
          v: value,
          duration: Math.min(1.8, 0.9 + value / 4000),
          delay,
          ease: "power3.out",
          onUpdate: () => {
            el.textContent = `${formatter.format(Math.round(counter.v))}${suffix}`;
          },
        });
      });
      return () => mm.revert();
    },
    { dependencies: [value], scope: ref },
  );

  return (
    <span ref={ref} className={className}>
      {formatter.format(value)}
      {suffix}
    </span>
  );
}
