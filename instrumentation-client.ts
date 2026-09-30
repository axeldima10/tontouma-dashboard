import * as Sentry from "@sentry/nextjs";
import { sentryBaseOptions } from "@/lib/observability/scrub";

// Navigateur. Pas de Session Replay : il enregistrerait ce que les gens tapent.
Sentry.init(sentryBaseOptions);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
