"use client";

import { X } from "lucide-react";
<<<<<<< HEAD
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
=======
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { gsap, EASE } from "@/lib/motion/gsap";

type DialogProps = {
  open: boolean;
  onClose: () => void;
>>>>>>> 939f032 (First Commit)
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
<<<<<<< HEAD
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
=======
  /** "center" pour une modale, "left" pour le tiroir de navigation mobile, "top" pour la palette. */
  placement?: "center" | "left" | "top";
  className?: string;
  hideTitle?: boolean;
};

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Modale native `<dialog>` : piège de focus, Échap et inertie du fond fournis par le navigateur.
 * GSAP anime l'entrée et la sortie (verre dépoli + fond flouté).
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  placement = "center",
  className,
  hideTitle,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!dialog || !panel || !backdrop) return;

    const from =
      placement === "left"
        ? { xPercent: -100, autoAlpha: 1 }
        : placement === "top"
          ? { y: -14, scale: 0.97, autoAlpha: 0 }
          : { y: 18, scale: 0.96, autoAlpha: 0 };

    if (open && !dialog.open) {
      dialog.showModal();
      if (reduceMotion()) {
        gsap.set([panel, backdrop], { clearProps: "all" });
        return;
      }
      gsap.fromTo(backdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power2.out" });
      gsap.fromTo(panel, from, {
        xPercent: 0,
        y: 0,
        scale: 1,
        autoAlpha: 1,
        duration: placement === "left" ? 0.55 : 0.5,
        ease: placement === "left" ? EASE.out : EASE.pop,
      });
    } else if (!open && dialog.open) {
      if (reduceMotion()) {
        dialog.close();
        return;
      }
      gsap.to(backdrop, { autoAlpha: 0, duration: 0.25 });
      gsap.to(panel, {
        ...from,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => dialog.close(),
      });
    }
  }, [open, placement]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-transparent p-0 backdrop:bg-transparent"
    >
      <div
        ref={backdropRef}
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 bg-[color-mix(in_srgb,var(--bg)_45%,#04110a_35%)] backdrop-blur-[6px]"
      />
      <div
        className={cn(
          "pointer-events-none fixed inset-0 flex p-4",
          placement === "center" && "items-center justify-center",
          placement === "top" && "items-start justify-center pt-[12vh]",
          placement === "left" && "items-stretch justify-start p-0",
        )}
      >
        <div
          ref={panelRef}
          role="document"
          className={cn(
            "glass pointer-events-auto flex max-h-full flex-col",
            placement === "left" ? "w-[min(86vw,320px)] rounded-r-[24px] border-l-0" : "w-full max-w-lg rounded-[22px]",
            className,
          )}
        >
          <header className={cn("flex items-start justify-between gap-4 px-6 pt-5", hideTitle && "sr-only")}>
            <div>
              <h2 id={titleId} className="font-display text-lg font-semibold text-text">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-sm text-muted">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="-mr-2 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-3 hover:text-text"
            >
              <X className="size-4" />
            </button>
          </header>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">{children}</div>}
          {footer && <footer className="flex flex-wrap justify-end gap-2 px-6 pb-5">{footer}</footer>}
        </div>
      </div>
    </dialog>
>>>>>>> 939f032 (First Commit)
  );
}
