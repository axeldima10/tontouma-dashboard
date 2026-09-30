import "server-only";
import { z } from "zod";
import {
  borneSchema,
  departmentSchema,
  documentSchema,
  formSchema,
  meSchema,
  memberSchema,
  organizationCandidateSchema,
  publicBorneSchema,
  publicOrganizationSchema,
  publicServiceSchema,
  organizationSchema,
  pageSchema,
  planSchema,
  procedureSchema,
  serviceSchema,
  statisticsSchema,
  subscriptionSchema,
} from "@/lib/api/contract";
import { ApiError } from "@/lib/api/errors";
import { apiFetch, publicFetch } from "@/lib/api/server";
import type { Repository } from "./repository";

/** Implémentation vers le backend réel : un appel par endpoint de docs/API-FRONT.md. */

const id = encodeURIComponent;
/** Appels qui attendent un service en amont (indexation IA synchrone, provisionnement Clerk). */
const SLOW = { timeoutMs: 60_000 };
const PAGE_SIZE = "500";

function query(params: Record<string, string | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== "") search.set(key, String(value));
  const text = search.toString();
  return text ? `?${text}` : "";
}

/** 404 → null (ressource facultative : formulaire pas encore créé). */
async function orNull<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiError && error.kind === "notFound") return null;
    throw error;
  }
}

