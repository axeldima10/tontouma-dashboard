"use client";

<<<<<<< HEAD
import { Check, FlaskConical } from "lucide-react";
import { DropdownMenu as M } from "radix-ui";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { PERSONA_COOKIE, PERSONAS, type PersonaId } from "@/lib/auth/personas";
import { cn } from "@/lib/cn";
=======
import { Check, ChevronUp, FlaskConical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { PERSONA_COOKIE, PERSONAS, type PersonaId } from "@/lib/auth/personas";
import { cn } from "@/lib/cn";
import { gsap, useGSAP, MEDIA } from "@/lib/motion/gsap";
>>>>>>> 939f032 (First Commit)

function persistPersona(id: PersonaId) {
  document.cookie = `${PERSONA_COOKIE}=${id}; path=/; max-age=2592000; samesite=lax`;
}

<<<<<<< HEAD
/** Pastille « Mode développement » (AUTH_MODE=dev) : change d'utilisateur fictif pour tester chaque rôle. */
export function DevPersonaSwitcher({ current }: { current: PersonaId }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const choose = (id: PersonaId) => {
=======
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
>>>>>>> 939f032 (First Commit)
    if (id === current) return;
    persistPersona(id);
    const target = PERSONAS[id];
    startTransition(() => {
      // Changer de persona change aussi l'espace auquel on a droit.
<<<<<<< HEAD
      const inAdmin = window.location.pathname.startsWith("/admin");
      if (target.isPlatformAdmin && !inAdmin) router.push("/admin");
      else if (!target.isPlatformAdmin && inAdmin) router.push("/dashboard");
=======
      if (target.isPlatformAdmin && !window.location.pathname.startsWith("/admin")) router.push("/admin");
      else if (!target.isPlatformAdmin && window.location.pathname.startsWith("/admin")) router.push("/dashboard");
>>>>>>> 939f032 (First Commit)
      else router.refresh();
    });
  };

<<<<<<< HEAD
  return (
    <div className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 print:hidden">
      <M.Root>
        <M.Trigger
          className={cn(
            "glass-strong flex h-9 items-center gap-2 rounded-full pr-3.5 pl-2 text-xs font-semibold text-foreground transition hover:scale-[1.02]",
            pending && "opacity-70",
          )}
        >
          <span className="grid size-6 place-items-center rounded-full bg-warning-soft text-warning">
            <FlaskConical className="size-3.5" aria-hidden />
          </span>
          Mode dev · {PERSONAS[current].label}
        </M.Trigger>
        <M.Portal>
          <M.Content
            side="top"
            align="end"
            sideOffset={8}
            className="glass-strong z-[60] w-64 rounded-2xl p-1.5 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          >
            <M.Label className="px-3 pt-1.5 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Utilisateur fictif</M.Label>
            {Object.values(PERSONAS).map((persona) => (
              <M.Item
                key={persona.id}
                onSelect={() => choose(persona.id)}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm outline-none data-[highlighted]:bg-accent"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{persona.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{persona.name}</p>
                </div>
                {persona.id === current && <Check className="size-4 text-brand-ink" aria-hidden />}
              </M.Item>
            ))}
          </M.Content>
        </M.Portal>
      </M.Root>
=======
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
>>>>>>> 939f032 (First Commit)
    </div>
  );
}
