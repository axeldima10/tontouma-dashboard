"use server";

import { z } from "zod";
import type { FormRequest } from "@/lib/api/contract";
import { orgAction, parse } from "./run";
import { formInput } from "./schemas";

/* Formulaire dynamique d'une démarche (sections → champs → options). */

const idSchema = z.string().min(1);

/** Premier enregistrement : POST ; ensuite : PUT (remplacement complet). */
export async function saveForm(procedureId: string, exists: boolean, input: FormRequest) {
  return orgAction({}, (r, ctx) => {
    const id = parse(idSchema, procedureId);
    const data = parse(formInput, input);
    return exists ? r.replaceForm(ctx, id, data) : r.createForm(ctx, id, data);
  });
}

export async function setFormActive(procedureId: string, active: boolean) {
  return orgAction({}, (r, ctx) => r.setFormActive(ctx, parse(idSchema, procedureId), parse(z.boolean(), active)));
}

export async function deleteForm(procedureId: string) {
  return orgAction({}, (r, ctx) => r.deleteForm(ctx, parse(idSchema, procedureId)));
}
