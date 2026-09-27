"use server";

import { z } from "zod";
import type { PublicBorne } from "@/lib/api/contract";
import { ApiError, describeError, toApiError } from "@/lib/api/errors";
import { getSession } from "@/lib/auth/session";
import { repo } from "@/lib/data/repository";
import { parse } from "./run";

export type BorneTest = { ok: true; borne: PublicBorne } | { ok: false; kind: string; title: string; message: string };

/**
 * « Tester la borne » : appelle l'endpoint public qu'une borne physique interroge au démarrage.
 * Lecture seule ; réservé aux utilisateurs connectés du tableau de bord.
 */
export async function testPublicBorne(borneId: string): Promise<BorneTest> {
  try {
    if (!(await getSession())) throw new ApiError("unauthorized", "Session expirée", 401);
    const borne = await (await repo()).getPublicBorne(parse(z.string().min(1), borneId));
    return { ok: true, borne };
  } catch (error) {
    const e = toApiError(error);
    return { ok: false, kind: e.kind, title: describeError(e).title, message: e.message };
  }
}
