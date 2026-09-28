"use client";

import { Menu, Search, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { LazyClerkOrgSwitcher } from "@/components/auth/LazyClerk";
import { useSession } from "@/components/auth/SessionProvider";
import { findNavItem, type ShellVariant } from "@/lib/nav";
import { ThemeToggle } from "./ThemeToggle";

type TopbarProps = {
  variant: ShellVariant;
  basePath: string;
  onOpenMenu: () => void;
  onOpenPalette: () => void;
};

export function Topbar({ variant, basePath, onOpenMenu, onOpenPalette }: TopbarProps) {
  const pathname = usePathname();
  const segment = pathname.slice(basePath.length).replace(/^\//, "").split("/")[0] ?? "";
  const current = findNavItem(variant, segment);
  const { session } = useSession();

  return (
    <header className="glass sticky top-3 z-30 mx-3 flex h-14 items-center gap-2 rounded-2xl px-2 sm:gap-3 sm:px-3 md:ml-0">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Ouvrir le menu"
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

      <button
        type="button"
        onClick={onOpenPalette}
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
    </header>
  );
}
