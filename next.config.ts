import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from "next/constants";

const nextConfig: NextConfig = {};

export default async function config(phase: string): Promise<NextConfig> {
  // Le contournement d'authentification (AUTH_MODE=dev) ne doit jamais être construit ni servi en production.
  if (process.env.AUTH_MODE === "dev" && (phase === PHASE_PRODUCTION_BUILD || phase === PHASE_PRODUCTION_SERVER)) {
    throw new Error(
      "AUTH_MODE=dev est réservé au développement local. Retirez-le de l'environnement avant un build ou un démarrage de production.",
    );
  }
  // Sans DSN, Sentry n'est ni chargé ni compilé : il ne ferait que ralentir le démarrage.
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return nextConfig;

  const { withSentryConfig } = await import("@sentry/nextjs/config");
  // Source maps envoyées à Sentry uniquement si le jeton et le projet sont configurés, puis retirées du build.
  return withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: !process.env.CI,
    sourcemaps: {
      disable: !(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT),
      deleteSourcemapsAfterUpload: true,
    },
    telemetry: false,
  });
}
