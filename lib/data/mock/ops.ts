import "server-only";
import type { Borne, BorneRequest, Form, FormRequest, Organization, Plan, PlanRequest, ServiceRequest } from "@/lib/api/contract";
import { ApiError } from "@/lib/api/errors";
import type { OrgCtx, Repository } from "../repository";
import { now, orgFor, scenario, store, uuid, type OrgData } from "./store";

/**
 * Backend fictif : reproduit les règles du backend réel pour exercer l'interface
 * (403 organisation suspendue, 404 hors périmètre, 409 quotas / doublons / références, 502 indexation).
 */

const DELAY_MS = 120;
const wait = () => new Promise((resolve) => setTimeout(resolve, DELAY_MS));

async function read<T>(fn: () => T): Promise<T> {
  await wait();
  if (scenario() === "error") throw new ApiError("network", "Backend fictif : scénario « error »");
  return structuredClone(fn());
}

function notFound(what: string): never {
  throw new ApiError("notFound", `${what} introuvable`, 404);
}

function conflict(message: string): never {
  throw new ApiError("conflict", message, 409);
}

function find<T extends { id: string }>(items: T[], id: string, what: string): T {
  return items.find((item) => item.id === id) ?? notFound(what);
}

/** Écriture d'organisation : refusée si l'organisation est suspendue (comme le backend). */
async function write<T>(ctx: OrgCtx, fn: (data: OrgData, org: Organization) => T): Promise<T> {
  await wait();
  const { org, data } = orgFor(ctx.orgKey);
  if (!org.active) throw new ApiError("forbidden", "Organisation suspendue : modification impossible.", 403);
  return structuredClone(fn(data, org));
}

async function platform<T>(fn: () => T): Promise<T> {
  await wait();
  return structuredClone(fn());
}

function stamp<T extends { updatedAt: string }>(item: T, patch: Partial<T>): T {
  Object.assign(item, patch, { updatedAt: now() });
  return item;
}

function limitOf(org: Organization, key: "maxAdmins" | "maxBornes" | "maxAiDocuments"): number | null {
  const plan = store().plans.find((p) => p.id === org.plan?.id);
  return plan?.[key] ?? null;
}

function serviceFields(data: OrgData, input: ServiceRequest) {
  const department = find(data.departments, input.departmentId, "Département");
  return { ...input, departmentId: department.id, departmentName: department.name };
}

function formFields(input: FormRequest) {
  return {
    name: input.name,
    description: input.description,
    sections: input.sections.map((section) => ({
      id: uuid(),
      ...section,
      fields: section.fields.map((field) => ({ id: uuid(), ...field, options: field.options.map((o) => ({ id: uuid(), ...o })) })),
    })),
  };
}

function duplicateFieldNames(input: FormRequest): string | null {
  const names = input.sections.flatMap((s) => s.fields.map((f) => f.name));
  return names.find((name, i) => names.indexOf(name) !== i) ?? null;
}

/** Normalise pour la recherche publique : sans accents, minuscules. */
const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Données de contenu d'une organisation par son identifiant backend (vides si jamais ouverte). */
function dataOf(organizationId: string): OrgData | null {
  return store().orgData[organizationId] ?? null;
}

function activeOrganization(organizationId: string): Organization {
  const org = store().organizations.find((o) => o.id === organizationId);
  if (!org || !org.active) notFound("Organisation");
  return org;
}

function planFields(input: PlanRequest) {
  return { ...input, features: input.features.map((f) => ({ id: uuid(), ...f })) };
}

function borneFields(input: BorneRequest): Omit<Borne, "id" | "createdAt" | "updatedAt"> {
  const s = store();
  find(s.organizations, input.organizationId, "Organisation");
  const department = input.departmentId
    ? Object.values(s.orgData).flatMap((d) => d.departments).find((d) => d.id === input.departmentId)
    : null;
  return { ...input, departmentName: department?.name ?? null };
}

