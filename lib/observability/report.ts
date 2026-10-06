/** Signale une erreur d'écran à Sentry. Sans DSN, le SDK n'est pas chargé du tout. */
export function reportError(error: unknown, tags?: Record<string, string>) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  void import("@sentry/nextjs").then((sdk) => sdk.captureException(error, tags ? { tags } : undefined));
}
