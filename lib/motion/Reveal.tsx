"use client";

import { useRef, type ElementType, type ComponentPropsWithoutRef } from "react";
import { gsap, useGSAP, EASE, MEDIA } from "./gsap";

type RevealProps<T extends ElementType> = {
  as?: T;
  /** Décalage entre deux enfants, en secondes. */
  stagger?: number;
  delay?: number;
  /** Distance de montée, en px. */
  y?: number;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

/**
 * Fait apparaître les enfants directs en cascade (montée + fondu).
 * Côté serveur les enfants sont masqués via `html.js [data-reveal-root]` pour éviter tout flash,
 * puis `data-revealed` les libère — les enfants ajoutés plus tard restent visibles.
 */
export function Reveal<T extends ElementType = "div">({
  as,
  stagger = 0.07,
  delay = 0,
  y = 18,
  children,
  ...rest
}: RevealProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const items = Array.from(root.children);
      const mm = gsap.matchMedia();

      mm.add(MEDIA.motion, () => {
        gsap.set(items, { autoAlpha: 0, y, scale: 0.985 });
        root.setAttribute("data-revealed", "");
        gsap.to(items, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: EASE.out,
          stagger,
          delay,
          clearProps: "transform,visibility",
        });
      });

      mm.add(MEDIA.reduce, () => {
        root.setAttribute("data-revealed", "");
        gsap.fromTo(items, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, clearProps: "visibility" });
      });

      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} data-reveal-root="" {...rest}>
      {children}
    </Tag>
  );
}
