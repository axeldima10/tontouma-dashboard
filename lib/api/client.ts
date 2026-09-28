"use client";

import { useCallback } from "react";
import { useSession } from "@/components/auth/SessionProvider";
<<<<<<< HEAD
import { useDemoMode } from "@/components/shell/DemoMode";
import { refreshDocuments, uploadDocumentToMock } from "@/lib/actions/documents";
import type { ActionResult } from "@/lib/actions/result";
import { documentSchema, type KnowledgeDocument } from "./contract";
import { ApiError, describeError, toApiError } from "./errors";
import { normalizeBaseUrl, request } from "./request";

export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_ACCEPT = "application/pdf";

export type UploadMeta = { title: string; source: string | null; category: string | null };

/**
 * Téléversement d'un document de référence.
 * - Backend réel : le navigateur envoie le fichier DIRECTEMENT au backend (multipart), avec un jeton
 *   Clerk frais demandé juste avant l'envoi. Les octets ne transitent jamais par Next.js.
 * - Sans backend public configuré (développement) : backend fictif via une action serveur.
 */
export function useDocumentUpload() {
  const { session, getToken } = useSession();
  const demo = useDemoMode();

  return useCallback(
    async (file: File, meta: UploadMeta): Promise<ActionResult<KnowledgeDocument>> => {
      const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);

      if (demo) {
        const form = new FormData();
        form.set("file", file);
        form.set("title", meta.title);
        form.set("source", meta.source ?? "");
        form.set("category", meta.category ?? "");
        return uploadDocumentToMock(form);
      }

      try {
        if (!baseUrl) throw new ApiError("network", "NEXT_PUBLIC_API_BASE_URL manquante : le navigateur ne sait pas où envoyer le fichier.");
        const token = await getToken();
        if (!token && session.mode === "clerk") throw new ApiError("unauthorized", "Aucune session active", 401);
        const params = new URLSearchParams({ title: meta.title });
        if (meta.source) params.set("source", meta.source);
        if (meta.category) params.set("category", meta.category);
        const form = new FormData();
        form.set("file", file);
        const document = await request(baseUrl, `/api/v1/admin/knowledge-documents/upload?${params}`, token, {
          method: "POST",
          body: form,
          schema: documentSchema,
          // Fichier jusqu'à 10 Mo + indexation synchrone côté IA : délai plus long que les appels courants.
          timeoutMs: 120_000,
        });
        await refreshDocuments();
        return { ok: true, data: document };
      } catch (error) {
        const apiError = toApiError(error);
        const description = describeError(apiError);
        const precise = apiError.kind === "conflict" || apiError.kind === "validation" || apiError.kind === "upstream";
        return {
          ok: false,
          error: {
            kind: apiError.kind,
            title: apiError.kind === "upstream" ? "Indexation échouée" : description.title,
            message: precise && apiError.message ? apiError.message : description.description,
            retryable: description.retryable,
            violations: apiError.violations,
          },
        };
      }
    },
    [getToken, session.mode, demo],
=======
import { ApiError } from "./errors";
import { request, type RequestOptions } from "./request";

/** Appel backend depuis un composant client : le jeton est demandé juste avant chaque requête. */
export function useApi() {
  const { session, getToken } = useSession();

  return useCallback(
    async <T,>(path: string, options?: RequestOptions<T>): Promise<T> => {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!baseUrl) throw new ApiError("contractPending", "NEXT_PUBLIC_API_BASE_URL non configurée");
      const token = await getToken();
      if (!token && session.mode === "clerk") throw new ApiError("unauthorized", "Aucune session active", 401);
      return request(baseUrl, path, token, options);
    },
    [getToken, session.mode],
>>>>>>> 939f032 (First Commit)
  );
}
