import type { ZodType } from "zod";
import { ApiError, kindFromStatus } from "./errors";

export type RequestOptions<T> = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Schéma Zod qui valide la réponse à la frontière de l'API. */
  schema?: ZodType<T>;
};

/** Requête commune serveur / client. Le jeton est fourni frais par l'appelant, jamais stocké. */
export async function request<T>(
  baseUrl: string,
  path: string,
  token: string | null,
  { body, schema, headers, ...init }: RequestOptions<T> = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch (error) {
    throw new ApiError("network", error instanceof Error ? error.message : "Réseau indisponible");
  }

  if (!response.ok) {
    let code: string | null = null;
    let message = response.statusText;
    try {
      const payload = (await response.json()) as { code?: unknown; message?: unknown };
      if (typeof payload.code === "string") code = payload.code;
      if (typeof payload.message === "string") message = payload.message;
    } catch {
      // Corps non JSON : on garde le statut HTTP.
    }
    throw new ApiError(kindFromStatus(response.status), message, response.status, code);
  }

  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json();
  if (!schema) return data as T;
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new ApiError("server", "Réponse du service inattendue", response.status);
  return parsed.data;
}
