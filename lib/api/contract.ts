import { z } from "zod";

/**
 * Contrat de l'API backend — recopié champ pour champ depuis docs/API-FRONT.md
 * (export OpenAPI live, commit 54026bb). Aucun champ n'est renommé ni inventé.
 * Les champs optionnels côté backend sont tolérés `null` / absents.
 */

const str = z.string().nullish().transform((v) => v ?? null);
const int = z.number().int().nullish().transform((v) => v ?? null);
/** Les réponses de création / modification du backend omettent parfois les dates : on retombe sur l'heure de la réponse. */
const timestamp = z.string().nullish().transform((v) => v ?? new Date().toISOString());

/* --------------------------------- Communs --------------------------------- */

export const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export const openingHoursSchema = z.object({
  dayOfWeek: z.enum(DAYS_OF_WEEK),
  opensAt: z.string(),
  closesAt: z.string(),
});
export type OpeningHours = z.infer<typeof openingHoursSchema>;

export const pageSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    content: z.array(item),
    page: z.number(),
    size: z.number(),
    totalElements: z.number(),
    totalPages: z.number(),
  });

export const apiErrorSchema = z.object({
  timestamp: z.string().nullish(),
  status: z.number().nullish(),
  error: z.string().nullish(),
  message: z.string().nullish(),
  path: z.string().nullish(),
  violations: z.array(z.object({ field: z.string(), message: z.string() })).nullish(),
});

/* -------------------------------- Démarches -------------------------------- */

export const requiredDocumentSchema = z.object({
  id: z.string(),
  label: z.string(),
  displayOrder: z.number().int(),
});

export const procedureSchema = z.object({
  id: z.string(),
  organizationId: str,
  serviceId: z.string(),
  serviceName: str,
  title: z.string(),
  description: str,
  conditions: str,
  cost: int,
  costCurrency: str,
  place: str,
  additionalInfo: str,
  processingDays: int,
  active: z.boolean(),
  requiredDocuments: z.array(requiredDocumentSchema).nullish().transform((v) => v ?? []),
  createdAt: timestamp,
  updatedAt: timestamp,
});
export type Procedure = z.infer<typeof procedureSchema>;

export type ProcedureRequest = {
  serviceId: string;
  title: string;
  description: string;
  conditions: string;
  cost: number | null;
  costCurrency: string;
  place: string | null;
  additionalInfo: string | null;
  processingDays: number | null;
  requiredDocuments: { label: string; displayOrder: number }[];
};

/* ------------------------------ Départements ------------------------------- */

export const departmentSchema = z.object({
  id: z.string(),
  organizationId: str,
  name: z.string(),
  description: str,
  active: z.boolean(),
  createdAt: timestamp,
  updatedAt: timestamp,
});
export type Department = z.infer<typeof departmentSchema>;
export type DepartmentRequest = { name: string; description: string | null };

/* --------------------------------- Services -------------------------------- */

export const serviceSchema = z.object({
  id: z.string(),
  departmentId: str,
  departmentName: str,
  name: z.string(),
  description: str,
  location: str,
  phone: str,
  openingHours: z.array(openingHoursSchema).nullish().transform((v) => v ?? []),
  active: z.boolean(),
  createdAt: timestamp,
  updatedAt: timestamp,
});
export type Service = z.infer<typeof serviceSchema>;

export type ServiceRequest = {
  departmentId: string;
  name: string;
  description: string | null;
  location: string | null;
  phone: string | null;
  openingHours: OpeningHours[];
};

/* ------------------------- Base de connaissances IA ------------------------ */

export const documentSchema = z.object({
  id: z.string(),
  organizationId: str,
  title: z.string(),
  fileUrl: str,
  fileSizeBytes: int,
  source: str,
  category: str,
  active: z.boolean(),
  sourceProcedureId: str,
  createdAt: timestamp,
  updatedAt: timestamp,
});
export type KnowledgeDocument = z.infer<typeof documentSchema>;

export type DocumentTextRequest = { title: string; content: string; source: string | null; category: string | null };
export type DocumentUpdateRequest = { title: string; source: string | null; category: string | null };

/* ---------------------------------- Bornes --------------------------------- */

