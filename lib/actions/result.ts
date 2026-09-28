import type { ApiErrorKind } from "@/lib/api/errors";

export type ActionError = {
  kind: ApiErrorKind;
  title: string;
  /** Message précis renvoyé par le backend (limite atteinte, doublon…), à afficher tel quel. */
  message: string;
  retryable: boolean;
};

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };
