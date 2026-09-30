"use client";

import { AlertTriangle, Eye, Trash2 } from "lucide-react";
import { AlertDialog as A } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

type Tone = "publish" | "danger" | "neutral";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  tone?: Tone;
  loading?: boolean;
  children?: ReactNode;
};

const ICONS: Record<Tone, ReactNode> = {
  publish: <Eye />,
  danger: <Trash2 />,
  neutral: <AlertTriangle />,
};

const ICON_TONE: Record<Tone, string> = {
  publish: "bg-brand-soft text-brand-ink",
  danger: "bg-destructive-soft text-destructive",
  neutral: "bg-warning-soft text-warning",
};

/** Confirmation explicite (publier, dépublier, supprimer, suspendre). Reste ouverte pendant l'action. */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, onConfirm, tone = "neutral", loading, children }: ConfirmDialogProps) {
  return (
    <A.Root open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <A.Portal>
        <A.Overlay className="fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--bg-3)_45%,transparent)] backdrop-blur-[6px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <A.Content
          className={cn(
            "glass-strong fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[28px] p-6",
            "duration-300 ease-[var(--ease-spring)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-150",
          )}
        >
          <span className={cn("grid size-12 place-items-center rounded-2xl [&_svg]:size-5", ICON_TONE[tone])}>{ICONS[tone]}</span>
          <A.Title className="mt-4 text-lg font-semibold tracking-tight text-foreground">{title}</A.Title>
          <A.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</A.Description>
          {children && <div className="mt-4">{children}</div>}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <A.Cancel asChild>
              <Button variant="secondary" disabled={loading}>
                Annuler
              </Button>
            </A.Cancel>
            <Button
              variant={tone === "danger" ? "destructive" : tone === "publish" ? "brand" : "primary"}
              loading={loading}
              onClick={(event) => {
                event.preventDefault();
                onConfirm();
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </A.Content>
      </A.Portal>
    </A.Root>
  );
}
