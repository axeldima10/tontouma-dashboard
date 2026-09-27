"use server";

import { z } from "zod";
import type { DocumentTextRequest, DocumentUpdateRequest } from "@/lib/api/contract";
import { ApiError } from "@/lib/api/errors";
import { isApiConfigured } from "@/lib/api/server";
import { orgAction, parse } from "./run";
import { documentTextInput, documentUpdateInput } from "./schemas";

/* Base de connaissances IA : documents de référence de l'organisation. */

const idSchema = z.string().min(1);

export async function createTextDocument(input: DocumentTextRequest) {
  return orgAction({}, (r, ctx) => r.createTextDocument(ctx, parse(documentTextInput, input)));
}

export async function updateDocument(id: string, input: DocumentUpdateRequest) {
  return orgAction({}, (r, ctx) => r.updateDocument(ctx, parse(idSchema, id), parse(documentUpdateInput, input)));
}

export async function setDocumentActive(id: string, active: boolean) {
  return orgAction({}, (r, ctx) => r.setDocumentActive(ctx, parse(idSchema, id), parse(z.boolean(), active)));
}

export async function deleteDocument(id: string) {
  return orgAction({}, (r, ctx) => r.deleteDocument(ctx, parse(idSchema, id)));
}

/**
 * Backend fictif uniquement (développement sans API) : reçoit le fichier pour simuler le téléversement.
 * Avec un backend réel, le navigateur envoie le fichier directement au backend et cette action refuse.
 */
export async function uploadDocumentToMock(form: FormData) {
  return orgAction({}, (r, ctx) => {
    if (isApiConfigured()) throw new ApiError("forbidden", "Téléversement réservé au backend fictif.", 403);
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError("validation", "Fichier manquant", 400);
    const meta = parse(
      z.object({ title: documentTextInput.shape.title, source: documentTextInput.shape.source, category: documentTextInput.shape.category }),
      { title: form.get("title"), source: form.get("source") || null, category: form.get("category") || null },
    );
    return r.uploadDocument(ctx, meta, file);
  });
}

/** Rafraîchit les écrans après un téléversement direct navigateur → backend. */
export async function refreshDocuments() {
  return orgAction({}, async () => null);
}
