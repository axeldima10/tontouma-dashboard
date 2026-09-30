import * as Sentry from "@sentry/nextjs";
import { sentryBaseOptions } from "@/lib/observability/scrub";

Sentry.init(sentryBaseOptions);