export const mockRepository: Repository = {
  /* ------------------------------ Admin (organisation) ------------------------------ */

  getStatistics: (ctx) =>
    read(() => {
      const { org, data } = orgFor(ctx.orgKey);
      const bornes = store().bornes.filter((b) => b.organizationId === org.id);
      return {
        departmentCount: data.departments.length,
        serviceCount: data.services.length,
        procedureCount: data.procedures.length,
        activeProcedureCount: data.procedures.filter((p) => p.active).length,
        borneActiveCount: bornes.filter((b) => b.status === "ACTIVE").length,
        borneMaintenanceCount: bornes.filter((b) => b.status === "MAINTENANCE").length,
        borneOutOfServiceCount: bornes.filter((b) => b.status === "HORS_SERVICE").length,
        knowledgeDocumentCount: data.documents.length,
        conversationCount: data.conversations,
        messageCount: data.messages,
      };
    }),

  getSubscription: (ctx) =>
    read(() => {
      const { org, data } = orgFor(ctx.orgKey);
      if (!org.active) throw new ApiError("forbidden", "Organisation suspendue.", 403);
      const plan = find(store().plans, org.plan?.id ?? "", "Plan");
      return { subscriptionId: data.subscription.id, startDate: data.subscription.startDate, status: data.subscription.status, plan };
    }),

  listDepartments: (ctx) => read(() => orgFor(ctx.orgKey).data.departments),
  createDepartment: (ctx, input) =>
    write(ctx, (data, org) => {
      if (data.departments.some((d) => d.name.toLowerCase() === input.name.toLowerCase())) conflict("Un département porte déjà ce nom.");
      const department = { id: uuid(), organizationId: org.id, ...input, active: true, createdAt: now(), updatedAt: now() };
      data.departments.push(department);
      return department;
    }),
  updateDepartment: (ctx, id, input) =>
    write(ctx, (data) => {
      const department = stamp(find(data.departments, id, "Département"), input);
      data.services.filter((s) => s.departmentId === id).forEach((s) => (s.departmentName = department.name));
      return department;
    }),
  deleteDepartment: (ctx, id) =>
    write(ctx, (data) => {
      find(data.departments, id, "Département");
      if (data.services.some((s) => s.departmentId === id)) conflict("Ce département contient encore des services.");
      data.departments = data.departments.filter((d) => d.id !== id);
    }),
  setDepartmentActive: (ctx, id, active) => write(ctx, (data) => stamp(find(data.departments, id, "Département"), { active })),

  listServices: (ctx, filter) =>
    read(() => orgFor(ctx.orgKey).data.services.filter((s) => !filter?.departmentId || s.departmentId === filter.departmentId)),
  getService: (ctx, id) => read(() => find(orgFor(ctx.orgKey).data.services, id, "Service")),
  createService: (ctx, input) =>
    write(ctx, (data) => {
      const service = { id: uuid(), ...serviceFields(data, input), active: false, createdAt: now(), updatedAt: now() };
      data.services.push(service);
      return service;
    }),
  updateService: (ctx, id, input) =>
    write(ctx, (data) => {
      const service = stamp(find(data.services, id, "Service"), serviceFields(data, input));
      data.procedures.filter((p) => p.serviceId === id).forEach((p) => (p.serviceName = service.name));
      return service;
    }),
  deleteService: (ctx, id) =>
    write(ctx, (data) => {
      find(data.services, id, "Service");
      if (data.procedures.some((p) => p.serviceId === id)) conflict("Ce service contient encore des démarches.");
      data.services = data.services.filter((s) => s.id !== id);
    }),
  setServiceActive: (ctx, id, active) => write(ctx, (data) => stamp(find(data.services, id, "Service"), { active })),

  listProcedures: (ctx, filter) =>
    read(() =>
      orgFor(ctx.orgKey).data.procedures.filter(
        (p) =>
          (!filter?.serviceId || p.serviceId === filter.serviceId) &&
          (filter?.active === undefined || p.active === filter.active) &&
          (!filter?.q || p.title.toLowerCase().includes(filter.q.toLowerCase())),
      ),
    ),
  getProcedure: (ctx, id) => read(() => find(orgFor(ctx.orgKey).data.procedures, id, "Démarche")),
  createProcedure: (ctx, input) =>
    write(ctx, (data, org) => {
      const service = find(data.services, input.serviceId, "Service");
      const procedure = {
        id: uuid(),
        organizationId: org.id,
        ...input,
        serviceName: service.name,
        active: false,
        requiredDocuments: input.requiredDocuments.map((d) => ({ id: uuid(), ...d })),
        createdAt: now(),
        updatedAt: now(),
      };
      data.procedures.push(procedure);
      return procedure;
    }),
  updateProcedure: (ctx, id, input) =>
    write(ctx, (data) => {
      const service = find(data.services, input.serviceId, "Service");
      return stamp(find(data.procedures, id, "Démarche"), {
        ...input,
        serviceName: service.name,
        requiredDocuments: input.requiredDocuments.map((d) => ({ id: uuid(), ...d })),
      });
    }),
  deleteProcedure: (ctx, id) =>
    write(ctx, (data) => {
      find(data.procedures, id, "Démarche");
      data.procedures = data.procedures.filter((p) => p.id !== id);
    }),
  setProcedureActive: (ctx, id, active) => write(ctx, (data) => stamp(find(data.procedures, id, "Démarche"), { active })),

  listDocuments: (ctx, filter) =>
    read(() =>
      orgFor(ctx.orgKey).data.documents.filter(
        (d) =>
          (!filter?.q || d.title.toLowerCase().includes(filter.q.toLowerCase())) &&
          (!filter?.category || d.category === filter.category),
      ),
    ),
  createTextDocument: (ctx, input) =>
    write(ctx, (data, org) => addDocument(data, org, input.title, input.source, input.category, new TextEncoder().encode(input.content).length)),
  uploadDocument: (ctx, meta, file) =>
    write(ctx, (data, org) => addDocument(data, org, meta.title, meta.source, meta.category, file.size)),
  updateDocument: (ctx, id, input) => write(ctx, (data) => stamp(find(data.documents, id, "Document"), input)),
  deleteDocument: (ctx, id) =>
    write(ctx, (data) => {
      find(data.documents, id, "Document");
      data.documents = data.documents.filter((d) => d.id !== id);
    }),
  setDocumentActive: (ctx, id, active) => write(ctx, (data) => stamp(find(data.documents, id, "Document"), { active })),

  getForm: (ctx, procedureId) =>
    read(() => {
      const { data } = orgFor(ctx.orgKey);
      find(data.procedures, procedureId, "Démarche");
      return data.forms[procedureId] ?? null;
    }),
  createForm: (ctx, procedureId, input) =>
    write(ctx, (data) => {
      find(data.procedures, procedureId, "Démarche");
      if (data.forms[procedureId]) conflict("Cette démarche a déjà un formulaire.");
      const duplicate = duplicateFieldNames(input);
      if (duplicate) conflict(`Deux champs portent le même nom technique : « ${duplicate} ».`);
      const form: Form = { id: uuid(), procedureId, ...formFields(input), active: false, createdAt: now(), updatedAt: now() };
      data.forms[procedureId] = form;
      return form;
    }),
  replaceForm: (ctx, procedureId, input) =>
    write(ctx, (data) => {
      const form = data.forms[procedureId] ?? notFound("Formulaire");
      const duplicate = duplicateFieldNames(input);
      if (duplicate) conflict(`Deux champs portent le même nom technique : « ${duplicate} ».`);
      return stamp(form, formFields(input));
    }),
  deleteForm: (ctx, procedureId) =>
    write(ctx, (data) => {
      if (!data.forms[procedureId]) notFound("Formulaire");
      delete data.forms[procedureId];
    }),
  setFormActive: (ctx, procedureId, active) => write(ctx, (data) => stamp(data.forms[procedureId] ?? notFound("Formulaire"), { active })),

  listBornes: (ctx) => read(() => store().bornes.filter((b) => b.organizationId === orgFor(ctx.orgKey).org.id)),
  setBorneStatus: (ctx, id, status) =>
    write(ctx, (_data, org) => {
      const borne = find(store().bornes.filter((b) => b.organizationId === org.id), id, "Borne");
      return stamp(borne, { status });
    }),

  /* ------------------------------------ Profil ------------------------------------ */

  getMe: (identity) =>
    read(() => {
      const org = identity.orgKey ? orgFor(identity.orgKey).org : null;
      const [firstName, ...rest] = identity.name.split(" ");
      return {
        clerkUserId: identity.userId,
        email: identity.email,
        firstName: identity.firstName ?? firstName ?? null,
        lastName: rest.join(" ") || null,
        roles: [...(identity.isPlatformAdmin ? ["SUPER_ADMIN"] : []), ...(org ? ["ADMIN_ORGANISATION"] : [])],
        clerkOrgId: identity.orgKey,
        organizationId: org?.id ?? null,
        organizationName: org?.name ?? null,
        mirrored: org !== null,
      };
    }),

  /* ------------------------------------ Public ------------------------------------ */

  getPublicOrganization: (organizationId) =>
    read(() => {
      const { id, name, type, address, phone, email, logoUrl, openingHours } = activeOrganization(organizationId);
      return { id, name, type, address, phone, email, logoUrl, openingHours };
    }),
  searchPublicOrganizations: (q) =>
    read(() => {
      const words = fold(q).split(/\s+/).filter((w) => w.length > 0 && !["de", "la", "le", "les", "du", "des", "l"].includes(w));
      if (q.trim().length < 2) throw new ApiError("validation", "Tapez au moins 2 caractères.", 400);
      return store()
        .organizations.filter((o) => o.active)
        .filter((o) => {
          const haystack = fold(`${o.name} ${o.address ?? ""} ${o.type ?? ""}`).split(/[^a-z0-9]+/);
          return words.every((w) => haystack.some((h) => h.startsWith(w)));
        })
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(({ id, name, type, address }) => ({ id, name, type, address }));
    }),
  listPublicServices: (organizationId) =>
    read(() => {
      activeOrganization(organizationId);
      return (dataOf(organizationId)?.services ?? [])
        .filter((s) => s.active)
        .map(({ id, name, description, location, phone, openingHours, departmentId, departmentName }) => ({
          id,
          name,
          description,
          location,
          phone,
          openingHours,
          departmentId,
          departmentName,
        }));
    }),
  listPublicProcedures: (organizationId, q) =>
    read(() => {
      activeOrganization(organizationId);
      const data = dataOf(organizationId);
      const activeServices = new Set((data?.services ?? []).filter((s) => s.active).map((s) => s.id));
      return (data?.procedures ?? []).filter(
        (p) => p.active && activeServices.has(p.serviceId) && (!q || fold(`${p.title} ${p.description ?? ""}`).includes(fold(q))),
      );
    }),
  getPublicProcedure: (id) =>
    read(() => {
      for (const data of Object.values(store().orgData)) {
        const procedure = data.procedures.find((p) => p.id === id && p.active);
        if (procedure) return procedure;
      }
      return notFound("Démarche");
    }),
  getPublicForm: (procedureId) =>
    read(() => {
      for (const data of Object.values(store().orgData)) {
        const procedure = data.procedures.find((p) => p.id === procedureId);
        if (procedure) {
          const form = data.forms[procedureId];
          return procedure.active && form?.active ? form : null;
        }
      }
      return null;
    }),
  getPublicBorne: (borneId) =>
    read(() => {
      const borne = store().bornes.find((b) => b.id === borneId);
      if (!borne || borne.status === "HORS_SERVICE") notFound("Borne");
      const org = store().organizations.find((o) => o.id === borne.organizationId);
      if (!org?.active) notFound("Borne");
      const { id, name, type, address, phone, email, logoUrl, openingHours } = org;
      return {
        id: borne.id,
        identifier: borne.identifier,
        location: borne.location,
        status: borne.status,
        organization: { id, name, type, address, phone, email, logoUrl, openingHours },
      };
    }),

  /* ------------------------------ SuperAdmin (plateforme) ------------------------------ */

  listOrganizations: () => read(() => [...store().organizations].sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
  getOrganization: (id) => read(() => find(store().organizations, id, "Organisation")),
  createOrganization: ({ planId, adminEmail, ...input }) =>
    platform(() => {
      const s = store();
      const plan = find(s.plans, planId, "Plan");
      if (!plan.active) conflict("Ce plan n’est plus proposé.");
      if (s.organizations.some((o) => o.name.toLowerCase() === input.name.toLowerCase())) conflict("Une organisation porte déjà ce nom.");
      const org: Organization = {
        id: uuid(),
        clerkOrgId: `org_mock_${s.seq++}`,
        ...input,
        plan: { id: plan.id, name: plan.name },
        active: true,
        createdAt: now(),
        updatedAt: now(),
      };
      s.organizations.push(org);
      s.members[org.id] = [{ clerkUserId: `user_invited_${s.seq++}`, firstName: null, lastName: null, identifier: adminEmail, role: "org:super_admin" }];
      return org;
    }),
  updateOrganization: (id, input) => platform(() => stamp(find(store().organizations, id, "Organisation"), input)),
  changeOrganizationPlan: (id, planId) =>
    platform(() => {
      const plan = find(store().plans, planId, "Plan");
      return stamp(find(store().organizations, id, "Organisation"), { plan: { id: plan.id, name: plan.name } });
    }),
  setOrganizationActive: (id, active) => platform(() => stamp(find(store().organizations, id, "Organisation"), { active })),
  listMembers: (id) =>
    read(() => {
      find(store().organizations, id, "Organisation");
      return store().members[id] ?? [];
    }),
  inviteAdmin: (id, email) =>
    platform(() => {
      const s = store();
      const org = find(s.organizations, id, "Organisation");
      const members = (s.members[id] ??= []);
      if (members.some((m) => m.identifier?.toLowerCase() === email.toLowerCase())) conflict("Cette personne est déjà membre.");
      const limit = limitOf(org, "maxAdmins");
      if (limit !== null && members.length >= limit) conflict(`Limite du plan atteinte : ${limit} administrateurs maximum.`);
      members.push({ clerkUserId: `user_invited_${s.seq++}`, firstName: null, lastName: null, identifier: email, role: "org:admin" });
    }),
  removeAdmin: (id, clerkUserId) =>
    platform(() => {
      const s = store();
      find(s.organizations, id, "Organisation");
      const members = s.members[id] ?? [];
      if (!members.some((m) => m.clerkUserId === clerkUserId)) notFound("Membre");
      if (members.length === 1) conflict("Impossible de retirer le dernier administrateur.");
      s.members[id] = members.filter((m) => m.clerkUserId !== clerkUserId);
    }),

  listPlans: (activeOnly) => read(() => store().plans.filter((p) => !activeOnly || p.active)),
  createPlan: (input) =>
    platform(() => {
      const s = store();
      if (s.plans.some((p) => p.name.toLowerCase() === input.name.toLowerCase())) conflict("Un plan porte déjà ce nom.");
      const plan: Plan = { id: uuid(), ...planFields(input), active: true, createdAt: now(), updatedAt: now() };
      s.plans.push(plan);
      return plan;
    }),
  updatePlan: (id, input) =>
    platform(() => {
      const plan = stamp(find(store().plans, id, "Plan"), planFields(input));
      store().organizations.filter((o) => o.plan?.id === id).forEach((o) => (o.plan = { id, name: plan.name }));
      return plan;
    }),
  deletePlan: (id) =>
    platform(() => {
      const s = store();
      find(s.plans, id, "Plan");
      if (s.organizations.some((o) => o.plan?.id === id)) conflict("Ce plan est encore utilisé par des organisations.");
      s.plans = s.plans.filter((p) => p.id !== id);
    }),
  setPlanActive: (id, active) => platform(() => stamp(find(store().plans, id, "Plan"), { active })),

  listAllBornes: (organizationId) => read(() => store().bornes.filter((b) => !organizationId || b.organizationId === organizationId)),
  createBorne: (input) =>
    platform(() => {
      const s = store();
      const org = find(s.organizations, input.organizationId, "Organisation");
      if (s.bornes.some((b) => b.identifier.toLowerCase() === input.identifier.toLowerCase())) conflict("Cet identifiant de borne existe déjà.");
      const limit = limitOf(org, "maxBornes");
      if (limit !== null && s.bornes.filter((b) => b.organizationId === org.id).length >= limit)
        conflict(`Limite du plan atteinte : ${limit} borne${limit > 1 ? "s" : ""} maximum.`);
      const borne: Borne = { id: uuid(), ...borneFields(input), createdAt: now(), updatedAt: now() };
      s.bornes.push(borne);
      return borne;
    }),
  updateBorne: (id, input) => platform(() => stamp(find(store().bornes, id, "Borne"), borneFields(input))),
  deleteBorne: (id) =>
    platform(() => {
      const s = store();
      find(s.bornes, id, "Borne");
      s.bornes = s.bornes.filter((b) => b.id !== id);
    }),
  setAnyBorneStatus: (id, status) => platform(() => stamp(find(store().bornes, id, "Borne"), { status })),
};

function addDocument(data: OrgData, org: Organization, title: string, source: string | null, category: string | null, size: number) {
  const limit = limitOf(org, "maxAiDocuments");
  if (limit !== null && data.documents.length >= limit) conflict(`Limite du plan atteinte : ${limit} documents maximum.`);
  // Simule un échec d'indexation synchrone du service IA (502) pour tester le parcours « Réessayer ».
  if (/erreur/i.test(title)) throw new ApiError("upstream", "Le service IA n’a pas pu indexer ce document.", 502);
  const document = {
    id: uuid(),
    organizationId: org.id,
    title,
    fileUrl: null,
    fileSizeBytes: size,
    source,
    category,
    active: true,
    sourceProcedureId: null,
    createdAt: now(),
    updatedAt: now(),
  };
  data.documents.unshift(document);
  return document;
}
