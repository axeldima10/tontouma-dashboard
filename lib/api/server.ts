import "server-only";
import { isDevAuth } from "@/lib/auth/mode";
import { getBackendToken } from "@/lib/auth/session";
import { ApiError } from "./errors";
import { request, type RequestOptions } from "./request";

/** Vrai quand un backend est configuré. Sinon, les écrans utilisent les fixtures de développement. */
export function isApiConfigured(): boolean {
  return Boolean(process.env.API_BASE_URL);
}

/** Appel backend côté serveur : jeton Clerk frais à chaque requête (aucun en mode dev). */
export async function apiFetch<T>(path: string, options?: RequestOptions<T>): Promise<T> {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) throw new ApiError("contractPending", "API_BASE_URL non configurée");
  const token = await getBackendToken();
  if (!token && !isDevAuth()) throw new ApiError("unauthorized", "Aucune session active", 401);
  return request(baseUrl, path, token, options);
}
