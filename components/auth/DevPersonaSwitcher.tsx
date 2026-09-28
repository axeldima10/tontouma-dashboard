"use client";

import { Check, ChevronUp, FlaskConical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { PERSONA_COOKIE, PERSONAS, type PersonaId } from "@/lib/auth/personas";
import { cn } from "@/lib/cn";
import { gsap, useGSAP, MEDIA } from "@/lib/motion/gsap";

function persistPersona(id: PersonaId) {
  document.cookie = `${PERSONA_COOKIE}=${id}; path=/; max-age=2592000; samesite=lax`;
}

/** Pastille « Mode développement » : change d'utilisateur fictif pour tester chaque rôle. */
export function DevPersonaSwitcher({ current }: { current: PersonaId }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  useGSAP(
    () => {
      if (!open) return;
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        gsap.from(menuRef.current, { y: 10, scale: 0.96, autoAlpha: 0, duration: 0.35, ease: "back.out(1.6)" });
      });
      return () => mm.revert();
    },
    { dependencies: [open], scope: rootRef },
  );

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (id: PersonaId) => {
    setOpen(false);
    if (id === current) return;
    persistPersona(id);
    const target = PERSONAS[id];
    startTransition(() => {
      // Changer de persona change aussi l'espace auquel on a droit.
      if (target.isPlatformAdmin && !window.location.pathname.startsWith("/admin")) router.push("/admin");
      else if (!target.isPlatformAdmin && window.location.pathname.startsWith("/admin")) router.push("/dashboard");
      else router.refresh();
    });
  };

  const persona = PERSONAS[current];

  return (
    <div ref={rootRef} className="fixed bottom-4 left-4 z-[70] md:bottom-5 md:left-5">
      {open && (
        <ul
          ref={menuRef}
          role="menu"
          aria-label="Utilisateur fictif"
          className="glass absolute bottom-full left-0 mb-2 w-72 rounded-2xl p-1.5"
        >
          {Object.values(PERSONAS).map((p) => (
            <li key={p.id} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={p.id === current}
                onClick={() => choose(p.id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-text">{p.name}</span>
                  <span className="block text-[11px] text-muted">{p.label}</span>
                </span>
                {p.id === current && <Check className="size-4 text-green-ink" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "glass flex h-9 items-center gap-2 rounded-full pr-3 pl-2 text-[12px] font-medium text-text",
          pending && "opacity-70",
        )}
      >
        <span className="grid size-6 place-items-center rounded-full bg-warning-soft text-warning">
          <FlaskConical className="size-3.5" aria-hidden />
        </span>
        <span className="hidden sm:inline">Mode développement ·</span>
        <span className="font-semibold">{persona.name}</span>
        <ChevronUp className={cn("size-3.5 text-muted transition-transform", !open && "rotate-180")} aria-hidden />
      </button>
    </div>
  );
}
