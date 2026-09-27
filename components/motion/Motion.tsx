"use client";

import { animate, motion, MotionConfig, useInView, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

/** Respecte « réduire les animations » du système pour toutes les animations `motion`. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/** Entrée de page : léger glissement vers le haut + fondu (ressort doux). */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}>
      {children}
    </motion.div>
  );
}

type StaggerProps = HTMLMotionProps<"div"> & { delay?: number; gap?: number };

/** Conteneur qui révèle ses enfants `StaggerItem` l'un après l'autre. */
export function Stagger({ children, delay = 0.05, gap = 0.06, ...props }: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16, scale: 0.985 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: EASE } },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
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
