"use server";

import { z } from "zod";
import { ApiError } from "@/lib/api/errors";
import type { BorneStatus, MemberRole, OrganizationInput, QRCodeType } from "@/lib/data/types";
import { orgAction } from "./run";

/* Gestion : bornes, QR codes, membres, paramètres — réservée au super administrateur. */

const SUPER = { superAdminOnly: true };

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new ApiError("validation", result.error.issues[0]?.message ?? "Données invalides", 400);
  return result.data;
}

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable();

/* --------------------------------- Bornes --------------------------------- */

const borneSchema = z.object({ nom: z.string().trim().min(1, "Le nom est obligatoire").max(120), localisation: nullableText(200) });

export async function createBorne(input: { nom: string; localisation: string | null }) {
  return orgAction(SUPER, (r, ctx) => r.createBorne(ctx, parse(borneSchema, input)));
}

export async function updateBorne(id: string, input: { nom: string; localisation: string | null; statut: BorneStatus }) {
  return orgAction(SUPER, (r, ctx) =>
    r.updateBorne(ctx, id, parse(borneSchema.extend({ statut: z.enum(["active", "inactive", "maintenance"]) }), input)),
  );
}

export async function deleteBorne(id: string) {
  return orgAction(SUPER, (r, ctx) => r.deleteBorne(ctx, id));
}

/* -------------------------------- QR codes -------------------------------- */

export async function createQRCode(input: { type: QRCodeType; cible_id: string | null }) {
  return orgAction(SUPER, (r, ctx) =>
    r.createQRCode(
      ctx,
      parse(
        z
          .object({ type: z.enum(["organisation", "service", "demarche"]), cible_id: z.string().nullable() })
          .refine((v) => v.type === "organisation" || v.cible_id, "Choisissez la cible du QR code"),
        input,
      ),
    ),
  );
}

export async function setQRCodeActive(id: string, actif: boolean) {
  return orgAction(SUPER, (r, ctx) => r.setQRCodeActive(ctx, id, actif));
}

export async function deleteQRCode(id: string) {
  return orgAction(SUPER, (r, ctx) => r.deleteQRCode(ctx, id));
}

/* --------------------------------- Membres --------------------------------- */

const roleSchema = z.enum(["super_admin", "admin"]);

/** L'invitation passe par le backend, qui vérifie la limite du plan avant d'appeler Clerk. */
export async function inviteMember(input: { email: string; role: MemberRole }) {
  return orgAction(SUPER, (r, ctx) =>
    r.invite(ctx, parse(z.object({ email: z.string().trim().email("Adresse email invalide"), role: roleSchema }), input)),
  );
}

export async function revokeInvitation(id: string) {
  return orgAction(SUPER, (r, ctx) => r.revokeInvitation(ctx, id));
}

export async function changeMemberRole(memberId: string, role: MemberRole) {
  return orgAction(SUPER, (r, ctx) => r.changeMemberRole(ctx, memberId, parse(roleSchema, role)));
}

export async function removeMember(memberId: string) {
  return orgAction(SUPER, (r, ctx) => r.removeMember(ctx, memberId));
}

/* -------------------------------- Organisation -------------------------------- */

const organizationSchema = z.object({
  nom: z.string().trim().min(1, "Le nom est obligatoire").max(200),
  type: z.string().trim().min(1, "Le type est obligatoire").max(80),
  description: nullableText(2000),
  adresse: nullableText(300),
  telephone: nullableText(40),
  email: nullableText(160).refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Adresse email invalide"),
  siteWeb: nullableText(300).refine((v) => v === null || /^https?:\/\/\S+$/.test(v), "L’adresse doit commencer par https://"),
});

export async function updateOrganization(input: OrganizationInput) {
  return orgAction(SUPER, (r, ctx) => r.updateOrganization(ctx, parse(organizationSchema, input)));
}
