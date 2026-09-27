"use server";

import { z } from "zod";
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
}
