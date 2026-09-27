"use client";

import { ChevronRight, FlaskConical, Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LazyClerkUserButton } from "@/components/auth/LazyClerk";
import { useSession } from "@/components/auth/SessionProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Tip } from "@/components/ui/Menu";
import { useDemoMode } from "./DemoMode";
import { activeSegment, hrefFor, navFor, type ShellVariant } from "@/lib/nav";

type TopbarProps = {
  variant: ShellVariant;
  basePath: string;
  isSuperAdmin: boolean;
  onOpenMenu: () => void;
  onOpenPalette: () => void;
};

const DEEP_LABELS: Record<string, string> = {
  demarches: "Démarche",
  nouvelle: "Nouvelle",
  nouveau: "Nouveau",
};

/** Barre supérieure flottante en verre : fil d'Ariane, recherche ⌘K, compte (mobile). */
export function Topbar({ variant, basePath, isSuperAdmin, onOpenMenu, onOpenPalette }: TopbarProps) {
  const pathname = usePathname();
  const { session } = useSession();
  const demo = useDemoMode();
  const items = navFor(variant, isSuperAdmin);
  const segment = activeSegment(items, basePath, pathname);
  const current = items.find((item) => item.segment === segment);
  const depth = pathname.slice(basePath.length).split("/").filter(Boolean);
  const deepLabel = depth.length > 1 ? (DEEP_LABELS[depth.at(-1) ?? ""] ?? DEEP_LABELS[depth.at(-2) ?? ""] ?? "Détail") : null;

  return (
    <header className="glass sticky top-3 z-30 flex h-16 items-center gap-3 rounded-[24px] px-3 sm:px-4">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Ouvrir le menu"
        className="grid size-10 place-items-center rounded-full text-foreground transition hover:bg-accent md:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <nav aria-label="Fil d’Ariane" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1.5 text-sm">
          <li className="hidden shrink-0 text-muted-foreground sm:block">{variant === "admin" ? "Administration" : "Organisation"}</li>
          <li aria-hidden className="hidden text-subtle sm:block">
            <ChevronRight className="size-3.5" />
          </li>
          <li className="min-w-0 truncate">
            {deepLabel ? (
              <Link href={hrefFor(basePath, segment)} className="text-muted-foreground transition hover:text-foreground">
                {current?.label}
              </Link>
            ) : (
              <span className="font-semibold text-foreground" aria-current="page">
                {current?.label}
              </span>
            )}
          </li>
          {deepLabel && (
            <>
              <li aria-hidden className="text-subtle">
                <ChevronRight className="size-3.5" />
              </li>
              <li className="truncate font-semibold text-foreground" aria-current="page">
                {deepLabel}
              </li>
            </>
          )}
        </ol>
      </nav>

      {demo && (
        <Tip content="Backend fictif (DATA_SOURCE=mock) : rien n’est enregistré sur le vrai serveur.">
          <span className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-warning-soft px-3 text-xs font-semibold text-warning">
            <FlaskConical className="size-3.5" aria-hidden />
            <span className="max-sm:hidden">Données de démonstration</span>
          </span>
        </Tip>
      )}

      <button
        type="button"
        onClick={onOpenPalette}
        className="flex h-10 items-center gap-2.5 rounded-full border border-[var(--glass-border)] bg-secondary pr-2 pl-3.5 text-sm text-muted-foreground shadow-[inset_0_1px_0_var(--glass-highlight)] transition hover:bg-card hover:text-foreground sm:w-72"
        aria-label="Recherche rapide (Ctrl+K)"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="hidden flex-1 text-left sm:block">Rechercher…</span>
        <kbd className="hidden rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium sm:block">Ctrl K</kbd>
      </button>

      <div className="md:hidden">
        {session.mode === "clerk" ? <LazyClerkUserButton /> : <Avatar name={session.name} size={36} />}
      </div>
    </header>
  );
}
