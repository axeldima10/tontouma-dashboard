export type ApiErrorKind =
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "conflict"
  | "validation"
  /** 502 : un service en amont (IA, stockage, Clerk) a échoué. */
  | "upstream"
  | "network"
  | "server";

export type Violation = { field: string; message: string };

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  /** Détail par champ, présent seulement sur les 400 de validation. */
  readonly violations: Violation[];

  constructor(kind: ApiErrorKind, message: string, status: number | null = null, violations: Violation[] = []) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.violations = violations;
  }
}

export function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "notFound";
  if (status === 409) return "conflict";
  if (status === 400 || status === 422) return "validation";
  if (status === 502) return "upstream";
  return "server";
}

export type ErrorDescription = {
  kind: ApiErrorKind;
  title: string;
  description: string;
  /** Réessayer est-il sans risque (aucune écriture en double possible) ? */
  retryable: boolean;
};

const DESCRIPTIONS: Record<ApiErrorKind, Omit<ErrorDescription, "kind">> = {
  unauthorized: {
    title: "Session expirée",
    description: "Reconnectez-vous pour continuer. Aucune donnée n’a été modifiée.",
    retryable: false,
  },
  forbidden: {
    title: "Accès refusé",
    description: "Votre rôle, ou l’état de l’organisation ou de l’abonnement, ne permet pas cette action.",
    retryable: false,
  },
  notFound: {
    title: "Élément introuvable",
    description: "Il a peut-être été supprimé ou n’appartient pas à cette organisation.",
    retryable: false,
  },
  conflict: {
    title: "Action impossible",
    description: "Une limite du plan est atteinte, l’élément existe déjà ou il est encore utilisé ailleurs.",
    retryable: false,
  },
  validation: {
    title: "Données invalides",
    description: "Certaines informations ne respectent pas le format attendu.",
    retryable: false,
  },
  upstream: {
    title: "Service partenaire indisponible",
    description: "L’assistant IA, le stockage ou Clerk n’a pas répondu. Vous pouvez réessayer dans un instant.",
    retryable: true,
  },
  network: {
    title: "Serveur injoignable",
    description: "Impossible de joindre le service Tontouma. Vous pouvez réessayer sans risque.",
    retryable: true,
  },
  server: {
    title: "Erreur du service",
    description: "Le service a rencontré un problème. Vous pouvez réessayer sans risque.",
    retryable: true,
  },
};

export function describeError(error: unknown): ErrorDescription {
  const kind = error instanceof ApiError ? error.kind : "server";
  return { kind, ...DESCRIPTIONS[kind] };
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof TypeError) return new ApiError("network", error.message);
  return new ApiError("server", error instanceof Error ? error.message : "Erreur inconnue");
}

export type Settled<T> = { ok: true; data: T } | { ok: false; error: ErrorDescription };

/** Résout une requête en valeur ou en erreur décrite, pour rendre l'état adapté sans try/catch autour du JSX. */
export async function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  try {
    return { ok: true, data: await promise };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}
