import "server-only";
import { revalidatePath } from "next/cache";
<<<<<<< HEAD
import { z } from "zod";
=======
>>>>>>> 939f032 (First Commit)
import { ApiError, describeError, toApiError } from "@/lib/api/errors";
import { isSuperAdminRole } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";
import { repo, type OrgCtx, type Repository } from "@/lib/data/repository";
import type { ActionResult } from "./result";

<<<<<<< HEAD
function failure(error: unknown): ActionResult<never> {
  const apiError = toApiError(error);
  const description = describeError(apiError);
  // Les messages métier du backend (quota, doublon, référence) sont précis : on les affiche tels quels.
  const precise = apiError.kind === "conflict" || apiError.kind === "validation" || apiError.kind === "forbidden" || apiError.kind === "upstream";
  return {
    ok: false,
    error: {
      kind: apiError.kind,
      title: description.title,
      message: precise && apiError.message ? apiError.message : description.description,
      retryable: description.retryable,
      violations: apiError.violations,
    },
  };
}

/** Valide l'entrée d'une action : l'erreur Zod devient une erreur de validation affichable. */
export function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const violations = result.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message }));
    throw new ApiError("validation", result.error.issues[0]?.message ?? "Données invalides", 400, violations);
  }
  return result.data;
=======
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
>>>>>>> 939f032 (First Commit)
}

/**
 * Exécute une écriture d'organisation : session et rôle revérifiés (masquage UI seulement,
 * le backend reste juge), organisation tirée de la session, puis rafraîchissement des écrans.
 */
export async function orgAction<T>(
<<<<<<< HEAD
  options: { superAdminOnly?: boolean; /** false pour une lecture : aucun rafraîchissement d'écran. */ revalidate?: boolean },
=======
  options: { superAdminOnly?: boolean; /** false pour les lectures (sondage) : pas de rafraîchissement. */ revalidate?: boolean },
>>>>>>> 939f032 (First Commit)
  run: (r: Repository, ctx: OrgCtx) => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const session = await getSession();
    if (!session) throw new ApiError("unauthorized", "Session expirée", 401);
    if (!session.orgId) throw new ApiError("forbidden", "Aucune organisation active", 403);
    if (options.superAdminOnly && !isSuperAdminRole(session.orgRole))
<<<<<<< HEAD
      throw new ApiError("forbidden", "Réservé au super administrateur de l’organisation.", 403);
    const data = await run(await repo(), { orgKey: session.orgId });
=======
      throw new ApiError("forbidden", "Réservé au super administrateur", 403);
    const data = await run(await repo(), { orgKey: session.orgId, role: session.orgRole });
>>>>>>> 939f032 (First Commit)
    if (options.revalidate !== false) revalidatePath(`/dashboard/${session.orgId}`, "layout");
    return { ok: true, data };
  } catch (error) {
    return failure(error);
  }
}

/** Écriture de l'administration plateforme (personnel Tontouma uniquement). */
<<<<<<< HEAD
export async function platformAction<T>(
  run: (r: Repository) => Promise<T>,
  options: { revalidate?: boolean } = {},
): Promise<ActionResult<T>> {
  try {
    const session = await getSession();
    if (!session) throw new ApiError("unauthorized", "Session expirée", 401);
    if (!session.isPlatformAdmin) throw new ApiError("forbidden", "Réservé à l’équipe Tontouma.", 403);
    const data = await run(await repo());
    if (options.revalidate !== false) {
      revalidatePath("/admin", "layout");
      // Une suspension ou un changement de plan change aussi l'état des tableaux de bord d'organisation.
      revalidatePath("/dashboard", "layout");
    }
=======
export async function platformAction<T>(run: (r: Repository) => Promise<T>): Promise<ActionResult<T>> {
  try {
    const session = await getSession();
    if (!session) throw new ApiError("unauthorized", "Session expirée", 401);
    if (!session.isPlatformAdmin) throw new ApiError("forbidden", "Réservé à l’équipe Tontouma", 403);
    const data = await run(await repo());
    revalidatePath("/admin", "layout");
    // Une suspension change aussi l'état des tableaux de bord d'organisation.
    revalidatePath("/dashboard", "layout");
>>>>>>> 939f032 (First Commit)
    return { ok: true, data };
  } catch (error) {
    return failure(error);
  }
}
