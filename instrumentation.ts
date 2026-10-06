import type { Instrumentation } from "next";

// Sans DSN, le SDK Sentry n'est jamais importé (ni compilé au démarrage).
export async function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge") await import("./sentry.edge.config");
}

/** Erreurs des composants serveur, route handlers et actions serveur. */
export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  const { captureRequestError } = await import("@sentry/nextjs");
  captureRequestError(...args);
};
