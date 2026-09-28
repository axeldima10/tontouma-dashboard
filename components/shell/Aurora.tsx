"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/motion/gsap";

/**
 * Lumière verte ambiante derrière le verre.
 * Performance : dégradés radiaux déjà doux (aucun `filter: blur`), dérive lente uniquement sur
 * grand écran sans préférence de mouvement réduit ; le navigateur suspend l'animation onglet masqué.
 */
export function Aurora() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.to(".aurora-a", { xPercent: 12, yPercent: 8, duration: 30, ease: "sine.inOut", repeat: -1, yoyo: true });
        gsap.to(".aurora-b", { xPercent: -10, yPercent: 12, duration: 36, ease: "sine.inOut", repeat: -1, yoyo: true });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} data-aurora aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="aurora-a absolute -top-[25%] left-[5%] size-[60vmax] rounded-full bg-[radial-gradient(closest-side,var(--aurora-a),transparent_72%)]" />
      <div className="aurora-b absolute top-[25%] -right-[20%] size-[55vmax] rounded-full bg-[radial-gradient(closest-side,var(--aurora-b),transparent_72%)]" />
      <div className="absolute -bottom-[35%] left-[30%] size-[50vmax] rounded-full bg-[radial-gradient(closest-side,var(--aurora-c),transparent_72%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(color-mix(in_srgb,var(--text)_7%,transparent)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
    </div>
  );
}
