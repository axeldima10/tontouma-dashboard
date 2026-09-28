"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { gsap, EASE } from "@/lib/motion/gsap";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
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
  );
}
