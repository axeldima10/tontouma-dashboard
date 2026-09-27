"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type ControlProps = { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string; required?: boolean };

type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  /** Reçoit l'id et les attributs ARIA à poser sur le contrôle. */
  children: (props: ControlProps) => ReactNode;
};

/** Libellé + contrôle + aide / erreur, reliés pour les lecteurs d'écran. */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-semibold text-foreground">
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden>
            *
          </span>
        )}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy, required })}
      <AnimatePresence initial={false} mode="wait">
        {error ? (
          <motion.p
            key="error"
            id={`${id}-error`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs font-medium text-destructive"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p key="hint" id={`${id}-hint`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground">
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Désactive d'un coup tous les contrôles (mode lecture seule). */
export function Fieldset({ className, ...props }: ComponentProps<"fieldset">) {
  return <fieldset className={cn("min-w-0 disabled:[&_*]:cursor-not-allowed", className)} {...props} />;
}
