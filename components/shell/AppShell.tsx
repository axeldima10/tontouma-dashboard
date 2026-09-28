"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LazyClerkOrgSwitcher } from "@/components/auth/LazyClerk";
import { useSession } from "@/components/auth/SessionProvider";
import { Dialog } from "@/components/ui/Dialog";
import { ToastProvider } from "@/components/ui/Toast";
import type { ShellVariant } from "@/lib/nav";
import { Aurora } from "./Aurora";
import { CommandPalette } from "./CommandPalette";
import { SidebarContent } from "./SidebarContent";
import { Topbar } from "./Topbar";

type AppShellProps = {
  variant: ShellVariant;
  basePath: string;
  isSuperAdmin: boolean;
  children: ReactNode;
};

/**
 * Chrome commun des deux tableaux de bord :
 * - desktop : barre latérale en verre flottante,
 * - tablette : rail d'icônes,
 * - mobile : tiroir.
 */
export function AppShell({ variant, basePath, isSuperAdmin, children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Tiroir et palette montés à la première ouverture seulement (moins de rendu à chaque page).
  const [menuMounted, setMenuMounted] = useState(false);
  const [paletteMounted, setPaletteMounted] = useState(false);
  const openMenu = () => {
    setMenuMounted(true);
    setMenuOpen(true);
  };
  const togglePalette = () => {
    setPaletteMounted(true);
    setPaletteOpen((open) => !open);
  };
  const { session } = useSession();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteMounted(true);
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <ToastProvider>
      <a
        href="#contenu"
        className="sr-only z-50 rounded-xl bg-green px-4 py-2 text-sm font-semibold text-on-green focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Aller au contenu
      </a>
      <Aurora />

      <aside
        aria-label="Barre latérale"
        className="glass fixed inset-y-3 left-3 z-40 hidden w-[76px] flex-col rounded-[24px] px-2.5 py-5 md:flex lg:w-[264px] lg:px-4"
      >
        <SidebarContent variant={variant} basePath={basePath} isSuperAdmin={isSuperAdmin} responsiveRail />
      </aside>

      {menuMounted && (
        <Dialog
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          title="Menu"
          placement="left"
          hideTitle
          className="h-full px-2 py-5"
        >
          <div className="-mx-4 h-[calc(100dvh-60px)]">
            <SidebarContent
              variant={variant}
              basePath={basePath}
              isSuperAdmin={isSuperAdmin}
              onNavigate={() => setMenuOpen(false)}
            />
            {variant === "org" && session.mode === "clerk" && (
              <div className="mt-2 sm:hidden">
                <LazyClerkOrgSwitcher />
              </div>
            )}
          </div>
        </Dialog>
      )}

      {paletteMounted && (
        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          variant={variant}
          basePath={basePath}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      <div className="min-h-dvh pt-3 md:pl-[92px] lg:pl-[280px]">
        <Topbar
          variant={variant}
          basePath={basePath}
          onOpenMenu={openMenu}
          onOpenPalette={togglePalette}
        />
        <main id="contenu" tabIndex={-1} className="mx-auto w-full max-w-[1320px] px-4 pt-7 pb-16 outline-none sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
