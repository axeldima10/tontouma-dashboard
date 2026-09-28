<<<<<<< HEAD
import type { ApiErrorKind, Violation } from "@/lib/api/errors";
=======
import type { ApiErrorKind } from "@/lib/api/errors";
>>>>>>> 939f032 (First Commit)

export type ActionError = {
  kind: ApiErrorKind;
  title: string;
  /** Message précis renvoyé par le backend (limite atteinte, doublon…), à afficher tel quel. */
  message: string;
  retryable: boolean;
<<<<<<< HEAD
  /** Erreurs par champ (400 de validation), à reporter sous les champs du formulaire. */
  violations: Violation[];
=======
>>>>>>> 939f032 (First Commit)
};

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };
