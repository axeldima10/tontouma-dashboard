"use client";

import { useCallback, useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import type { ActionResult } from "@/lib/actions/result";

type RunOptions<T> = {
  /** Toast de succès (omis = silencieux). */
  success?: string | ((data: T) => string);
  successDescription?: string;
  onSuccess?: (data: T) => void;
};

/**
 * Exécute une Server Action : état « en cours », toast d'erreur explicite (403 / 409 / validation),
 * toast de succès optionnel. Chaque composant a son propre état `pending`.
 */
export function useAction() {
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const run = useCallback(
    <T,>(action: () => Promise<ActionResult<T>>, options: RunOptions<T> = {}) =>
      new Promise<ActionResult<T>>((resolve) => {
        startTransition(async () => {
          const result = await action();
          if (result.ok) {
            const title = typeof options.success === "function" ? options.success(result.data) : options.success;
            if (title) toast.show({ tone: "success", title, description: options.successDescription });
            options.onSuccess?.(result.data);
          } else {
            toast.show({ tone: "error", title: result.error.title, description: result.error.message });
          }
          resolve(result);
        });
      }),
    [toast],
  );

  return { run, pending };
}
