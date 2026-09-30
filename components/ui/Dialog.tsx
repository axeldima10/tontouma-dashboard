"use client";

import { X } from "lucide-react";
import { Dialog as D } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const overlayClass = cn(
  "fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--bg-3)_45%,transparent)] backdrop-blur-[6px]",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
);

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  icon?: ReactNode;
  /** Empêche la fermeture par clic extérieur (formulaires en cours d'édition). */
  dismissible?: boolean;
};

const SIZES = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

/** Modale en verre : entrée en ressort (zoom + fondu), focus piégé, Échap pour fermer. */
export function Dialog({ open, onOpenChange, title, description, children, footer, size = "md", icon, dismissible = true }: DialogProps) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className={overlayClass} />
        <D.Content
          onInteractOutside={(event) => !dismissible && event.preventDefault()}
          className={cn(
            "glass-strong fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-[28px]",
            "duration-300 ease-[var(--ease-spring)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-4",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-150",
            SIZES[size],
          )}
        >
          <div className="flex items-start gap-4 px-6 pt-6 pb-4">
            {icon && (
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-card text-foreground shadow-[var(--card-shadow)] [&_svg]:size-5">
                {icon}
              </span>
            )}
            <div className="min-w-0 flex-1 pt-0.5">
              <D.Title className="text-lg leading-tight font-semibold tracking-tight text-foreground">{title}</D.Title>
              {description ? (
                <D.Description className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</D.Description>
              ) : (
                <D.Description className="sr-only">{typeof title === "string" ? title : "Boîte de dialogue"}</D.Description>
              )}
            </div>
            <D.Close className="-mt-1 -mr-2 grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground">
              <X className="size-4" aria-hidden />
              <span className="sr-only">Fermer</span>
            </D.Close>
          </div>
          {children && <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-6 pb-2">{children}</div>}
          {footer && <div className="flex flex-wrap items-center justify-end gap-2 px-6 pt-4 pb-6">{footer}</div>}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  side?: "left" | "right";
  children: ReactNode;
  className?: string;
};

/** Tiroir latéral en verre (menu mobile, panneaux de détail). */
export function Sheet({ open, onOpenChange, title, side = "left", children, className }: SheetProps) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className={overlayClass} />
        <D.Content
          className={cn(
            "glass-strong fixed inset-y-2 z-50 flex w-[min(320px,calc(100vw-1.5rem))] flex-col rounded-[28px] duration-300 ease-[var(--ease-out-expo)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200",
            side === "left"
              ? "left-2 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left"
              : "right-2 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
            className,
          )}
        >
          <D.Title className="sr-only">{title}</D.Title>
          <D.Description className="sr-only">{title}</D.Description>
          {children}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
