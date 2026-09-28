"use client";

import { useRef } from "react";
import { BotMark } from "@/components/shell/BotMark";
import { gsap, useGSAP, MEDIA } from "@/lib/motion/gsap";
import { SplitHeading } from "@/lib/motion/SplitHeading";

type GreetingProps = {
  kicker: string;
  title: string;
  subtitle: string;
};

/** Moment d'accueil : date, salutation révélée mot à mot, mascotte vivante. */
export function Greeting({ kicker, title, subtitle }: GreetingProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        gsap.from(".greet-fade", { y: 10, autoAlpha: 0, duration: 0.8, stagger: 0.15, delay: 0.1 });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <header ref={ref} className="mb-8 flex items-center justify-between gap-6">
      <div className="min-w-0">
        <p className="greet-fade kicker">{kicker}</p>
        <SplitHeading className="font-display mt-2 text-[28px] leading-tight font-semibold text-text sm:text-[34px]">
          {title}
        </SplitHeading>
        <p className="greet-fade mt-1.5 text-sm text-muted sm:text-[15px]">{subtitle}</p>
      </div>
      <BotMark size={64} alive className="hidden sm:grid" />
    </header>
  );
}
