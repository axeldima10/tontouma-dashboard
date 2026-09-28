"use server";

import { z } from "zod";
<<<<<<< HEAD
import type { BorneRequest, BorneStatus, OrganizationCreateRequest, OrganizationUpdateRequest, PlanRequest } from "@/lib/api/contract";
import { parse, platformAction } from "./run";
import { borneInput, borneStatus, inviteInput, organizationCreateInput, organizationUpdateInput, planInput } from "./schemas";

/* Administration plateforme (équipe Tontouma) : organisations, membres, plans, bornes. */

const idSchema = z.string().min(1);
const bool = z.boolean();

/* ------------------------------- Organisations ------------------------------- */

export async function createOrganization(input: OrganizationCreateRequest) {
  return platformAction((r) => r.createOrganization(parse(organizationCreateInput, input)));
}

export async function updateOrganization(id: string, input: OrganizationUpdateRequest) {
  return platformAction((r) => r.updateOrganization(parse(idSchema, id), parse(organizationUpdateInput, input)));
}

export async function changeOrganizationPlan(id: string, planId: string) {
  return platformAction((r) => r.changeOrganizationPlan(parse(idSchema, id), parse(idSchema, planId)));
}

export async function setOrganizationActive(id: string, active: boolean) {
  return platformAction((r) => r.setOrganizationActive(parse(idSchema, id), parse(bool, active)));
}

export async function inviteAdmin(organizationId: string, email: string) {
  return platformAction((r) => r.inviteAdmin(parse(idSchema, organizationId), parse(inviteInput, { email }).email));
}

export async function removeAdmin(organizationId: string, clerkUserId: string) {
  return platformAction((r) => r.removeAdmin(parse(idSchema, organizationId), parse(idSchema, clerkUserId)));
}

/* ----------------------------------- Plans ----------------------------------- */

export async function savePlan(id: string | null, input: PlanRequest) {
  return platformAction((r) => {
    const data = parse(planInput, input);
    return id ? r.updatePlan(parse(idSchema, id), data) : r.createPlan(data);
  });
}

export async function deletePlan(id: string) {
  return platformAction((r) => r.deletePlan(parse(idSchema, id)));
}

export async function setPlanActive(id: string, active: boolean) {
  return platformAction((r) => r.setPlanActive(parse(idSchema, id), parse(bool, active)));
}

/* ----------------------------------- Bornes ---------------------------------- */

export async function saveBorne(id: string | null, input: BorneRequest) {
  return platformAction((r) => {
    const data = parse(borneInput, input);
    return id ? r.updateBorne(parse(idSchema, id), data) : r.createBorne(data);
  });
}

export async function deleteBorne(id: string) {
  return platformAction((r) => r.deleteBorne(parse(idSchema, id)));
}

export async function setAnyBorneStatus(id: string, status: BorneStatus) {
  return platformAction((r) => r.setAnyBorneStatus(parse(idSchema, id), parse(borneStatus, status)));
=======
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
>>>>>>> 939f032 (First Commit)
}
