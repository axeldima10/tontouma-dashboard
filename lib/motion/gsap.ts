"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";
import { Draggable } from "gsap/Draggable";
import { Flip } from "gsap/Flip";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, CustomEase, SplitText, Draggable, Flip);

/** Courbes de la marque : entrées franches, arrivées très douces. */
CustomEase.create("tontouma", "0.16, 1, 0.3, 1");
CustomEase.create("tontouma-inout", "0.65, 0, 0.35, 1");

export const EASE = {
  out: "tontouma",
  inOut: "tontouma-inout",
  pop: "back.out(1.6)",
  soft: "power2.out",
} as const;

export const DURATION = {
  fast: 0.28,
  base: 0.6,
  slow: 1.1,
} as const;

/** Conditions partagées pour gsap.matchMedia(). */
export const MEDIA = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  finePointer: "(pointer: fine) and (prefers-reduced-motion: no-preference)",
} as const;

gsap.defaults({ ease: EASE.out, duration: DURATION.base });

export { gsap, useGSAP, SplitText, Draggable, Flip };
