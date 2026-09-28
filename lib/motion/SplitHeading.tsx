"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, SplitText, EASE, MEDIA } from "./gsap";

type SplitHeadingProps = {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2";
  delay?: number;
};

/** Titre révélé mot à mot derrière un masque — le moment « bonjour » des tableaux de bord. */
export function SplitHeading({ children, className, as: Tag = "h1", delay = 0.05 }: SplitHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        const split = SplitText.create(el, { type: "words", mask: "words", aria: "auto" });
        gsap.from(split.words, {
          yPercent: 110,
          rotate: 4,
          duration: 1,
          ease: EASE.out,
          stagger: 0.06,
          delay,
        });
        return () => split.revert();
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
