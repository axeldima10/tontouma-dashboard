"use server";

import { z } from "zod";
<<<<<<< HEAD
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
=======
import { ApiError } from "@/lib/api/errors";
import type { ProcedureRequest, PublicationStatus, ServiceInput } from "@/lib/data/types";
import { orgAction } from "./run";

/* Contenu : départements, services, démarches — accessibles aux deux rôles d'organisation. */

const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable();

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new ApiError("validation", result.error.issues[0]?.message ?? "Données invalides", 400);
  return result.data;
}

/* ------------------------------- Départements ------------------------------- */

const departementSchema = z.object({ nom: text(120).min(1, "Le nom est obligatoire"), description: optionalText(500) });

export async function createDepartement(input: { nom: string; description: string | null }) {
  return orgAction({}, (r, ctx) => r.createDepartement(ctx, parse(departementSchema, input)));
}

export async function updateDepartement(id: string, input: { nom: string; description: string | null }) {
  return orgAction({}, (r, ctx) => r.updateDepartement(ctx, id, parse(departementSchema, input)));
}

export async function deleteDepartement(id: string) {
  return orgAction({}, (r, ctx) => r.deleteDepartement(ctx, id));
}

export async function reorderDepartements(ids: string[]) {
  return orgAction({}, (r, ctx) => r.reorderDepartements(ctx, parse(z.array(z.string()), ids)));
>>>>>>> 939f032 (First Commit)
}

/* --------------------------------- Services --------------------------------- */

<<<<<<< HEAD
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
=======
const serviceSchema = z.object({
  departement_id: z.string().nullable(),
  nom: text(160).min(1, "Le nom est obligatoire"),
  description: optionalText(2000),
  localisation: optionalText(300),
  telephone: optionalText(40),
  email: optionalText(160).refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Adresse email invalide"),
  horaires: optionalText(300),
  description_orientation: optionalText(500),
});

export async function createService(input: ServiceInput) {
  return orgAction({}, (r, ctx) => r.createService(ctx, parse(serviceSchema, input)));
}

export async function updateService(id: string, input: ServiceInput) {
  return orgAction({}, (r, ctx) => r.updateService(ctx, id, parse(serviceSchema, input)));
}

export async function deleteService(id: string) {
  return orgAction({}, (r, ctx) => r.deleteService(ctx, id));
}

export async function reorderServices(ids: string[]) {
  return orgAction({}, (r, ctx) => r.reorderServices(ctx, parse(z.array(z.string()), ids)));
}

export async function setServiceStatus(id: string, statut: PublicationStatus) {
  return orgAction({}, (r, ctx) => r.setServiceStatus(ctx, id, parse(z.enum(["brouillon", "publie"]), statut)));
>>>>>>> 939f032 (First Commit)
}

/* --------------------------------- Démarches --------------------------------- */

<<<<<<< HEAD
export async function saveProcedure(id: string | null, input: ProcedureRequest) {
  return orgAction({}, (r, ctx) => {
    const data = parse(procedureInput, input);
    return id ? r.updateProcedure(ctx, parse(idSchema, id), data) : r.createProcedure(ctx, data);
=======
const integerOrNull = z.number().int("Nombre entier attendu").min(0, "Valeur positive attendue").nullable();

const procedureSchema = z.object({
  serviceId: z.string().min(1, "Choisissez un service"),
  title: text(255).min(1, "Le titre est obligatoire"),
  description: text(5000).min(1, "La description est obligatoire"),
  conditions: text(5000).min(1, "Ajoutez au moins une condition"),
  cost: integerOrNull,
  costCurrency: z.string().length(3),
  place: optionalText(500),
  additionalInfo: optionalText(5000),
  processingDays: integerOrNull,
  requiredDocuments: z.array(z.object({ label: text(255).min(1, "Pièce requise sans libellé"), displayOrder: z.number().int() })),
});

export async function saveProcedure(id: string | null, input: ProcedureRequest) {
  return orgAction({}, (r, ctx) => {
    const data = parse(procedureSchema, input);
    return id ? r.updateProcedure(ctx, id, data) : r.createProcedure(ctx, data);
>>>>>>> 939f032 (First Commit)
  });
}

export async function setProcedureActive(id: string, active: boolean) {
<<<<<<< HEAD
  return orgAction({}, (r, ctx) => r.setProcedureActive(ctx, parse(idSchema, id), parse(bool, active)));
}

export async function deleteProcedure(id: string) {
  return orgAction({}, (r, ctx) => r.deleteProcedure(ctx, parse(idSchema, id)));
}

/* ---------------------------------- Bornes ---------------------------------- */

export async function setBorneStatus(id: string, status: BorneStatus) {
  return orgAction({ superAdminOnly: true }, (r, ctx) => r.setBorneStatus(ctx, parse(idSchema, id), parse(borneStatus, status)));
=======
  return orgAction({}, (r, ctx) => r.setProcedureActive(ctx, id, active));
}

export async function deleteProcedure(id: string) {
  return orgAction({}, (r, ctx) => r.deleteProcedure(ctx, id));
>>>>>>> 939f032 (First Commit)
}
