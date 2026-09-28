"use client";

import { useCallback, useTransition } from "react";
<<<<<<< HEAD
import { toast } from "sonner";
=======
import { useToast } from "@/components/ui/Toast";
>>>>>>> 939f032 (First Commit)
import type { ActionResult } from "@/lib/actions/result";

type RunOptions<T> = {
  /** Toast de succès (omis = silencieux). */
  success?: string | ((data: T) => string);
  successDescription?: string;
  onSuccess?: (data: T) => void;
<<<<<<< HEAD
  /** Proposer « Réessayer » dans le toast d'erreur quand c'est sans risque (ex. 502 d'indexation). */
  retry?: () => void;
};

/**
 * Exécute une Server Action : état « en cours », toast d'erreur explicite (403 / 409 / 502 / validation),
 * toast de succès optionnel. Chaque composant a son propre état `pending`.
 */
export function useAction() {
=======
};

/**
 * Exécute une Server Action : état « en cours », toast d'erreur explicite (403 / 409 / validation),
 * toast de succès optionnel. Chaque composant a son propre état `pending`.
 */
export function useAction() {
  const toast = useToast();
>>>>>>> 939f032 (First Commit)
  const [pending, startTransition] = useTransition();

  const run = useCallback(
    <T,>(action: () => Promise<ActionResult<T>>, options: RunOptions<T> = {}) =>
      new Promise<ActionResult<T>>((resolve) => {
        startTransition(async () => {
          const result = await action();
          if (result.ok) {
            const title = typeof options.success === "function" ? options.success(result.data) : options.success;
<<<<<<< HEAD
            if (title) toast.success(title, { description: options.successDescription });
            options.onSuccess?.(result.data);
          } else {
            toast.error(result.error.title, {
              description: result.error.message,
              action: result.error.retryable && options.retry ? { label: "Réessayer", onClick: options.retry } : undefined,
              duration: 7000,
            });
=======
            if (title) toast.show({ tone: "success", title, description: options.successDescription });
            options.onSuccess?.(result.data);
          } else {
            toast.show({ tone: "error", title: result.error.title, description: result.error.message });
>>>>>>> 939f032 (First Commit)
          }
          resolve(result);
        });
      }),
<<<<<<< HEAD
    [],
=======
    [toast],
>>>>>>> 939f032 (First Commit)
  );

  return { run, pending };
}
<<<<<<< HEAD

/** Message d'erreur du backend pour un champ donné (violations[] d'un 400). */
export function violationFor(result: ActionResult<unknown> | null, field: string): string | null {
  if (!result || result.ok) return null;
  return result.error.violations.find((v) => v.field === field || v.field.endsWith(`.${field}`))?.message ?? null;
}
=======
>>>>>>> 939f032 (First Commit)
