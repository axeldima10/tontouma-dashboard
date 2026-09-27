"use server";

import { z } from "zod";
import type { BorneStatus, DepartmentRequest, ProcedureRequest, ServiceRequest } from "@/lib/api/contract";
import { orgAction, parse } from "./run";
import { borneStatus, departmentInput, procedureInput, serviceInput } from "./schemas";

/* Contenu de l'organisation : départements, services, démarches, bornes. */

const idSchema = z.string().min(1);
const bool = z.boolean();

/* ------------------------------- Départements ------------------------------- */

export async function createDepartment(input: DepartmentRequest) {
  return orgAction({}, (r, ctx) => r.createDepartment(ctx, parse(departmentInput, input)));
}

export async function updateDepartment(id: string, input: DepartmentRequest) {
  return orgAction({}, (r, ctx) => r.updateDepartment(ctx, parse(idSchema, id), parse(departmentInput, input)));
}

export async function deleteDepartment(id: string) {
  return orgAction({}, (r, ctx) => r.deleteDepartment(ctx, parse(idSchema, id)));
}

export async function setDepartmentActive(id: string, active: boolean) {
  return orgAction({}, (r, ctx) => r.setDepartmentActive(ctx, parse(idSchema, id), parse(bool, active)));
}

/* --------------------------------- Services --------------------------------- */

export async function saveService(id: string | null, input: ServiceRequest) {
  return orgAction({}, (r, ctx) => {
    const data = parse(serviceInput, input);
    return id ? r.updateService(ctx, parse(idSchema, id), data) : r.createService(ctx, data);
  });
}

export async function deleteService(id: string) {
  return orgAction({}, (r, ctx) => r.deleteService(ctx, parse(idSchema, id)));
}

export async function setServiceActive(id: string, active: boolean) {
  return orgAction({}, (r, ctx) => r.setServiceActive(ctx, parse(idSchema, id), parse(bool, active)));
}

/* --------------------------------- Démarches --------------------------------- */

export async function saveProcedure(id: string | null, input: ProcedureRequest) {
  return orgAction({}, (r, ctx) => {
    const data = parse(procedureInput, input);
    return id ? r.updateProcedure(ctx, parse(idSchema, id), data) : r.createProcedure(ctx, data);
  });
}

export async function setProcedureActive(id: string, active: boolean) {
  return orgAction({}, (r, ctx) => r.setProcedureActive(ctx, parse(idSchema, id), parse(bool, active)));
}

export async function deleteProcedure(id: string) {
  return orgAction({}, (r, ctx) => r.deleteProcedure(ctx, parse(idSchema, id)));
}

/* ---------------------------------- Bornes ---------------------------------- */

export async function setBorneStatus(id: string, status: BorneStatus) {
  return orgAction({ superAdminOnly: true }, (r, ctx) => r.setBorneStatus(ctx, parse(idSchema, id), parse(borneStatus, status)));
}
