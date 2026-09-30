"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { MotionProvider } from "@/components/motion/Motion";
import { Sheet } from "@/components/ui/Dialog";
import { TooltipProvider } from "@/components/ui/Menu";
import { Toaster } from "@/components/ui/Toaster";
import { cn } from "@/lib/cn";
import { SIDEBAR_COOKIE, type ShellVariant } from "@/lib/nav";
import { CommandPalette } from "./CommandPalette";
import { DemoModeProvider } from "./DemoMode";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  variant: ShellVariant;
  basePath: string;
  isSuperAdmin: boolean;
  /** Lu côté serveur depuis le cookie : la largeur est juste dès le premier rendu (pas de saut). */
  initialCollapsed: boolean;
  /** Backend fictif actif (DATA_SOURCE=mock) : pastille « Données de démonstration ». */
  demo: boolean;
  children: ReactNode;
};

/**
 * Chrome commun des deux tableaux de bord :
 * - desktop / tablette : barre latérale en verre flottante, repliable (272 px ↔ rail de 84 px) ;
 * - mobile : tiroir.
 */
export function AppShell({ variant, basePath, isSuperAdmin, initialCollapsed, demo, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteMounted, setPaletteMounted] = useState(false);

  const toggle = useCallback(() => {
    setCollapsed((value) => {
      const next = !value;
      document.cookie = `${SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });
  }, []);

  const openPalette = useCallback(() => {
    setPaletteMounted(true);
    setPaletteOpen(true);
  }, []);

  // Sans choix enregistré, la tablette démarre en rail pour laisser la place au contenu.
  useEffect(() => {
    const chosen = document.cookie.split("; ").some((c) => c.startsWith(`${SIDEBAR_COOKIE}=`));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!chosen && window.matchMedia("(max-width: 1023px)").matches) setCollapsed(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === "k") {
        event.preventDefault();
        setPaletteMounted(true);
        setPaletteOpen((open) => !open);
      } else if (key === "b") {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  return (
    <DemoModeProvider demo={demo}>
    <MotionProvider>
      <TooltipProvider delayDuration={250}>
        <a
          href="#contenu"
          className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          Aller au contenu
        </a>

        <aside
          aria-label="Barre latérale"
          data-collapsed={collapsed}
          className={cn(
            "glass fixed inset-y-3 left-3 z-40 hidden overflow-hidden rounded-[28px] transition-[width] duration-500 ease-[var(--ease-out-expo)] md:block",
            collapsed ? "w-[84px]" : "w-[272px]",
          )}
        >
          <Sidebar variant={variant} basePath={basePath} isSuperAdmin={isSuperAdmin} collapsed={collapsed} onToggle={toggle} />
        </aside>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen} title="Menu">
          <Sidebar
            variant={variant}
            basePath={basePath}
            isSuperAdmin={isSuperAdmin}
            collapsed={false}
            onNavigate={() => setMenuOpen(false)}
          />
        </Sheet>

        <div
          className={cn(
            "min-h-dvh px-3 pb-10 transition-[padding] duration-500 ease-[var(--ease-out-expo)] sm:px-4",
            collapsed ? "md:pl-[108px]" : "md:pl-[296px]",
          )}
        >
          <div className="mx-auto max-w-[1440px]">
            <Topbar
              variant={variant}
              basePath={basePath}
              isSuperAdmin={isSuperAdmin}
              onOpenMenu={() => setMenuOpen(true)}
              onOpenPalette={openPalette}
            />
            <main id="contenu" tabIndex={-1} className="pt-7 outline-none sm:px-2 lg:px-4">
              {children}
            </main>
          </div>
        </div>

        {paletteMounted && (
          <CommandPalette
            open={paletteOpen}
            onOpenChange={setPaletteOpen}
            variant={variant}
            basePath={basePath}
            isSuperAdmin={isSuperAdmin}
          />
        )}
        <Toaster />
      </TooltipProvider>
    </MotionProvider>
    </DemoModeProvider>
  );
}
