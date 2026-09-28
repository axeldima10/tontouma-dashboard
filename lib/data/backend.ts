import "server-only";
import { z } from "zod";
import { ApiError } from "@/lib/api/errors";
import { apiFetch } from "@/lib/api/server";
import type { Repository } from "./repository";

/**
 * Implémentation vers le backend réel.
 * - Démarches : endpoints de l'export OpenAPI live (`/api/v1/admin/procedures`).
 * - Autres domaines : sections de l'export live encore tronquées → « contrat en attente ».
 *   Rien n'est deviné. TODO(contract) : brancher chaque domaine dès que l'export complet est fourni.
 */

const API = "/api/v1";

const requiredDocumentSchema = z.object({ id: z.string(), label: z.string(), displayOrder: z.number() });

const procedureSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  serviceId: z.string(),
  serviceName: z.string().nullable().default(""),
  title: z.string(),
  description: z.string().nullable().default(""),
  conditions: z.string().nullable().default(""),
  cost: z.number().int().nullable(),
  costCurrency: z.string().nullable().default("XOF"),
  place: z.string().nullable(),
  additionalInfo: z.string().nullable(),
  processingDays: z.number().int().nullable(),
  active: z.boolean(),
  requiredDocuments: z.array(requiredDocumentSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const pageSchema = <T extends z.ZodType>(item: T) =>
  z.object({ content: z.array(item), page: z.number(), size: z.number(), totalElements: z.number(), totalPages: z.number() });

type ProcedureDto = z.infer<typeof procedureSchema>;

function toProcedure(dto: ProcedureDto) {
  return {
    ...dto,
    serviceName: dto.serviceName ?? "",
    description: dto.description ?? "",
    conditions: dto.conditions ?? "",
    costCurrency: dto.costCurrency ?? "XOF",
  };
}

function pending(area: string): never {
  throw new ApiError("contractPending", `Endpoints « ${area} » absents de l’export live fourni`);
}

export const backendRepository: Repository = {
  getAccessStatus: () => pending("Abonnement"),
  getOrganization: () => pending("Organisation"),
  updateOrganization: () => pending("Organisation"),

  listDepartements: () => pending("Départements"),
  createDepartement: () => pending("Départements"),
  updateDepartement: () => pending("Départements"),
  deleteDepartement: () => pending("Départements"),
  reorderDepartements: () => pending("Départements"),

  listServices: () => pending("Services"),
  getService: () => pending("Services"),
  createService: () => pending("Services"),
  updateService: () => pending("Services"),
  deleteService: () => pending("Services"),
  reorderServices: () => pending("Services"),
  setServiceStatus: () => pending("Services"),

  async listProcedures(_ctx, filter) {
    const params = new URLSearchParams({ size: "200" });
    if (filter?.serviceId) params.set("serviceId", filter.serviceId);
    const page = await apiFetch(`${API}/admin/procedures?${params}`, { schema: pageSchema(procedureSchema) });
    return page.content.map(toProcedure);
  },

  async getProcedure(_ctx, id) {
    return toProcedure(await apiFetch(`${API}/admin/procedures/${encodeURIComponent(id)}`, { schema: procedureSchema }));
  },

  async createProcedure(_ctx, input) {
    return toProcedure(await apiFetch(`${API}/admin/procedures`, { method: "POST", body: input, schema: procedureSchema }));
  },

  async updateProcedure(_ctx, id, input) {
    return toProcedure(
      await apiFetch(`${API}/admin/procedures/${encodeURIComponent(id)}`, { method: "PUT", body: input, schema: procedureSchema }),
    );
  },

  async deleteProcedure(_ctx, id) {
    await apiFetch(`${API}/admin/procedures/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  async setProcedureActive(_ctx, id, active) {
    return toProcedure(
      await apiFetch(`${API}/admin/procedures/${encodeURIComponent(id)}/status`, {
        method: "PUT",
        body: { active },
        schema: procedureSchema,
      }),
    );
  },

  listDocuments: () => pending("Base de connaissances"),
  requestDocumentUpload: () => pending("Base de connaissances"),
  confirmDocument: () => pending("Base de connaissances"),
  retryDocument: () => pending("Base de connaissances"),
  deleteDocument: () => pending("Base de connaissances"),

  listPlans: () => pending("Plans du bâtiment"),
  getPlan: () => pending("Plans du bâtiment"),
  requestPlanUpload: () => pending("Plans du bâtiment"),
  createPlan: () => pending("Plans du bâtiment"),
  renamePlan: () => pending("Plans du bâtiment"),
  deletePlan: () => pending("Plans du bâtiment"),
  savePosition: () => pending("Plans du bâtiment"),
  deletePosition: () => pending("Plans du bâtiment"),

  listBornes: () => pending("Bornes"),
  createBorne: () => pending("Bornes"),
  updateBorne: () => pending("Bornes"),
  deleteBorne: () => pending("Bornes"),

  listQRCodes: () => pending("QR codes"),
  createQRCode: () => pending("QR codes"),
  setQRCodeActive: () => pending("QR codes"),
  deleteQRCode: () => pending("QR codes"),

  listMembers: () => pending("Membres"),
  listInvitations: () => pending("Membres"),
  invite: () => pending("Membres"),
  revokeInvitation: () => pending("Membres"),
  changeMemberRole: () => pending("Membres"),
  removeMember: () => pending("Membres"),

  getSubscription: () => pending("Abonnement"),

  listOrganizations: () => pending("SuperAdmin · Organisations"),
  getOrganizationById: () => pending("SuperAdmin · Organisations"),
  setOrganizationStatus: () => pending("SuperAdmin · Organisations"),
  listDemandes: () => pending("Demandes d’accès"),
  decideDemande: () => pending("Demandes d’accès"),
  listPlansAbonnement: () => pending("SuperAdmin · Plans"),
  createPlanAbonnement: () => pending("SuperAdmin · Plans"),
  updatePlanAbonnement: () => pending("SuperAdmin · Plans"),
  deletePlanAbonnement: () => pending("SuperAdmin · Plans"),
  listAllBornes: () => pending("SuperAdmin · Bornes"),
};
