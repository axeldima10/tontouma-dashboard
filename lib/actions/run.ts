import "server-only";
import { revalidatePath } from "next/cache";
import { ApiError, describeError, toApiError } from "@/lib/api/errors";
import { isSuperAdminRole } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";
import { repo, type OrgCtx, type Repository } from "@/lib/data/repository";
import type { ActionResult } from "./result";

const FORBIDDEN_MESSAGES: Record<string, string> = {
  ORG_SUSPENDED: "L’organisation est suspendue : aucune modification n’est possible.",
  SUBSCRIPTION_EXPIRED: "L’abonnement est expiré : les modifications et publications sont désactivées.",
};

function failure(error: unknown): ActionResult<never> {
  const apiError = toApiError(error);
  const description = describeError(apiError);
  const message =
    (apiError.code && FORBIDDEN_MESSAGES[apiError.code]) ||
    (apiError.kind === "conflict" || apiError.kind === "validation" ? apiError.message : description.description);
  return { ok: false, error: { kind: apiError.kind, title: description.title, message, retryable: description.retryable } };
}

/**
 * Exécute une écriture d'organisation : session et rôle revérifiés (masquage UI seulement,
 * le backend reste juge), organisation tirée de la session, puis rafraîchissement des écrans.
 */
export async function orgAction<T>(
  options: { superAdminOnly?: boolean; /** false pour les lectures (sondage) : pas de rafraîchissement. */ revalidate?: boolean },
  run: (r: Repository, ctx: OrgCtx) => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const session = await getSession();
    if (!session) throw new ApiError("unauthorized", "Session expirée", 401);
    if (!session.orgId) throw new ApiError("forbidden", "Aucune organisation active", 403);
    if (options.superAdminOnly && !isSuperAdminRole(session.orgRole))
      throw new ApiError("forbidden", "Réservé au super administrateur", 403);
    const data = await run(await repo(), { orgKey: session.orgId, role: session.orgRole });
    if (options.revalidate !== false) revalidatePath(`/dashboard/${session.orgId}`, "layout");
    return { ok: true, data };
  } catch (error) {
    return failure(error);
  }
}

/** Écriture de l'administration plateforme (personnel Tontouma uniquement). */
export async function platformAction<T>(run: (r: Repository) => Promise<T>): Promise<ActionResult<T>> {
  try {
    const session = await getSession();
    if (!session) throw new ApiError("unauthorized", "Session expirée", 401);
    if (!session.isPlatformAdmin) throw new ApiError("forbidden", "Réservé à l’équipe Tontouma", 403);
    const data = await run(await repo());
    revalidatePath("/admin", "layout");
    // Une suspension change aussi l'état des tableaux de bord d'organisation.
    revalidatePath("/dashboard", "layout");
    return { ok: true, data };
  } catch (error) {
    return failure(error);
  }
}