export const BORNE_STATUSES = ["ACTIVE", "MAINTENANCE", "HORS_SERVICE"] as const;
export type BorneStatus = (typeof BORNE_STATUSES)[number];

export const borneSchema = z.object({
  id: z.string(),
  organizationId: str,
  departmentId: str,
  departmentName: str,
  identifier: z.string(),
  location: str,
  status: z.enum(BORNE_STATUSES),
  createdAt: timestamp,
  updatedAt: timestamp,
});
export type Borne = z.infer<typeof borneSchema>;

export type BorneRequest = {
  organizationId: string;
  departmentId: string | null;
  identifier: string;
  location: string | null;
  status: BorneStatus;
};

/* ------------------------------ Statistiques ------------------------------- */

export const statisticsSchema = z.object({
  departmentCount: z.number(),
  serviceCount: z.number(),
  procedureCount: z.number(),
  activeProcedureCount: z.number(),
  borneActiveCount: z.number(),
  borneMaintenanceCount: z.number(),
  borneOutOfServiceCount: z.number(),
  knowledgeDocumentCount: z.number(),
  conversationCount: z.number(),
  messageCount: z.number(),
});
export type Statistics = z.infer<typeof statisticsSchema>;

/* ---------------------------------- Plans ---------------------------------- */

export const BILLING_PERIODS = ["MOIS", "TRIMESTRE", "ANNEE"] as const;
export type BillingPeriod = (typeof BILLING_PERIODS)[number];

export const planSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: str,
  amount: int,
  currency: str,
  billingPeriod: z.enum(BILLING_PERIODS),
  maxAdmins: int,
  maxBornes: int,
  maxAiDocuments: int,
  active: z.boolean(),
  features: z
    .array(z.object({ id: str, label: z.string(), displayOrder: z.number().int() }))
    .nullish()
    .transform((v) => v ?? []),
  createdAt: timestamp,
  updatedAt: timestamp,
});
export type Plan = z.infer<typeof planSchema>;

export type PlanRequest = {
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  billingPeriod: BillingPeriod;
  maxAdmins: number | null;
  maxBornes: number | null;
  maxAiDocuments: number | null;
  features: { label: string; displayOrder: number }[];
};

/* -------------------------------- Abonnement ------------------------------- */

export const SUBSCRIPTION_STATUSES = ["ACTIVE", "REMPLACEE", "ANNULEE"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const subscriptionSchema = z.object({
  subscriptionId: z.string(),
  startDate: z.string(),
  status: z.enum(SUBSCRIPTION_STATUSES),
  plan: planSchema,
});
export type Subscription = z.infer<typeof subscriptionSchema>;

/* ------------------------------ Organisations ------------------------------ */

export const organizationSchema = z.object({
  id: z.string(),
  clerkOrgId: str,
  name: z.string(),
  type: str,
  ninea: str,
  address: str,
  phone: str,
  email: str,
  logoUrl: str,
  openingHours: z.array(openingHoursSchema).nullish().transform((v) => v ?? []),
  plan: z.object({ id: z.string(), name: z.string() }).nullish().transform((v) => v ?? null),
  active: z.boolean(),
  createdAt: timestamp,
  updatedAt: timestamp,
});
export type Organization = z.infer<typeof organizationSchema>;

export type OrganizationUpdateRequest = {
  name: string;
  type: string | null;
  ninea: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  openingHours: OpeningHours[];
};

export type OrganizationCreateRequest = OrganizationUpdateRequest & { planId: string; adminEmail: string };

export const memberSchema = z.object({
  clerkUserId: z.string(),
  firstName: str,
  lastName: str,
  identifier: str,
  role: str,
});
export type Member = z.infer<typeof memberSchema>;

/* ----------------------------------- /me ----------------------------------- */

export const meSchema = z.object({
  clerkUserId: z.string(),
  email: str,
  firstName: str,
  lastName: str,
  roles: z.array(z.string()).nullish().transform((v) => v ?? []),
  clerkOrgId: str,
  organizationId: str,
  organizationName: str,
  mirrored: z.boolean().nullish(),
});
export type Me = z.infer<typeof meSchema>;

/* ------------------------------- Formulaires ------------------------------- */

export const FIELD_TYPES = ["TEXT", "TEXTAREA", "NUMBER", "DATE", "EMAIL", "PHONE", "SELECT", "RADIO", "CHECKBOX"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];
/** Types qui demandent une liste d'options. */
export const CHOICE_TYPES: readonly FieldType[] = ["SELECT", "RADIO", "CHECKBOX"];

const optionSchema = z.object({ id: z.string(), label: z.string(), displayOrder: z.number().int() });

const fieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string(),
  fieldType: z.enum(FIELD_TYPES),
  placeholder: str,
  required: z.boolean().nullish().transform((v) => v ?? false),
  displayOrder: z.number().int(),
  defaultValue: str,
  helpText: str,
  validationRegex: str,
  validationMessage: str,
  options: z.array(optionSchema).nullish().transform((v) => v ?? []),
});

const sectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: str,
  displayOrder: z.number().int(),
  fields: z.array(fieldSchema).nullish().transform((v) => v ?? []),
});

export const formSchema = z.object({
  id: z.string(),
  procedureId: z.string(),
  name: z.string(),
  description: str,
  active: z.boolean(),
  sections: z.array(sectionSchema).nullish().transform((v) => v ?? []),
  createdAt: timestamp,
  updatedAt: timestamp,
});
export type Form = z.infer<typeof formSchema>;
export type FormSection = Form["sections"][number];
export type FormField = FormSection["fields"][number];

export type FormRequest = {
  name: string;
  description: string | null;
  sections: {
    title: string;
    description: string | null;
    displayOrder: number;
    fields: {
      name: string;
      label: string;
      fieldType: FieldType;
      placeholder: string | null;
      required: boolean;
      displayOrder: number;
      defaultValue: string | null;
      helpText: string | null;
      validationRegex: string | null;
      validationMessage: string | null;
      options: { label: string; displayOrder: number }[];
    }[];
  }[];
};

/* ---------------------------- Public (citoyens) ---------------------------- */

export const publicOrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: str,
  address: str,
  phone: str,
  email: str,
  logoUrl: str,
  openingHours: z.array(openingHoursSchema).nullish().transform((v) => v ?? []),
});
export type PublicOrganization = z.infer<typeof publicOrganizationSchema>;

export const organizationCandidateSchema = z.object({ id: z.string(), name: z.string(), type: str, address: str });
export type OrganizationCandidate = z.infer<typeof organizationCandidateSchema>;

export const publicServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: str,
  location: str,
  phone: str,
  openingHours: z.array(openingHoursSchema).nullish().transform((v) => v ?? []),
  departmentId: str,
  departmentName: str,
});
export type PublicService = z.infer<typeof publicServiceSchema>;

export const publicBorneSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  location: str,
  status: z.enum(BORNE_STATUSES),
  organization: publicOrganizationSchema,
});
export type PublicBorne = z.infer<typeof publicBorneSchema>;

/* --------------------------------- Chatbot --------------------------------- */

export const sourceRefSchema = z.object({
  documentId: str,
  title: str,
  category: str,
  relevanceScore: z.number().nullish().transform((v) => v ?? null),
});
export type SourceRef = z.infer<typeof sourceRefSchema>;

export const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["USER", "ASSISTANT"]),
  content: z.string().nullish().transform((v) => v ?? ""),
  confidence: z.number().nullish().transform((v) => v ?? null),
  sources: z.array(sourceRefSchema).nullish().transform((v) => v ?? []),
  audioUrl: str,
  createdAt: timestamp,
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

/**
 * Réponse de `POST /public/conversations`. Le schéma exact n'est pas décrit dans API-FRONT.md :
 * seuls `id` (201) et `disambiguation_required` + `candidates` (200) sont mentionnés. Lecture tolérante.
 */
export const startConversationSchema = z
  .object({
    id: z.string().nullish(),
    status: z.string().nullish(),
    candidates: z.array(organizationCandidateSchema).nullish(),
  })
  .passthrough();
export type StartConversation = z.infer<typeof startConversationSchema>;

export type ChatDone = {
  messageId: string | null;
  confidence: number | null;
  sources: SourceRef[];
  audioUrl: string | null;
  qrCode: string | null;
  memoryReset: boolean;
};
