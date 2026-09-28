"use client";

<<<<<<< HEAD
import { ChevronRight, FlaskConical, Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LazyClerkUserButton } from "@/components/auth/LazyClerk";
import { useSession } from "@/components/auth/SessionProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Tip } from "@/components/ui/Menu";
import { useDemoMode } from "./DemoMode";
import { activeSegment, hrefFor, navFor, type ShellVariant } from "@/lib/nav";
=======
import { Menu, Search, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { LazyClerkOrgSwitcher } from "@/components/auth/LazyClerk";
import { useSession } from "@/components/auth/SessionProvider";
import { findNavItem, type ShellVariant } from "@/lib/nav";
import { ThemeToggle } from "./ThemeToggle";
>>>>>>> 939f032 (First Commit)

type TopbarProps = {
  variant: ShellVariant;
  basePath: string;
<<<<<<< HEAD
  isSuperAdmin: boolean;
=======
>>>>>>> 939f032 (First Commit)
  onOpenMenu: () => void;
  onOpenPalette: () => void;
};

<<<<<<< HEAD
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
=======
export function Topbar({ variant, basePath, onOpenMenu, onOpenPalette }: TopbarProps) {
  const pathname = usePathname();
  const segment = pathname.slice(basePath.length).replace(/^\//, "").split("/")[0] ?? "";
  const current = findNavItem(variant, segment);
  const { session } = useSession();

  return (
    <header className="glass sticky top-3 z-30 mx-3 flex h-14 items-center gap-2 rounded-2xl px-2 sm:gap-3 sm:px-3 md:ml-0">
>>>>>>> 939f032 (First Commit)
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Ouvrir le menu"
<<<<<<< HEAD
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
=======
        className="grid size-10 place-items-center rounded-xl text-text hover:bg-surface-3 md:hidden"
      >
        <Menu className="size-5" />
      </button>

      <div className="min-w-0 flex-1 pl-1">
        <p className="truncate text-[11px] font-medium text-subtle">
          {variant === "admin" ? "Administration" : "Organisation"}
        </p>
        <p className="font-display truncate text-sm font-semibold text-text">{current?.label ?? "Tableau de bord"}</p>
      </div>
>>>>>>> 939f032 (First Commit)

      <button
        type="button"
        onClick={onOpenPalette}
<<<<<<< HEAD
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
=======
        className="hidden h-9 items-center gap-2 rounded-xl border border-line bg-panel/60 px-3 text-[13px] text-muted transition-colors hover:border-green/40 hover:text-text sm:flex"
      >
        <Search className="size-3.5" aria-hidden />
        <span>Aller à…</span>
        <kbd className="ml-3 rounded-md border border-line bg-surface-2 px-1.5 text-[10px] font-semibold">Ctrl K</kbd>
      </button>
      <button
        type="button"
        onClick={onOpenPalette}
        aria-label="Rechercher une page"
        className="grid size-10 place-items-center rounded-xl text-muted hover:bg-surface-3 hover:text-text sm:hidden"
      >
        <Search className="size-4" />
      </button>

      <ThemeToggle />

      {variant === "org" ? (
        session.mode === "clerk" && (
          <div className="hidden sm:block">
            <LazyClerkOrgSwitcher />
          </div>
        )
      ) : (
        <span className="hidden items-center gap-1.5 rounded-full bg-soft-green px-3 py-1 text-xs font-semibold text-green-ink ring-1 ring-green/20 sm:inline-flex">
          <ShieldCheck className="size-3.5" aria-hidden />
          Équipe Tontouma
        </span>
      )}
>>>>>>> 939f032 (First Commit)
    </header>
  );
}