export const backendRepository: Repository = {
  /* ------------------------------ Admin (organisation) ------------------------------ */

  getStatistics: () => apiFetch("/admin/statistics", { schema: statisticsSchema }),
  getSubscription: () => apiFetch("/admin/subscription", { schema: subscriptionSchema }),

  listDepartments: () => apiFetch("/admin/departments", { schema: z.array(departmentSchema) }),
  createDepartment: (_ctx, input) => apiFetch("/admin/departments", { method: "POST", body: input, schema: departmentSchema }),
  updateDepartment: (_ctx, dep, input) =>
    apiFetch(`/admin/departments/${id(dep)}`, { method: "PUT", body: input, schema: departmentSchema }),
  deleteDepartment: (_ctx, dep) => apiFetch(`/admin/departments/${id(dep)}`, { method: "DELETE" }),
  setDepartmentActive: (_ctx, dep, active) =>
    apiFetch(`/admin/departments/${id(dep)}/status`, { method: "PUT", body: { active }, schema: departmentSchema }),

  listServices: (_ctx, filter) =>
    apiFetch(`/admin/services${query({ departmentId: filter?.departmentId })}`, { schema: z.array(serviceSchema) }),
  getService: (_ctx, svc) => apiFetch(`/admin/services/${id(svc)}`, { schema: serviceSchema }),
  createService: (_ctx, input) => apiFetch("/admin/services", { method: "POST", body: input, schema: serviceSchema }),
  updateService: (_ctx, svc, input) => apiFetch(`/admin/services/${id(svc)}`, { method: "PUT", body: input, schema: serviceSchema }),
  deleteService: (_ctx, svc) => apiFetch(`/admin/services/${id(svc)}`, { method: "DELETE" }),
  setServiceActive: (_ctx, svc, active) =>
    apiFetch(`/admin/services/${id(svc)}/status`, { method: "PUT", body: { active }, schema: serviceSchema }),

  async listProcedures(_ctx, filter) {
    const page = await apiFetch(
      `/admin/procedures${query({ size: PAGE_SIZE, serviceId: filter?.serviceId, active: filter?.active, q: filter?.q })}`,
      { schema: pageSchema(procedureSchema) },
    );
    return page.content;
  },
  getProcedure: (_ctx, proc) => apiFetch(`/admin/procedures/${id(proc)}`, { schema: procedureSchema }),
  createProcedure: (_ctx, input) => apiFetch("/admin/procedures", { method: "POST", body: input, schema: procedureSchema }),
  updateProcedure: (_ctx, proc, input) =>
    apiFetch(`/admin/procedures/${id(proc)}`, { method: "PUT", body: input, schema: procedureSchema }),
  deleteProcedure: (_ctx, proc) => apiFetch(`/admin/procedures/${id(proc)}`, { method: "DELETE" }),
  setProcedureActive: (_ctx, proc, active) =>
    apiFetch(`/admin/procedures/${id(proc)}/status`, { method: "PUT", body: { active }, schema: procedureSchema }),

  async listDocuments(_ctx, filter) {
    const page = await apiFetch(
      `/admin/knowledge-documents${query({ size: PAGE_SIZE, q: filter?.q, category: filter?.category })}`,
      { schema: pageSchema(documentSchema) },
    );
    return page.content;
  },
  createTextDocument: (_ctx, input) =>
    apiFetch("/admin/knowledge-documents", { method: "POST", body: input, schema: documentSchema, ...SLOW }),
  uploadDocument: () => {
    // Les octets ne transitent jamais par Next.js : le navigateur appelle le backend directement.
    throw new ApiError("server", "Téléversement direct navigateur → backend attendu (NEXT_PUBLIC_API_BASE_URL).");
  },
  updateDocument: (_ctx, doc, input) =>
    apiFetch(`/admin/knowledge-documents/${id(doc)}`, { method: "PUT", body: input, schema: documentSchema, ...SLOW }),
  deleteDocument: (_ctx, doc) => apiFetch(`/admin/knowledge-documents/${id(doc)}`, { method: "DELETE", ...SLOW }),
  setDocumentActive: (_ctx, doc, active) =>
    apiFetch(`/admin/knowledge-documents/${id(doc)}/status`, { method: "PUT", body: { active }, schema: documentSchema, ...SLOW }),

  getForm: (_ctx, proc) => orNull(apiFetch(`/admin/procedures/${id(proc)}/form`, { schema: formSchema })),
  createForm: (_ctx, proc, input) => apiFetch(`/admin/procedures/${id(proc)}/form`, { method: "POST", body: input, schema: formSchema }),
  replaceForm: (_ctx, proc, input) => apiFetch(`/admin/procedures/${id(proc)}/form`, { method: "PUT", body: input, schema: formSchema }),
  deleteForm: (_ctx, proc) => apiFetch(`/admin/procedures/${id(proc)}/form`, { method: "DELETE" }),
  setFormActive: (_ctx, proc, active) =>
    apiFetch(`/admin/procedures/${id(proc)}/form/status`, { method: "PUT", body: { active }, schema: formSchema }),

  listBornes: () => apiFetch("/admin/bornes", { schema: z.array(borneSchema) }),
  setBorneStatus: (_ctx, borne, status) =>
    apiFetch(`/admin/bornes/${id(borne)}/status`, { method: "PUT", body: { status }, schema: borneSchema }),

  /* ------------------------------------ Profil ------------------------------------ */

  getMe: () => apiFetch("/me", { schema: meSchema }),

  /* ------------------------------------ Public ------------------------------------ */

  getPublicOrganization: (org) => publicFetch(`/public/organizations/${id(org)}`, { schema: publicOrganizationSchema }),
  async searchPublicOrganizations(q) {
    const page = await publicFetch(`/public/organizations${query({ q, size: "20" })}`, { schema: pageSchema(organizationCandidateSchema) });
    return page.content;
  },
  listPublicServices: (org) => publicFetch(`/public/organizations/${id(org)}/services`, { schema: z.array(publicServiceSchema) }),
  async listPublicProcedures(org, q) {
    const page = await publicFetch(`/public/organizations/${id(org)}/procedures${query({ q, size: PAGE_SIZE })}`, {
      schema: pageSchema(procedureSchema),
    });
    return page.content;
  },
  getPublicProcedure: (proc) => publicFetch(`/public/procedures/${id(proc)}`, { schema: procedureSchema }),
  getPublicForm: (proc) => orNull(publicFetch(`/public/procedures/${id(proc)}/form`, { schema: formSchema })),
  getPublicBorne: (borne) => publicFetch(`/public/bornes/${id(borne)}`, { schema: publicBorneSchema }),

  /* ------------------------------ SuperAdmin (plateforme) ------------------------------ */

  listOrganizations: () => apiFetch("/superadmin/organizations", { schema: z.array(organizationSchema) }),
  getOrganization: (org) => apiFetch(`/superadmin/organizations/${id(org)}`, { schema: organizationSchema }),
  createOrganization: (input) => apiFetch("/superadmin/organizations", { method: "POST", body: input, schema: organizationSchema, ...SLOW }),
  updateOrganization: (org, input) =>
    apiFetch(`/superadmin/organizations/${id(org)}`, { method: "PUT", body: input, schema: organizationSchema }),
  changeOrganizationPlan: (org, planId) =>
    apiFetch(`/superadmin/organizations/${id(org)}/plan`, { method: "PUT", body: { planId }, schema: organizationSchema }),
  setOrganizationActive: (org, active) =>
    apiFetch(`/superadmin/organizations/${id(org)}/status`, { method: "PUT", body: { active }, schema: organizationSchema }),
  listMembers: (org) => apiFetch(`/superadmin/organizations/${id(org)}/members`, { schema: z.array(memberSchema) }),
  inviteAdmin: (org, email) => apiFetch(`/superadmin/organizations/${id(org)}/admins`, { method: "POST", body: { email }, ...SLOW }),
  removeAdmin: (org, user) => apiFetch(`/superadmin/organizations/${id(org)}/admins/${id(user)}`, { method: "DELETE", ...SLOW }),

  listPlans: (activeOnly) => apiFetch(`/superadmin/plans${query({ activeOnly })}`, { schema: z.array(planSchema) }),
  createPlan: (input) => apiFetch("/superadmin/plans", { method: "POST", body: input, schema: planSchema }),
  updatePlan: (plan, input) => apiFetch(`/superadmin/plans/${id(plan)}`, { method: "PUT", body: input, schema: planSchema }),
  deletePlan: (plan) => apiFetch(`/superadmin/plans/${id(plan)}`, { method: "DELETE" }),
  setPlanActive: (plan, active) =>
    apiFetch(`/superadmin/plans/${id(plan)}/status`, { method: "PUT", body: { active }, schema: planSchema }),

  listAllBornes: (organizationId) =>
    apiFetch(`/superadmin/bornes${query({ organizationId })}`, { schema: z.array(borneSchema) }),
  createBorne: (input) => apiFetch("/superadmin/bornes", { method: "POST", body: input, schema: borneSchema }),
  updateBorne: (borne, input) => apiFetch(`/superadmin/bornes/${id(borne)}`, { method: "PUT", body: input, schema: borneSchema }),
  deleteBorne: (borne) => apiFetch(`/superadmin/bornes/${id(borne)}`, { method: "DELETE" }),
  setAnyBorneStatus: (borne, status) =>
    apiFetch(`/superadmin/bornes/${id(borne)}/status`, { method: "PUT", body: { status }, schema: borneSchema }),
};
