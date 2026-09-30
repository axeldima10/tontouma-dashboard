import "server-only";
import { isDevAuth } from "@/lib/auth/mode";
import { getBackendToken } from "@/lib/auth/session";
import { ApiError } from "./errors";
import { normalizeBaseUrl, request, type RequestOptions } from "./request";

/** URL du backend (serveur uniquement). */
export function apiBaseUrl(): string | null {
  return normalizeBaseUrl(process.env.API_BASE_URL);
}

export type DataSource = "api" | "mock";

/**
 * Source des données :
 * - `DATA_SOURCE=mock` force le backend fictif (travail hors réseau, l'URL du backend reste dans le fichier) ;
 * - `DATA_SOURCE=api` force le backend réel ;
 * - sinon : backend réel si `API_BASE_URL` est défini.
 * Le backend fictif est refusé en production.
 */
export function dataSource(): DataSource {
  const forced = process.env.DATA_SOURCE?.trim();
  const source: DataSource = forced === "mock" || forced === "api" ? forced : apiBaseUrl() ? "api" : "mock";
  if (source === "mock" && process.env.NODE_ENV === "production") throw new Error("DATA_SOURCE=mock est interdit en production.");
  return source;
}

/** Vrai quand les écrans lisent le backend réel. */
export function isApiConfigured(): boolean {
  return dataSource() === "api";
}

/*
 * Santé du backend (coupe-circuit) :
 * - « unknown » : premier appel → sonde rapide (3 s) avant d'envoyer la vraie requête ;
 * - « down » : les appels échouent immédiatement ; toutes les 15 s, une sonde en arrière-plan
 *   vérifie si le backend est revenu, sans jamais faire attendre un écran ;
 * - « up » : appels normaux ; une panne réseau relance une sonde qui tranche.
 * N'importe quelle réponse HTTP (même 404) prouve que le backend est joignable.
 */
const PROBE_TIMEOUT_MS = 3000;
const RETRY_AFTER_MS = 15_000;
type Health = { status: "unknown" | "up" | "down"; checkedAt: number; probe: Promise<boolean> | null };
const holder = globalThis as unknown as { __tontoumaBackendHealth?: Health };
const health = (): Health => (holder.__tontoumaBackendHealth ??= { status: "unknown", checkedAt: 0, probe: null });

function probe(baseUrl: string): Promise<boolean> {
  const h = health();
  h.probe ??= fetch(baseUrl, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) })
    .then(() => true)
    .catch(() => false)
    .then((reachable) => {
      h.status = reachable ? "up" : "down";
      h.checkedAt = Date.now();
      h.probe = null;
      return reachable;
    });
  return h.probe;
}

const unreachable = () => new ApiError("network", "Backend injoignable (nouvel essai automatique dans quelques secondes)");

/** Appel backend authentifié : jeton Clerk frais à chaque requête (aucun en mode dev). */
export async function apiFetch<T>(path: string, options?: RequestOptions<T>): Promise<T> {
  const token = await getBackendToken();
  if (!token && !isDevAuth()) throw new ApiError("unauthorized", "Aucune session active", 401);
  return send(path, token, options);
}

/** Endpoint public (`/public/...`) : aucun jeton, comme pour un citoyen. */
export async function publicFetch<T>(path: string, options?: RequestOptions<T>): Promise<T> {
  return send(path, null, options);
}

async function send<T>(path: string, token: string | null, options?: RequestOptions<T>): Promise<T> {
  const baseUrl = apiBaseUrl();
  if (!baseUrl) throw new ApiError("network", "API_BASE_URL non configurée");
  const h = health();
  if (h.status === "unknown" && !(await probe(baseUrl))) throw unreachable();
  if (h.status === "down") {
    if (Date.now() - h.checkedAt > RETRY_AFTER_MS) void probe(baseUrl);
    throw unreachable();
  }
  try {
    return await request(baseUrl, `/api/v1${path}`, token, options);
  } catch (error) {
    // Panne réseau ou délai dépassé : on ne conclut pas seul (un appel lent n'est pas un backend absent).
    // Les appels suivants partagent une sonde rapide qui tranche entre « up » et « down ».
    if (error instanceof ApiError && error.kind === "network" && !options?.signal && h.status === "up") {
      h.status = "unknown";
      void probe(baseUrl);
    }
    throw error;
  }
}
