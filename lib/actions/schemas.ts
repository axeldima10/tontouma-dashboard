import { z } from "zod";
import { BILLING_PERIODS, BORNE_STATUSES, CHOICE_TYPES, DAYS_OF_WEEK, FIELD_TYPES } from "@/lib/api/contract";

/** Schémas d'entrée des actions, alignés sur les contraintes de docs/API-FRONT.md. */

export const text = (max: number) => z.string().trim().max(max, `${max} caractères maximum`);
export const required = (max: number, message: string) => text(max).min(1, message);
export const optionalText = (max: number) =>
  text(max)
    .nullable()
    .transform((v) => (v ? v : null));

const email = z.string().trim().max(255).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Adresse email invalide");
const optionalEmail = z
  .string()
  .trim()
  .max(255)
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Adresse email invalide");
const positiveIntOrNull = z.number().int("Nombre entier attendu").min(0, "Valeur positive attendue").nullable();
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure au format HH:MM");

export const openingHoursSchema = z
  .array(z.object({ dayOfWeek: z.enum(DAYS_OF_WEEK), opensAt: time, closesAt: time }))
  .refine((rows) => rows.every((r) => r.opensAt < r.closesAt), "L’heure de fermeture doit suivre l’heure d’ouverture");

export const departmentInput = z.object({
  name: required(255, "Le nom est obligatoire"),
  description: optionalText(2000),
});

export const serviceInput = z.object({
  departmentId: z.string().min(1, "Choisissez un département"),
  name: required(255, "Le nom est obligatoire"),
  description: optionalText(5000),
  location: optionalText(500),
  phone: optionalText(20),
  openingHours: openingHoursSchema,
});

export const procedureInput = z.object({
  serviceId: z.string().min(1, "Choisissez un service"),
  title: required(255, "Le titre est obligatoire"),
  description: required(10000, "La description est obligatoire"),
  conditions: required(10000, "Ajoutez au moins une condition"),
  cost: positiveIntOrNull,
  costCurrency: z.literal("XOF"),
  place: optionalText(500),
  additionalInfo: optionalText(10000),
  processingDays: positiveIntOrNull,
  requiredDocuments: z.array(
    z.object({ label: required(255, "Pièce requise sans libellé"), displayOrder: z.number().int().min(0) }),
  ),
});

export const documentTextInput = z.object({
  title: required(500, "Le titre est obligatoire"),
  content: z.string().trim().min(1, "Le texte est vide"),
  source: optionalText(500),
  category: optionalText(100),
});

export const documentUpdateInput = z.object({
  title: required(500, "Le titre est obligatoire"),
  source: optionalText(500),
  category: optionalText(100),
});

export const borneStatus = z.enum(BORNE_STATUSES);

export const borneInput = z.object({
  organizationId: z.string().min(1, "Choisissez une organisation"),
  departmentId: z.string().nullable(),
  identifier: required(100, "L’identifiant est obligatoire"),
  location: optionalText(500),
  status: borneStatus,
});

export const organizationUpdateInput = z.object({
  name: required(255, "Le nom est obligatoire"),
  type: optionalText(30),
  ninea: optionalText(15),
  address: required(2000, "L’adresse est obligatoire"),
  phone: optionalText(20),
  email: optionalEmail,
  logoUrl: optionalText(500).refine((v) => v === null || /^https?:\/\//.test(v), "URL http(s) attendue"),
  openingHours: openingHoursSchema,
});

export const organizationCreateInput = organizationUpdateInput.extend({
  planId: z.string().min(1, "Choisissez un plan"),
  adminEmail: email,
});

export const inviteInput = z.object({ email });

export const planInput = z.object({
  name: required(100, "Le nom est obligatoire"),
  description: optionalText(2000),
  amount: z.number().int("Montant entier en FCFA").min(0, "Montant positif attendu"),
  currency: z.literal("XOF"),
  billingPeriod: z.enum(BILLING_PERIODS),
  maxAdmins: positiveIntOrNull,
  maxBornes: positiveIntOrNull,
  maxAiDocuments: positiveIntOrNull,
  features: z.array(z.object({ label: required(255, "Avantage sans libellé"), displayOrder: z.number().int().min(0) })),
});

export const formInput = z
  .object({
    name: required(255, "Le nom du formulaire est obligatoire"),
    description: optionalText(5000),
    sections: z
      .array(
        z.object({
          title: required(255, "Chaque section a besoin d’un titre"),
          description: optionalText(5000),
          displayOrder: z.number().int().min(0),
          fields: z.array(
            z.object({
              name: required(100, "Nom technique manquant").regex(/^[a-z][a-z0-9_]*$/, "Nom technique : minuscules, chiffres et _ uniquement"),
              label: required(255, "Chaque champ a besoin d’un libellé"),
              fieldType: z.enum(FIELD_TYPES),
              placeholder: optionalText(255),
              required: z.boolean(),
              displayOrder: z.number().int().min(0),
              defaultValue: optionalText(500),
              helpText: optionalText(5000),
              validationRegex: optionalText(500).refine((v) => {
                if (v === null) return true;
                try {
                  new RegExp(v);
                  return true;
                } catch {
                  return false;
                }
              }, "Expression régulière invalide"),
              validationMessage: optionalText(255),
              options: z.array(z.object({ label: required(255, "Option sans libellé"), displayOrder: z.number().int().min(0) })),
            }),
          ),
        }),
      )
      .min(1, "Ajoutez au moins une section"),
  })
  .superRefine((form, ctx) => {
    const names = form.sections.flatMap((s) => s.fields.map((f) => f.name));
    const duplicate = names.find((n, i) => names.indexOf(n) !== i);
    if (duplicate) ctx.addIssue({ code: "custom", message: `Deux champs portent le même nom technique : « ${duplicate} »` });
    for (const section of form.sections)
      for (const field of section.fields)
        if (CHOICE_TYPES.includes(field.fieldType) && field.options.length === 0)
          ctx.addIssue({ code: "custom", message: `Le champ « ${field.label} » a besoin d’au moins une option` });
  });
