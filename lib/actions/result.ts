import type { ApiErrorKind, Violation } from "@/lib/api/errors";

export type ActionError = {
  kind: ApiErrorKind;
  title: string;
  /** Message précis renvoyé par le backend (limite atteinte, doublon…), à afficher tel quel. */
  message: string;
  retryable: boolean;
  /** Erreurs par champ (400 de validation), à reporter sous les champs du formulaire. */
  violations: Violation[];
};

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };
