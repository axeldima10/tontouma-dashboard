"use server";

import { z } from "zod";
import { ApiError } from "@/lib/api/errors";
import { isSuperAdminRole } from "@/lib/auth/roles";
import type { DocumentMeta, Position } from "@/lib/data/types";
import { orgAction } from "./run";

/* Documents de référence et plans du bâtiment — accessibles aux deux rôles d'organisation. */

type FileInfo = { fileName: string; contentType: string; sizeBytes: number };

const fileSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new ApiError("validation", result.error.issues[0]?.message ?? "Données invalides", 400);
  return result.data;
}

/* -------------------------------- Documents -------------------------------- */

/** Étape 1 : URL de téléversement demandée juste avant l'envoi (elle expire vite). */
export async function requestDocumentUpload(file: FileInfo) {
  return orgAction({ revalidate: false }, (r, ctx) => r.requestDocumentUpload(ctx, parse(fileSchema, file)));
}

const metaSchema = z.object({
  titre: z.string().trim().max(255),
  type: z.string().trim().min(1).max(60),
  description: z.string().trim().max(2000).nullable(),
  service_id: z.string().nullable(),
  procedure_id: z.string().nullable(),
});

/** Étape 3 : confirmation — le backend lance l'indexation en arrière-plan. */
export async function confirmDocument(key: string, meta: DocumentMeta) {
  return orgAction({}, (r, ctx) => r.confirmDocument(ctx, key, parse(metaSchema, meta)));
}

export async function retryDocument(id: string) {
  return orgAction({}, (r, ctx) => r.retryDocument(ctx, id));
}

export async function deleteDocument(id: string) {
  return orgAction({}, (r, ctx) => r.deleteDocument(ctx, id));
}

/** Lecture pour le suivi d'indexation (sondage client toutes les quelques secondes). */
export async function pollDocumentStatuses() {
  return orgAction({ revalidate: false }, async (r, ctx) =>
    (await r.listDocuments(ctx)).map((d) => ({ id: d.id, statutIndexation: d.statutIndexation })),
  );
}

/* ------------------------------ Plans du bâtiment ------------------------------ */

export async function requestPlanUpload(file: FileInfo) {
  return orgAction({ revalidate: false }, (r, ctx) => r.requestPlanUpload(ctx, parse(fileSchema, file)));
}

export async function createPlan(input: { nom: string; image_url: string }) {
  return orgAction({}, (r, ctx) =>
    r.createPlan(ctx, parse(z.object({ nom: z.string().trim().min(1, "Le nom est obligatoire").max(120), image_url: z.string().min(1) }), input)),
  );
}

export async function renamePlan(id: string, nom: string) {
  return orgAction({}, (r, ctx) => r.renamePlan(ctx, id, parse(z.string().trim().min(1).max(120), nom)));
}

export async function deletePlan(id: string) {
  return orgAction({}, (r, ctx) => r.deletePlan(ctx, id));
}

const positionSchema = z.object({
  entite_type: z.enum(["borne", "service"]),
  entite_id: z.string().min(1),
  coordonnee_x: z.number().min(0).max(100),
  coordonnee_y: z.number().min(0).max(100),
});

export async function savePosition(
  planId: string,
  input: { entite_type: Position["entite_type"]; entite_id: string; coordonnee_x: number; coordonnee_y: number },
) {
  return orgAction({}, (r, ctx) => {
    const data = parse(positionSchema, input);
    // Placer une borne relève de la gestion des bornes (super administrateur).
    if (data.entite_type === "borne" && !isSuperAdminRole(ctx.role))
      throw new ApiError("forbidden", "Seul le super administrateur place les bornes", 403);
    return r.savePosition(ctx, planId, data);
  });
}

export async function deletePosition(planId: string, positionId: string) {
  return orgAction({}, (r, ctx) => r.deletePosition(ctx, planId, positionId));
}
