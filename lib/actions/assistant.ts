"use server";

import { z } from "zod";
import { ApiError } from "@/lib/api/errors";
import { isApiConfigured } from "@/lib/api/server";
import { getSession } from "@/lib/auth/session";
import { repo } from "@/lib/data/repository";
import type { ActionResult } from "./result";
import { parse } from "./run";

/**
 * Équivalents « démonstration » des endpoints publics du chatbot et de la recherche d'organisations.
 * Uniquement en DATA_SOURCE=mock : avec le vrai backend, le navigateur appelle directement les endpoints publics.
 */
async function demoOnly<T>(run: () => Promise<T> | T): Promise<ActionResult<T>> {
  try {
    if (!(await getSession())) throw new ApiError("unauthorized", "Session expirée", 401);
    if (isApiConfigured()) throw new ApiError("forbidden", "Simulation réservée au mode démonstration.", 403);
    return { ok: true, data: await run() };
  } catch (error) {
    const e = error instanceof ApiError ? error : new ApiError("server", "Erreur de la simulation");
    return { ok: false, error: { kind: e.kind, title: "Assistant simulé", message: e.message, retryable: false, violations: e.violations } };
  }
}

const mock = () => import("@/lib/data/mock/assistant");

export async function demoStartConversation(input: { organizationId?: string; question?: string }) {
  return demoOnly(async () =>
    (await mock()).startConversation(parse(z.object({ organizationId: z.string().optional(), question: z.string().max(2000).optional() }), input)),
  );
}

export async function demoSendMessage(conversationId: string, content: string) {
  return demoOnly(async () => (await mock()).answer(parse(z.string().min(1), conversationId), parse(z.string().trim().min(1, "Question vide"), content)));
}

export async function demoHistory(conversationId: string) {
  return demoOnly(async () => (await mock()).history(parse(z.string().min(1), conversationId)));
}

export async function demoSearchOrganizations(q: string) {
  return demoOnly(async () => (await repo()).searchPublicOrganizations(parse(z.string().trim().min(2, "Tapez au moins 2 caractères").max(100), q)));
}
