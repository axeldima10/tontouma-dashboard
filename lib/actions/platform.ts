"use server";

import { z } from "zod";
import { ApiError } from "@/lib/api/errors";
import type { Organization, PlanInput } from "@/lib/data/types";
import { platformAction } from "./run";

/* Administration plateforme — personnel Tontouma uniquement. */

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new ApiError("validation", result.error.issues[0]?.message ?? "Données invalides", 400);
  return result.data;
}

export async function setOrganizationStatus(id: string, statut: Organization["statut"], motif: string) {
  return platformAction((r) =>
    r.setOrganizationStatus(
      id,
      parse(z.enum(["active", "suspendue"]), statut),
      parse(z.string().trim().min(3, "Indiquez un motif (3 caractères minimum)").max(500), motif),
    ),
  );
}

export async function decideDemande(id: string, decision: "approuvee" | "rejetee", motif: string | null) {
  return platformAction((r) => r.decideDemande(id, parse(z.enum(["approuvee", "rejetee"]), decision), motif));
}

const planSchema = z.object({
  nom: z.string().trim().min(1, "Le nom est obligatoire").max(80),
  description: z
    .string()
    .trim()
    .max(500)
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  prix: z.number().int("Le prix est un montant entier en FCFA").min(0),
  devise: z.literal("XOF"),
  periode: z.enum(["mensuel", "trimestriel", "annuel"]),
  limiteUtilisateurs: z.number().int().min(1, "Au moins 1 utilisateur"),
  limiteBornes: z.number().int().min(0),
  limiteStockage: z.number().int().min(0).nullable(),
  fonctionnalites: z.array(z.string().trim().min(1).max(120)).max(20),
  statut: z.enum(["actif", "inactif"]),
});

export async function savePlanAbonnement(id: string | null, input: PlanInput) {
  return platformAction((r) => {
    const data = parse(planSchema, input);
    return id ? r.updatePlanAbonnement(id, data) : r.createPlanAbonnement(data);
  });
}

export async function deletePlanAbonnement(id: string) {
  return platformAction((r) => r.deletePlanAbonnement(id));
}
