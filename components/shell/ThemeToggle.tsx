"use client";

import { Monitor, Moon, Sun } from "lucide-react";
<<<<<<< HEAD
import { motion } from "motion/react";
import { useEffect, useId, useState, type MouseEvent } from "react";
import { cn } from "@/lib/cn";
import { applyTheme, readThemeMode, resolveDark, type ThemeMode } from "@/lib/theme";
import { Tip } from "@/components/ui/Menu";
=======
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { applyTheme, readThemeMode, resolveDark, type ThemeMode } from "@/lib/theme";
import { gsap, useGSAP } from "@/lib/motion/gsap";
>>>>>>> 939f032 (First Commit)

const MODES: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { mode: "light", label: "Clair", Icon: Sun },
  { mode: "dark", label: "Sombre", Icon: Moon },
  { mode: "system", label: "Système", Icon: Monitor },
];

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void> };
};

<<<<<<< HEAD
/** Change de thème avec une révélation circulaire depuis le bouton (View Transitions API). */
function switchTheme(mode: ThemeMode, event: MouseEvent) {
  const doc = document as ViewTransitionDocument;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const changesAppearance = resolveDark(mode) !== document.documentElement.classList.contains("dark");
=======
/** Bascule du thème avec une révélation circulaire partant du bouton cliqué. */
function switchWithReveal(mode: ThemeMode, event: MouseEvent<HTMLButtonElement>) {
  const doc = document as ViewTransitionDocument;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const changesAppearance = resolveDark(mode) !== document.documentElement.classList.contains("dark");

>>>>>>> 939f032 (First Commit)
  if (!doc.startViewTransition || reduce || !changesAppearance) {
    applyTheme(mode);
    return;
  }
<<<<<<< HEAD
  const x = event.clientX;
  const y = event.clientY;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const transition = doc.startViewTransition(() => applyTheme(mode));
  void transition.ready.then(() => {
=======

  const x = event.clientX;
  const y = event.clientY;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const transition = doc.startViewTransition(() => applyTheme(mode));
  transition.ready.then(() => {
>>>>>>> 939f032 (First Commit)
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 650, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" },
    );
  });
}

<<<<<<< HEAD
function useThemeMode(): [ThemeMode, (mode: ThemeMode, event: MouseEvent) => void] {
  const [mode, setMode] = useState<ThemeMode>("system");
  useEffect(() => {
    // Lu après hydratation : le script d'initialisation a déjà appliqué le thème avant le premier rendu.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(readThemeMode());
  }, []);
  return [
    mode,
    (next, event) => {
      setMode(next);
      switchTheme(next, event);
    },
  ];
}

/** Sélecteur de thème : trois pastilles (barre latérale dépliée) ou un bouton cyclique (repliée). */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useThemeMode();
  const layoutId = useId();

  if (compact) {
    const index = MODES.findIndex((m) => m.mode === mode);
    const current = MODES[index];
    const next = MODES[(index + 1) % MODES.length];
    return (
      <Tip content={`Thème : ${current.label}`} side="right">
        <button
          type="button"
          aria-label={`Thème ${current.label}, passer en ${next.label}`}
          onClick={(event) => setMode(next.mode, event)}
          className="grid size-10 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <current.Icon className="size-[18px]" aria-hidden />
        </button>
      </Tip>
    );
  }

  return (
    <div role="radiogroup" aria-label="Thème" className="flex items-center gap-1 rounded-full bg-accent/70 p-1">
      {MODES.map(({ mode: value, label, Icon }) => {
        const active = value === mode;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={(event) => setMode(value, event)}
            className={cn(
              "relative grid h-8 flex-1 place-items-center rounded-full transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-card shadow-[var(--card-shadow)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <Icon className="relative size-4" aria-hidden />
          </button>
        );
      })}
=======
export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const hydrated = useRef(false);

  // Le thème réel n'est connu qu'au client (script d'initialisation) : synchronisation après montage.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(readThemeMode());
  }, []);

  // En mode « Système », suivre les changements de l'OS en direct.
  useEffect(() => {
    if (mode !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [mode]);

  useGSAP(
    () => {
      const index = MODES.findIndex((m) => m.mode === mode);
      gsap.to(indicatorRef.current, {
        xPercent: index * 100,
        duration: hydrated.current ? 0.45 : 0,
        ease: "back.out(1.4)",
      });
      hydrated.current = true;
    },
    { dependencies: [mode], scope: groupRef },
  );

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label="Thème de l’interface"
      className="relative grid grid-cols-3 rounded-full border border-line bg-surface-2/70 p-0.5"
    >
      <span
        ref={indicatorRef}
        aria-hidden
        className="absolute top-0.5 bottom-0.5 left-0.5 w-[calc((100%-4px)/3)] rounded-full bg-panel shadow-[0_1px_3px_#0f2a1c26] ring-1 ring-line"
      />
      {MODES.map(({ mode: value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mode === value}
          aria-label={label}
          title={label}
          onClick={(event) => {
            setMode(value);
            switchWithReveal(value, event);
          }}
          className="relative z-10 grid size-7 place-items-center rounded-full text-muted transition-colors hover:text-text aria-checked:text-green-ink"
        >
          <Icon className="size-3.5" strokeWidth={2.2} />
        </button>
      ))}
>>>>>>> 939f032 (First Commit)
    </div>
  );
}
