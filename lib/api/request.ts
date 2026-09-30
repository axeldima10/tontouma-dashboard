import type { ZodType } from "zod";
import { apiErrorSchema } from "./contract";
import { ApiError, kindFromStatus } from "./errors";

export type RequestOptions<T> = Omit<RequestInit, "body"> & {
  /** Objet sérialisé en JSON, ou FormData envoyé tel quel (multipart). */
  body?: unknown;
  /** Schéma Zod qui valide la réponse à la frontière de l'API. */
  schema?: ZodType<T>;
  /** Délai maximal avant d'abandonner (backend injoignable). 8 s par défaut. */
  timeoutMs?: number;
};

export const DEFAULT_TIMEOUT_MS = 8000;

/** Normalise une URL de base lue dans l'environnement (espaces, barre finale). */
export function normalizeBaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim().replace(/\/+$/, "");
  return trimmed ? trimmed : null;
}

/** Transforme une réponse d'erreur `ApiError` du backend en exception typée. */
export async function toResponseError(response: Response): Promise<ApiError> {
  let message = response.statusText || `Erreur ${response.status}`;
  let violations: { field: string; message: string }[] = [];
  try {
    const parsed = apiErrorSchema.safeParse(await response.json());
    if (parsed.success) {
      if (parsed.data.message) message = parsed.data.message;
      violations = parsed.data.violations ?? [];
    }
  } catch {
    // Corps non JSON : on garde le statut HTTP.
  }
  return new ApiError(kindFromStatus(response.status), message, response.status, violations);
}

/** Requête commune serveur / client. Le jeton est fourni frais par l'appelant, jamais stocké. */
export async function request<T>(
  baseUrl: string,
  path: string,
  token: string | null,
  { body, schema, headers, timeoutMs = DEFAULT_TIMEOUT_MS, ...init }: RequestOptions<T> = {},
): Promise<T> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      cache: "no-store",
      signal: init.signal ?? AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError");
    throw new ApiError("network", timedOut ? "Le service n’a pas répondu à temps" : error instanceof Error ? error.message : "Réseau indisponible");
  }

  if (!response.ok) throw await toResponseError(response);

  if (response.status === 204 || response.status === 202) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  const data: unknown = JSON.parse(text);
  if (!schema) return data as T;
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new ApiError("server", "Réponse du service inattendue", response.status);
  return parsed.data;
}
