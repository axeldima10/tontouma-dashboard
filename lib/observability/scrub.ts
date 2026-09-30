import type { Breadcrumb, ErrorEvent } from "@sentry/nextjs";

/**
 * Filtre commun à tous les runtimes (navigateur, serveur, edge) : aucune donnée personnelle ne part vers Sentry.
 * Pas de corps de requête, cookies, en-têtes d'authentification, valeurs de formulaire, contenu de document ni email.
 */

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const SENSITIVE_HEADERS = new Set(["authorization", "cookie", "set-cookie", "x-clerk-auth-token"]);

function redact(value: string | undefined): string | undefined {
  return value?.replace(EMAIL, "[email]");
}

/** Garde le chemin d'une URL, sans la query string (qui peut contenir une recherche ou un email). */
function pathOnly(url: unknown): string | undefined {
  if (typeof url !== "string") return undefined;
  const cut = url.search(/[?#]/);
  return redact(cut === -1 ? url : url.slice(0, cut));
}

export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.query_string;
    event.request.url = pathOnly(event.request.url);
    if (event.request.headers) {
      for (const key of Object.keys(event.request.headers)) {
        if (SENSITIVE_HEADERS.has(key.toLowerCase())) delete event.request.headers[key];
      }
    }
  }
  if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined;
  event.message = redact(event.message);
  for (const exception of event.exception?.values ?? []) exception.value = redact(exception.value);
  event.breadcrumbs = event.breadcrumbs?.map(scrubBreadcrumb).filter((b): b is Breadcrumb => b !== null);
  return event;
}

export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  // Saisie clavier : jamais envoyée.
  if (breadcrumb.category === "ui.input") return null;
  if (breadcrumb.category === "fetch" || breadcrumb.category === "xhr") {
    const data = breadcrumb.data ?? {};
    return { ...breadcrumb, data: { method: data.method, url: pathOnly(data.url), status_code: data.status_code } };
  }
  if (breadcrumb.category === "console") return { ...breadcrumb, message: redact(breadcrumb.message), data: undefined };
  return { ...breadcrumb, message: redact(breadcrumb.message) };
}

/** Options communes à tous les `Sentry.init`. Sentry reste inactif sans DSN. */
export const sentryBaseOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  sendDefaultPii: false,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  beforeSend: scrubEvent,
  beforeBreadcrumb: scrubBreadcrumb,
};
