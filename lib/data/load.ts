import "server-only";
import { cache } from "react";
import type { Subscription } from "@/lib/api/contract";
import { ApiError, settle, type Settled } from "@/lib/api/errors";
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

/**
 * Écrans réservés au super administrateur d'organisation : rôle vérifié AVANT toute lecture.
 * `forbidden` = afficher l'état interdit (le backend reste seul juge).
 */
export async function loadSuperAdmin<T>(
  urlOrgId: string,
  read: (r: Repository, ctx: OrgCtx) => Promise<T>,
): Promise<{ context: OrgContext; forbidden: true } | { context: OrgContext; forbidden: false; result: Settled<T> }> {
  const context = await requireOrgContext(urlOrgId);
  if (!context.isSuperAdmin) return { context, forbidden: true };
  const r = await repo();
  return { context, forbidden: false, result: await settle(read(r, { orgKey: context.orgId })) };
}

export async function loadPlatform<T>(read: (r: Repository) => Promise<T>): Promise<Settled<T>> {
  return settle(repo().then(read));
}

export type AccessState =
  | { readOnly: null; subscription: Subscription | null }
  | { readOnly: "suspendue" | "abonnement"; subscription: Subscription | null };

const ACCESS_CHECK_MS = 3000;

/**
 * Mode lecture seule, détecté une fois par requête dans le layout :
 * - 403 sur l'abonnement → organisation suspendue ;
 * - abonnement non ACTIVE (REMPLACEE, ANNULEE) → abonnement inactif.
 * Statut inconnu (réseau) → pas de blocage : le backend refusera toute écriture interdite.
 */
export const getAccessState = cache(async (orgKey: string): Promise<AccessState> => {
  try {
    // Le layout ne doit jamais attendre longtemps : au-delà de 3 s, on affiche le tableau de bord sans bloquer.
    const subscription = await Promise.race([
      (await repo()).getSubscription({ orgKey }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new ApiError("network", "Vérification d’accès trop longue")), ACCESS_CHECK_MS)),
    ]);
    return subscription.status === "ACTIVE" ? { readOnly: null, subscription } : { readOnly: "abonnement", subscription };
  } catch (error) {
    if (error instanceof ApiError && error.kind === "forbidden") return { readOnly: "suspendue", subscription: null };
    return { readOnly: null, subscription: null };
  }
});
