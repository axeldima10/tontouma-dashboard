import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from "next/constants";

const nextConfig: NextConfig = {};

export default function config(phase: string): NextConfig {
  // Le contournement d'authentification (AUTH_MODE=dev) ne doit jamais être construit ni servi en production.
  if (process.env.AUTH_MODE === "dev" && (phase === PHASE_PRODUCTION_BUILD || phase === PHASE_PRODUCTION_SERVER)) {
    throw new Error(
      "AUTH_MODE=dev est réservé au développement local. Retirez-le de l'environnement avant un build ou un démarrage de production.",
    );
  }
  return nextConfig;
}
