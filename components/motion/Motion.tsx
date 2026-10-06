"use client";

import { animate, MotionConfig, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Respecte « réduire les animations » du système pour toutes les animations `motion`. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/*
 * Entrées en CSS (tw-animate-css) : le contenu rendu par le serveur est visible sans attendre le JavaScript,
 * et l'animation ne dépend pas de l'hydratation.
 */
const ENTER = "animate-in fade-in duration-300 ease-[var(--ease-out-expo)]";

/** Entrée de page : léger glissement vers le haut + fondu. */
export function PageTransition({ children }: { children: ReactNode }) {
  return <div className={cn(ENTER, "slide-in-from-bottom-3")}>{children}</div>;
}

/** Conteneur qui révèle ses enfants `StaggerItem` l'un après l'autre (délais dans globals.css). */
export function Stagger({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("stagger", className)} {...props} />;
}

export function StaggerItem({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(ENTER, "slide-in-from-bottom-4 fill-mode-backwards", className)} {...props} />;
}

type CountUpProps = { value: number; /** Montant en FCFA (XOF, sans décimales). */ currency?: boolean; className?: string };

const integer = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const xof = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 });
const formatInteger = (value: number) => integer.format(value);
const formatXof = (value: number) => xof.format(value);

/** Nombre qui s'anime jusqu'à sa valeur lorsqu'il devient visible. */
export function CountUp({ value, currency, className }: CountUpProps) {
  const format = currency ? formatXof : formatInteger;
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduced || !inView) {
      node.textContent = format(value);
      return;
    }
    const controls = animate(0, value, {
      duration: Math.min(1.4, 0.6 + value / 4000),
      ease: EASE,
      onUpdate: (latest) => (node.textContent = format(Math.round(latest))),
    });
    return () => controls.stop();
  }, [value, inView, reduced, format]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
