import "server-only";
import { settle, type Settled } from "@/lib/api/errors";
import { requireOrgContext, type OrgContext } from "@/lib/auth/guards";
import { repo, type OrgCtx, type Repository } from "./repository";

/**
 * Lecture pour une page d'organisation : contexte vérifié (organisation de la session),
 * puis résultat ou erreur décrite — la page affiche l'état adapté sans try/catch autour du JSX.
 */
export async function loadOrg<T>(
  urlOrgId: string,
  read: (r: Repository, ctx: OrgCtx) => Promise<T>,
): Promise<{ context: OrgContext; result: Settled<T> }> {
  const context = await requireOrgContext(urlOrgId);
  const r = await repo();
  const result = await settle(read(r, { orgKey: context.orgId }));
  return { context, result };
}

export async function loadPlatform<T>(read: (r: Repository) => Promise<T>): Promise<Settled<T>> {
  return settle(repo().then(read));
}

/**
 * Écrans de gestion (super administrateur) : le rôle est vérifié AVANT toute lecture.
 * `forbidden` = afficher l'état interdit (le backend refuserait de toute façon).
 */
export async function loadSuperAdmin<T>(
  urlOrgId: string,
  read: (r: Repository, ctx: OrgCtx) => Promise<T>,
): Promise<{ context: OrgContext; forbidden: true } | { context: OrgContext; forbidden: false; result: Settled<T> }> {
  const context = await requireOrgContext(urlOrgId);
  if (!context.isSuperAdmin) return { context, forbidden: true };
  const r = await repo();
  return { context, forbidden: false, result: await settle(read(r, { orgKey: context.orgId, role: context.orgRole })) };
}
