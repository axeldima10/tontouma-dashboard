export type ApiErrorKind =
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "conflict"
  | "validation"
<<<<<<< HEAD
  /** 502 : un service en amont (IA, stockage, Clerk) a échoué. */
  | "upstream"
  | "network"
  | "server";

export type Violation = { field: string; message: string };
=======
  | "network"
  | "server"
  | "contractPending";
>>>>>>> 939f032 (First Commit)

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
<<<<<<< HEAD
  /** Détail par champ, présent seulement sur les 400 de validation. */
  readonly violations: Violation[];

  constructor(kind: ApiErrorKind, message: string, status: number | null = null, violations: Violation[] = []) {
=======
  /** Code d'erreur métier renvoyé par le backend, si présent. */
  readonly code: string | null;

  constructor(kind: ApiErrorKind, message: string, status: number | null = null, code: string | null = null) {
>>>>>>> 939f032 (First Commit)
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
<<<<<<< HEAD
    this.violations = violations;
=======
    this.code = code;
>>>>>>> 939f032 (First Commit)
  }
}

export function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "notFound";
  if (status === 409) return "conflict";
  if (status === 400 || status === 422) return "validation";
<<<<<<< HEAD
  if (status === 502) return "upstream";
=======
>>>>>>> 939f032 (First Commit)
  return "server";
}

export type ErrorDescription = {
<<<<<<< HEAD
  kind: ApiErrorKind;
=======
>>>>>>> 939f032 (First Commit)
  title: string;
  description: string;
  /** Réessayer est-il sans risque (aucune écriture en double possible) ? */
  retryable: boolean;
};

<<<<<<< HEAD
const DESCRIPTIONS: Record<ApiErrorKind, Omit<ErrorDescription, "kind">> = {
=======
const DESCRIPTIONS: Record<ApiErrorKind, ErrorDescription> = {
>>>>>>> 939f032 (First Commit)
  unauthorized: {
    title: "Session expirée",
    description: "Reconnectez-vous pour continuer. Aucune donnée n’a été modifiée.",
    retryable: false,
  },
  forbidden: {
    title: "Accès refusé",
<<<<<<< HEAD
    description: "Votre rôle, ou l’état de l’organisation ou de l’abonnement, ne permet pas cette action.",
=======
    description: "Votre rôle ou l’état de l’abonnement ne permet pas cette action.",
>>>>>>> 939f032 (First Commit)
    retryable: false,
  },
  notFound: {
    title: "Élément introuvable",
    description: "Il a peut-être été supprimé ou n’appartient pas à cette organisation.",
    retryable: false,
  },
  conflict: {
<<<<<<< HEAD
    title: "Action impossible",
    description: "Une limite du plan est atteinte, l’élément existe déjà ou il est encore utilisé ailleurs.",
=======
    title: "Action impossible pour le moment",
    description: "Une limite du plan est atteinte ou l’élément a changé entre-temps.",
>>>>>>> 939f032 (First Commit)
    retryable: false,
  },
  validation: {
    title: "Données invalides",
    description: "Certaines informations ne respectent pas le format attendu.",
    retryable: false,
  },
<<<<<<< HEAD
  upstream: {
    title: "Service partenaire indisponible",
    description: "L’assistant IA, le stockage ou Clerk n’a pas répondu. Vous pouvez réessayer dans un instant.",
    retryable: true,
  },
=======
>>>>>>> 939f032 (First Commit)
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
<<<<<<< HEAD
};

export function describeError(error: unknown): ErrorDescription {
  const kind = error instanceof ApiError ? error.kind : "server";
  return { kind, ...DESCRIPTIONS[kind] };
=======
  contractPending: {
    title: "Connexion au service en attente",
    description:
      "Cet écran sera branché au backend dès que le contrat d’API sera disponible. Aucune donnée n’est affichée pour éviter toute information erronée.",
    retryable: false,
  },
};

export function describeError(error: unknown): ErrorDescription {
  if (error instanceof ApiError) return DESCRIPTIONS[error.kind];
  return DESCRIPTIONS.server;
>>>>>>> 939f032 (First Commit)
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
