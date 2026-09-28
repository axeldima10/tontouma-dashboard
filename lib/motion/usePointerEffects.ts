"use client";

import { useRef, type RefObject } from "react";
import { gsap, useGSAP, MEDIA } from "./gsap";

/**
 * Lueur qui suit le pointeur + légère inclinaison 3D sur une tuile.
 * Actif uniquement avec un pointeur fin et sans préférence de mouvement réduit.
 */
export function useSpotlightTilt<T extends HTMLElement>(maxTilt = 3): RefObject<T | null> {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MEDIA.finePointer, () => {
        gsap.set(el, { transformPerspective: 900 });
        const rotX = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3" });
        const rotY = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3" });

        const onMove = (event: PointerEvent) => {
          const rect = el.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width;
          const py = (event.clientY - rect.top) / rect.height;
          el.style.setProperty("--mx", `${px * 100}%`);
          el.style.setProperty("--my", `${py * 100}%`);
          rotY((px - 0.5) * maxTilt * 2);
          rotX((0.5 - py) * maxTilt * 2);
        };
        const onEnter = () => el.style.setProperty("--spot-o", "1");
        const onLeave = () => {
          el.style.setProperty("--spot-o", "0");
          rotX(0);
          rotY(0);
        };

        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerenter", onEnter);
        el.addEventListener("pointerleave", onLeave);
        return () => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerenter", onEnter);
          el.removeEventListener("pointerleave", onLeave);
        };
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return ref;
}

/** Attraction magnétique subtile vers le pointeur (boutons principaux). */
export function useMagnetic<T extends HTMLElement>(strength = 0.25): RefObject<T | null> {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MEDIA.finePointer, () => {
        const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
        const onMove = (event: PointerEvent) => {
          const rect = el.getBoundingClientRect();
          xTo((event.clientX - (rect.left + rect.width / 2)) * strength);
          yTo((event.clientY - (rect.top + rect.height / 2)) * strength);
        };
        const onLeave = () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.45)" });
        };
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);
        return () => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
        };
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return ref;
}
