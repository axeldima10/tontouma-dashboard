import type * as SentrySdk from "@sentry/nextjs";
import { sentryBaseOptions } from "@/lib/observability/scrub";

let sentry: typeof SentrySdk | undefined;

// Navigateur. Pas de Session Replay : il enregistrerait ce que les gens tapent.
// Chargé à part et seulement avec un DSN : le SDK ne pèse pas sur le premier affichage.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  void import("@sentry/nextjs").then((sdk) => {
    sdk.init(sentryBaseOptions);
    sentry = sdk;
  });
}

export function onRouterTransitionStart(...args: Parameters<typeof SentrySdk.captureRouterTransitionStart>) {
  sentry?.captureRouterTransitionStart(...args);
}
