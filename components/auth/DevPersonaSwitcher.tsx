"use client";

import { Check, FlaskConical } from "lucide-react";
import { DropdownMenu as M } from "radix-ui";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { PERSONA_COOKIE, PERSONAS, type PersonaId } from "@/lib/auth/personas";
import { cn } from "@/lib/cn";

function persistPersona(id: PersonaId) {
  document.cookie = `${PERSONA_COOKIE}=${id}; path=/; max-age=2592000; samesite=lax`;
}

/** Pastille « Mode développement » (AUTH_MODE=dev) : change d'utilisateur fictif pour tester chaque rôle. */
export function DevPersonaSwitcher({ current }: { current: PersonaId }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const choose = (id: PersonaId) => {
    if (id === current) return;
    persistPersona(id);
    const target = PERSONAS[id];
    startTransition(() => {
      // Changer de persona change aussi l'espace auquel on a droit.
      const inAdmin = window.location.pathname.startsWith("/admin");
      if (target.isPlatformAdmin && !inAdmin) router.push("/admin");
      else if (!target.isPlatformAdmin && inAdmin) router.push("/dashboard");
      else router.refresh();
    });
  };

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
    </div>
  );
}
