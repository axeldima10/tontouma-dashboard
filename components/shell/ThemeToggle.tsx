"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useId, useState, type MouseEvent } from "react";
import { cn } from "@/lib/cn";
import { applyTheme, readThemeMode, resolveDark, type ThemeMode } from "@/lib/theme";
import { Tip } from "@/components/ui/Menu";

const MODES: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { mode: "light", label: "Clair", Icon: Sun },
  { mode: "dark", label: "Sombre", Icon: Moon },
  { mode: "system", label: "Système", Icon: Monitor },
];

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void> };
};

/** Change de thème avec une révélation circulaire depuis le bouton (View Transitions API). */
function switchTheme(mode: ThemeMode, event: MouseEvent) {
  const doc = document as ViewTransitionDocument;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const changesAppearance = resolveDark(mode) !== document.documentElement.classList.contains("dark");
  if (!doc.startViewTransition || reduce || !changesAppearance) {
    applyTheme(mode);
    return;
  }
  const x = event.clientX;
  const y = event.clientY;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const transition = doc.startViewTransition(() => applyTheme(mode));
  void transition.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 650, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" },
    );
  });
}

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
    </div>
  );
}
