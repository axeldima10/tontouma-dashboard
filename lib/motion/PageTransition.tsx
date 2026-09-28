"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, MEDIA } from "./gsap";

/** Le premier rendu vient du serveur : on ne l'anime pas (pas de flash), seulement les navigations. */
let isFirstPaint = true;

/** Utilisé dans les `template.tsx` : chaque navigation remonte le contenu avec un fondu court. */
export function PageTransition({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (isFirstPaint) {
        isFirstPaint = false;
        return;
      }
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        gsap.fromTo(
          ref.current,
          { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: 0.45, clearProps: "all" },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="min-w-0">
      {children}
    </div>
  );
}
