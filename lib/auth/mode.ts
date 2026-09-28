/**
 * `AUTH_MODE=dev` désactive Clerk pour construire et tester les écrans sans clés.
 * Jamais actif en production : `next.config.ts` refuse aussi le build dans ce mode.
 */
export function isDevAuth(): boolean {
  return process.env.AUTH_MODE === "dev" && process.env.NODE_ENV !== "production";
}
