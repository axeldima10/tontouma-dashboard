import "server-only";
import { ApiError } from "@/lib/api/errors";
import type { Repository, OrgCtx } from "../repository";
import type {
  AdminOrganizationRow,
  DocumentConnaissance,
  IndexingStatus,
  Organization,
  Procedure,
  ProcedureRequest,
} from "../types";
import { db, DEMO_ORG_KEY, newId, scenario, type StoredDocument } from "./store";

/* -------------------------------------------------------------------------- */
/* Règles communes — imitent celles du backend pour exercer l'interface.       */
/* -------------------------------------------------------------------------- */

const LATENCY_MS = 40;

async function tick() {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
  if (scenario() === "error") throw new ApiError("network", "Backend fictif : panne simulée");
}

function notFound(what: string): never {
  throw new ApiError("notFound", `${what} introuvable`, 404);
}

function conflict(message: string, code: string): never {
  throw new ApiError("conflict", message, 409, code);
}

/** L'organisation de la session. Toute organisation Clerk inconnue retombe sur la démo. */
function org(ctx: OrgCtx): Organization {
  const s = db();
  return s.organizations.find((o) => o.clerk_org_id === ctx.orgKey) ?? s.organizations.find((o) => o.clerk_org_id === DEMO_ORG_KEY)!;
}

function subscriptionOf(orgId: string) {
  const s = db();
  const abonnement = s.abonnements.find((a) => a.organization_id === orgId)!;
  const plan = s.plansAbonnement.find((p) => p.id === abonnement.plan_id)!;
  return { abonnement, plan };
}

/** 403 sur toute écriture si l'organisation est suspendue ou l'abonnement expiré. */
function writable(ctx: OrgCtx): Organization {
  const o = org(ctx);
  if (o.statut === "suspendue") throw new ApiError("forbidden", "Organisation suspendue", 403, "ORG_SUSPENDED");
  if (subscriptionOf(o.id).abonnement.statut !== "active")
    throw new ApiError("forbidden", "Abonnement expiré", 403, "SUBSCRIPTION_EXPIRED");
  return o;
}

function mine<T extends { organization_id?: string; organizationId?: string }>(ctx: OrgCtx, list: T[]): T[] {
  const o = org(ctx);
  return list.filter((item) => (item.organization_id ?? item.organizationId) === o.id);
}

function findMine<T extends { id: string; organization_id?: string; organizationId?: string }>(
  ctx: OrgCtx,
  list: T[],
  id: string,
  what: string,
): T {
  return mine(ctx, list).find((item) => item.id === id) ?? notFound(what);
}

const clone = <T,>(value: T): T => structuredClone(value);

/** L'indexation progresse avec le temps : 4 s en attente, puis 10 s en cours, puis indexé (ou erreur). */
function indexingStatus(doc: StoredDocument): IndexingStatus {
  if (doc.confirmedAt === null) return "en_attente";
  const elapsed = Date.now() - doc.confirmedAt;
  if (elapsed < 4_000) return "en_attente";
  if (elapsed < 14_000) return "en_cours";
  return doc.failIndexing ? "erreur" : "indexe";
}

function publicDocument(doc: StoredDocument) {
  return { ...clone(doc), statutIndexation: indexingStatus(doc) };
}

function validateProcedure(ctx: OrgCtx, input: ProcedureRequest) {
  const service = findMine(ctx, db().services, input.serviceId, "Service");
  if (!input.title.trim()) throw new ApiError("validation", "Le titre est obligatoire", 400);
  if (!input.description.trim()) throw new ApiError("validation", "La description est obligatoire", 400);
  if (!input.conditions.trim()) throw new ApiError("validation", "Au moins une condition est obligatoire", 400);
  return service;
}

function adminRow(o: Organization): AdminOrganizationRow {
  const s = db();
  const { abonnement, plan } = subscriptionOf(o.id);
  return {
    ...clone(o),
    plan: plan.nom,
    abonnementStatut: abonnement.statut,
    bornes: s.bornes.filter((b) => b.organization_id === o.id).length,
    membres: o.clerk_org_id === DEMO_ORG_KEY ? s.members.length : 2 + (o.nom.length % 5),
  };
}

/* -------------------------------------------------------------------------- */

export const mockRepository: Repository = {
  async getAccessStatus(ctx) {
    await tick();
    const o = org(ctx);
    const { abonnement } = subscriptionOf(o.id);
    return {
      organisation: o.statut,
      abonnement: abonnement.statut === "active" ? "actif" : "expire",
      finAbonnement: abonnement.dateFin,
    };
  },

  async getOrganization(ctx) {
    await tick();
    return clone(org(ctx));
  },

  async updateOrganization(ctx, input) {
    await tick();
    const o = writable(ctx);
    if (!input.nom.trim()) throw new ApiError("validation", "Le nom est obligatoire", 400);
    Object.assign(o, input);
    return clone(o);
  },

  /* ------------------------------ Départements ------------------------------ */

  async listDepartements(ctx) {
    await tick();
    return clone(mine(ctx, db().departements).sort((a, b) => a.ordre - b.ordre));
  },

  async createDepartement(ctx, input) {
    await tick();
    const o = writable(ctx);
    const list = mine(ctx, db().departements);
    if (list.some((d) => d.nom.toLowerCase() === input.nom.trim().toLowerCase()))
      conflict("Un département porte déjà ce nom.", "DUPLICATE");
    const dep = { id: newId(), organization_id: o.id, nom: input.nom.trim(), description: input.description, ordre: list.length, statut: "actif" as const };
    db().departements.push(dep);
    return clone(dep);
  },

  async updateDepartement(ctx, id, input) {
    await tick();
    writable(ctx);
    const dep = findMine(ctx, db().departements, id, "Département");
    Object.assign(dep, { nom: input.nom.trim(), description: input.description });
    return clone(dep);
  },

  async deleteDepartement(ctx, id) {
    await tick();
    writable(ctx);
    findMine(ctx, db().departements, id, "Département");
    if (db().services.some((s) => s.departement_id === id))
      conflict("Ce département contient encore des services. Déplacez-les ou supprimez-les d’abord.", "STILL_REFERENCED");
    db().departements = db().departements.filter((d) => d.id !== id);
  },

  async reorderDepartements(ctx, ids) {
    await tick();
    writable(ctx);
    ids.forEach((depId, index) => {
      const dep = findMine(ctx, db().departements, depId, "Département");
      dep.ordre = index;
    });
  },

  /* -------------------------------- Services -------------------------------- */

  async listServices(ctx) {
    await tick();
    return clone(mine(ctx, db().services).sort((a, b) => a.ordre - b.ordre));
  },

  async getService(ctx, id) {
    await tick();
    return clone(findMine(ctx, db().services, id, "Service"));
  },

  async createService(ctx, input) {
    await tick();
    const o = writable(ctx);
    if (!input.nom.trim()) throw new ApiError("validation", "Le nom est obligatoire", 400);
    if (input.departement_id) findMine(ctx, db().departements, input.departement_id, "Département");
    const siblings = mine(ctx, db().services).filter((s) => s.departement_id === input.departement_id);
    const service = {
      ...input,
      id: newId(),
      organization_id: o.id,
      ordre: siblings.length,
      statut_publication: "brouillon" as const,
    };
    db().services.push(service);
    return clone(service);
  },

  async updateService(ctx, id, input) {
    await tick();
    writable(ctx);
    const service = findMine(ctx, db().services, id, "Service");
    if (!input.nom.trim()) throw new ApiError("validation", "Le nom est obligatoire", 400);
    if (input.departement_id) findMine(ctx, db().departements, input.departement_id, "Département");
    Object.assign(service, input);
    db().procedures.filter((p) => p.serviceId === id).forEach((p) => (p.serviceName = service.nom));
    return clone(service);
  },

  async deleteService(ctx, id) {
    await tick();
    writable(ctx);
    findMine(ctx, db().services, id, "Service");
    if (db().procedures.some((p) => p.serviceId === id))
      conflict("Ce service contient encore des démarches. Supprimez-les d’abord.", "STILL_REFERENCED");
    const s = db();
    s.services = s.services.filter((svc) => svc.id !== id);
    s.positions = s.positions.filter((p) => !(p.entite_type === "service" && p.entite_id === id));
  },

  async reorderServices(ctx, ids) {
    await tick();
    writable(ctx);
    ids.forEach((serviceId, index) => {
      findMine(ctx, db().services, serviceId, "Service").ordre = index;
    });
  },

  async setServiceStatus(ctx, id, statut) {
    await tick();
    writable(ctx);
    const service = findMine(ctx, db().services, id, "Service");
    service.statut_publication = statut;
    return clone(service);
  },

  /* -------------------------------- Démarches -------------------------------- */

  async listProcedures(ctx, filter) {
    await tick();
    return clone(
      mine(ctx, db().procedures)
        .filter((p) => !filter?.serviceId || p.serviceId === filter.serviceId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    );
  },

  async getProcedure(ctx, id) {
    await tick();
    return clone(findMine(ctx, db().procedures, id, "Démarche"));
  },

  async createProcedure(ctx, input) {
    await tick();
    const o = writable(ctx);
    const service = validateProcedure(ctx, input);
    const now = new Date().toISOString();
    const procedure: Procedure = {
      ...input,
      id: newId(),
      organizationId: o.id,
      serviceName: service.nom,
      active: false,
      requiredDocuments: input.requiredDocuments.map((d) => ({ ...d, id: newId() })),
      createdAt: now,
      updatedAt: now,
    };
    db().procedures.push(procedure);
    return clone(procedure);
  },

  async updateProcedure(ctx, id, input) {
    await tick();
    writable(ctx);
    const procedure = findMine(ctx, db().procedures, id, "Démarche");
    const service = validateProcedure(ctx, input);
    Object.assign(procedure, {
      ...input,
      serviceName: service.nom,
      requiredDocuments: input.requiredDocuments.map((d) => ({ ...d, id: newId() })),
      updatedAt: new Date().toISOString(),
    });
    return clone(procedure);
  },

  async deleteProcedure(ctx, id) {
    await tick();
    writable(ctx);
    findMine(ctx, db().procedures, id, "Démarche");
    const s = db();
    s.procedures = s.procedures.filter((p) => p.id !== id);
    s.documents.forEach((d) => d.procedure_id === id && (d.procedure_id = null));
  },

  async setProcedureActive(ctx, id, active) {
    await tick();
    writable(ctx);
    const procedure = findMine(ctx, db().procedures, id, "Démarche");
    procedure.active = active;
    procedure.updatedAt = new Date().toISOString();
    return clone(procedure);
  },

  /* -------------------------------- Documents -------------------------------- */

  async listDocuments(ctx) {
    await tick();
    return mine(ctx, db().documents)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(publicDocument);
  },

  async requestDocumentUpload(ctx, file) {
    await tick();
    writable(ctx);
    if (file.contentType !== "application/pdf") throw new ApiError("validation", "Seuls les fichiers PDF sont acceptés", 400);
    if (file.sizeBytes > 10 * 1024 * 1024) throw new ApiError("validation", "Le fichier dépasse 10 Mo", 400);
    const key = newId();
    db().pendingUploads.set(key, { kind: "document", fileName: file.fileName, contentType: file.contentType });
    return { key, uploadUrl: `/api/dev-upload/${key}` };
  },

  async confirmDocument(ctx, key, meta) {
    await tick();
    const o = writable(ctx);
    const pending = db().pendingUploads.get(key);
    const upload = db().uploads.get(key);
    if (!pending || pending.kind !== "document" || !upload) notFound("Téléversement");
    if (meta.service_id) findMine(ctx, db().services, meta.service_id, "Service");
    if (meta.procedure_id) findMine(ctx, db().procedures, meta.procedure_id, "Démarche");
    const doc: StoredDocument = {
      id: key,
      organization_id: o.id,
      service_id: meta.service_id,
      procedure_id: meta.procedure_id,
      titre: meta.titre.trim() || pending.fileName.replace(/\.pdf$/i, ""),
      type: meta.type,
      description: meta.description,
      categorie: null,
      fichierUrl: `/api/dev-upload/${key}`,
      statutIndexation: "en_attente",
      fileName: pending.fileName,
      sizeBytes: upload.data.byteLength,
      confirmedAt: Date.now(),
      failIndexing: /erreur/i.test(pending.fileName),
      createdAt: new Date().toISOString(),
    };
    db().pendingUploads.delete(key);
    db().documents.push(doc);
    return publicDocument(doc) as DocumentConnaissance;
  },

  async retryDocument(ctx, id) {
    await tick();
    writable(ctx);
    const doc = findMine(ctx, db().documents, id, "Document");
    if (indexingStatus(doc) !== "erreur") conflict("Ce document n’est pas en erreur.", "NOT_IN_ERROR");
    // Deuxième tentative réussie : permet de tester le parcours de reprise.
    doc.failIndexing = false;
    doc.confirmedAt = Date.now();
    return publicDocument(doc);
  },

  async deleteDocument(ctx, id) {
    await tick();
    writable(ctx);
    findMine(ctx, db().documents, id, "Document");
    db().documents = db().documents.filter((d) => d.id !== id);
    db().uploads.delete(id);
  },

  /* ------------------------------ Plans du bâtiment ------------------------------ */

  async listPlans(ctx) {
    await tick();
    return mine(ctx, db().plans).map((p) => ({
      ...clone(p),
      points: db().positions.filter((pos) => pos.plan_id === p.id).length,
    }));
  },

  async getPlan(ctx, id) {
    await tick();
    const plan = findMine(ctx, db().plans, id, "Plan");
    return { ...clone(plan), positions: clone(db().positions.filter((p) => p.plan_id === id)) };
  },

  async requestPlanUpload(ctx, file) {
    await tick();
    writable(ctx);
    if (!["image/png", "image/jpeg", "image/svg+xml", "image/webp"].includes(file.contentType))
      throw new ApiError("validation", "Formats acceptés : PNG, JPG, SVG, WebP", 400);
    if (file.sizeBytes > 5 * 1024 * 1024) throw new ApiError("validation", "L’image dépasse 5 Mo", 400);
    const key = newId();
    db().pendingUploads.set(key, { kind: "plan", fileName: file.fileName, contentType: file.contentType });
    return { key, uploadUrl: `/api/dev-upload/${key}`, imageUrl: `/api/dev-upload/${key}` };
  },

  async createPlan(ctx, input) {
    await tick();
    const o = writable(ctx);
    if (!input.nom.trim()) throw new ApiError("validation", "Le nom est obligatoire", 400);
    const plan = { id: newId(), organization_id: o.id, nom: input.nom.trim(), image_url: input.image_url };
    db().plans.push(plan);
    return clone(plan);
  },

  async renamePlan(ctx, id, nom) {
    await tick();
    writable(ctx);
    const plan = findMine(ctx, db().plans, id, "Plan");
    plan.nom = nom.trim() || plan.nom;
    return clone(plan);
  },

  async deletePlan(ctx, id) {
    await tick();
    writable(ctx);
    findMine(ctx, db().plans, id, "Plan");
    const s = db();
    s.plans = s.plans.filter((p) => p.id !== id);
    s.positions = s.positions.filter((p) => p.plan_id !== id);
  },

  async savePosition(ctx, planId, input) {
    await tick();
    writable(ctx);
    findMine(ctx, db().plans, planId, "Plan");
    if (input.entite_type === "borne") findMine(ctx, db().bornes, input.entite_id, "Borne");
    else findMine(ctx, db().services, input.entite_id, "Service");
    const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v * 100) / 100));
    const s = db();
    let position = s.positions.find(
      (p) => p.plan_id === planId && p.entite_type === input.entite_type && p.entite_id === input.entite_id,
    );
    if (!position) {
      position = { id: newId(), plan_id: planId, ...input };
      s.positions.push(position);
    }
    position.coordonnee_x = clamp(input.coordonnee_x);
    position.coordonnee_y = clamp(input.coordonnee_y);
    return clone(position);
  },

  async deletePosition(ctx, planId, positionId) {
    await tick();
    writable(ctx);
    findMine(ctx, db().plans, planId, "Plan");
    db().positions = db().positions.filter((p) => p.id !== positionId);
  },

  /* --------------------------------- Bornes --------------------------------- */

  async listBornes(ctx) {
    await tick();
    return clone(mine(ctx, db().bornes));
  },

  async createBorne(ctx, input) {
    await tick();
    const o = writable(ctx);
    const { plan } = subscriptionOf(o.id);
    if (mine(ctx, db().bornes).length >= plan.limiteBornes)
      conflict(`Limite du plan ${plan.nom} atteinte : ${plan.limiteBornes} borne(s) maximum.`, "PLAN_LIMIT_BORNES");
    if (!input.nom.trim()) throw new ApiError("validation", "Le nom est obligatoire", 400);
    const code = `TB-DKP-${Math.floor(1000 + Math.random() * 9000)}`;
    const borne = {
      id: newId(),
      organization_id: o.id,
      codeUnique: code,
      nom: input.nom.trim(),
      localisation: input.localisation,
      statut: "inactive" as const,
      versionLogicielle: null,
    };
    db().bornes.push(borne);
    return clone(borne);
  },

  async updateBorne(ctx, id, input) {
    await tick();
    writable(ctx);
    const borne = findMine(ctx, db().bornes, id, "Borne");
    Object.assign(borne, { nom: input.nom.trim() || borne.nom, localisation: input.localisation, statut: input.statut });
    return clone(borne);
  },

  async deleteBorne(ctx, id) {
    await tick();
    writable(ctx);
    findMine(ctx, db().bornes, id, "Borne");
    const s = db();
    s.bornes = s.bornes.filter((b) => b.id !== id);
    s.positions = s.positions.filter((p) => !(p.entite_type === "borne" && p.entite_id === id));
  },

  /* -------------------------------- QR codes -------------------------------- */

  async listQRCodes(ctx) {
    await tick();
    return clone(mine(ctx, db().qrcodes));
  },

  async createQRCode(ctx, input) {
    await tick();
    const o = writable(ctx);
    if (input.type === "service" && input.cible_id) findMine(ctx, db().services, input.cible_id, "Service");
    if (input.type === "demarche" && input.cible_id) findMine(ctx, db().procedures, input.cible_id, "Démarche");
    const code = `QR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const qr = {
      id: newId(),
      borne_id: null,
      organization_id: o.id,
      code,
      url: `https://app.tontoumabot.sn/q/${code.toLowerCase()}`,
      type: input.type,
      cible_id: input.cible_id,
      actif: true,
      dateExpiration: null,
    };
    db().qrcodes.push(qr);
    return clone(qr);
  },

  async setQRCodeActive(ctx, id, actif) {
    await tick();
    writable(ctx);
    const qr = findMine(ctx, db().qrcodes, id, "QR code");
    qr.actif = actif;
    return clone(qr);
  },

  async deleteQRCode(ctx, id) {
    await tick();
    writable(ctx);
    findMine(ctx, db().qrcodes, id, "QR code");
    db().qrcodes = db().qrcodes.filter((q) => q.id !== id);
  },

  /* --------------------------------- Équipe --------------------------------- */

  async listMembers(ctx) {
    await tick();
    org(ctx);
    return clone(db().members);
  },

  async listInvitations(ctx) {
    await tick();
    const o = org(ctx);
    return clone(db().invitations.filter((i) => i.organisation_id === o.id && i.statut === "envoyee"));
  },

  async invite(ctx, input) {
    await tick();
    const o = writable(ctx);
    const email = input.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError("validation", "Adresse email invalide", 400);
    const s = db();
    const pending = s.invitations.filter((i) => i.organisation_id === o.id && i.statut === "envoyee");
    if (s.members.some((m) => m.email === email) || pending.some((i) => i.email === email))
      conflict("Cette personne est déjà membre ou déjà invitée.", "DUPLICATE");
    const { plan } = subscriptionOf(o.id);
    if (s.members.length + pending.length >= plan.limiteUtilisateurs)
      conflict(`Limite du plan ${plan.nom} atteinte : ${plan.limiteUtilisateurs} utilisateurs maximum.`, "PLAN_LIMIT_USERS");
    const invitation = {
      id: newId(),
      organisation_id: o.id,
      email,
      role: input.role,
      statut: "envoyee" as const,
      dateExpiration: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    };
    s.invitations.push(invitation);
    return clone(invitation);
  },

  async revokeInvitation(ctx, id) {
    await tick();
    const o = writable(ctx);
    const invitation = db().invitations.find((i) => i.id === id && i.organisation_id === o.id) ?? notFound("Invitation");
    db().invitations = db().invitations.filter((i) => i !== invitation);
  },

  async changeMemberRole(ctx, memberId, role) {
    await tick();
    writable(ctx);
    const s = db();
    const member = s.members.find((m) => m.id === memberId) ?? notFound("Membre");
    if (member.role === "super_admin" && role !== "super_admin" && s.members.filter((m) => m.role === "super_admin").length === 1)
      conflict("L’organisation doit garder au moins un super administrateur.", "LAST_SUPER_ADMIN");
    member.role = role;
    return clone(member);
  },

  async removeMember(ctx, memberId) {
    await tick();
    writable(ctx);
    const s = db();
    const member = s.members.find((m) => m.id === memberId) ?? notFound("Membre");
    if (member.role === "super_admin" && s.members.filter((m) => m.role === "super_admin").length === 1)
      conflict("Impossible de retirer le dernier super administrateur.", "LAST_SUPER_ADMIN");
    s.members = s.members.filter((m) => m.id !== memberId);
  },

  /* -------------------------------- Abonnement -------------------------------- */

  async getSubscription(ctx) {
    await tick();
    const o = org(ctx);
    const { abonnement, plan } = subscriptionOf(o.id);
    const s = db();
    return {
      abonnement: clone(abonnement),
      plan: clone(plan),
      factures: clone(s.factures.filter((f) => f.abonnement_id === abonnement.id)),
      usage: {
        membres: s.members.length + s.invitations.filter((i) => i.organisation_id === o.id && i.statut === "envoyee").length,
        bornes: s.bornes.filter((b) => b.organization_id === o.id).length,
      },
    };
  },

  /* -------------------------------- Plateforme -------------------------------- */

  async listOrganizations() {
    await tick();
    return db().organizations.map(adminRow).sort((a, b) => b.dateCreation.localeCompare(a.dateCreation));
  },

  async getOrganizationById(id) {
    await tick();
    return adminRow(db().organizations.find((o) => o.id === id) ?? notFound("Organisation"));
  },

  async setOrganizationStatus(id, statut, motif) {
    await tick();
    if (!motif.trim()) throw new ApiError("validation", "Le motif est obligatoire", 400);
    const o = db().organizations.find((org) => org.id === id) ?? notFound("Organisation");
    o.statut = statut;
    const { abonnement } = subscriptionOf(o.id);
    if (statut === "suspendue" && abonnement.statut === "active") abonnement.statut = "suspendue";
    if (statut === "active" && abonnement.statut === "suspendue") abonnement.statut = "active";
    return adminRow(o);
  },

  async listDemandes() {
    await tick();
    return clone(db().demandes).sort((a, b) => b.dateDemande.localeCompare(a.dateDemande));
  },

  async decideDemande(id, decision, motif) {
    await tick();
    const demande = db().demandes.find((d) => d.id === id) ?? notFound("Demande");
    if (demande.statut !== "en_attente") conflict("Cette demande a déjà été traitée.", "ALREADY_DECIDED");
    if (decision === "rejetee" && !motif?.trim()) throw new ApiError("validation", "Le motif du refus est obligatoire", 400);
    demande.statut = decision;
    if (decision === "approuvee") {
      const s = db();
      const organization: Organization = {
        id: newId(),
        clerk_org_id: `org_${newId().slice(0, 8)}`,
        nom: demande.nomOrganisation,
        type: demande.typeOrganisation ?? "Autre",
        description: demande.message,
        adresse: null,
        telephone: demande.telephoneContact,
        email: demande.emailContact,
        siteWeb: null,
        logo_url: null,
        statut: "active",
        dateCreation: new Date().toISOString(),
      };
      s.organizations.push(organization);
      const plan = s.plansAbonnement[0];
      s.abonnements.push({
        id: newId(),
        organization_id: organization.id,
        plan_id: plan.id,
        statut: "active",
        dateDebut: new Date().toISOString(),
        dateFin: new Date(Date.now() + 365 * 86_400_000).toISOString(),
        prochainRenouvellement: new Date(Date.now() + 365 * 86_400_000).toISOString(),
        modeRenouvellement: "manuel",
        montant: plan.prix,
        devise: "XOF",
      });
    }
    return clone(demande);
  },

  async listPlansAbonnement() {
    await tick();
    return clone(db().plansAbonnement).sort((a, b) => a.prix - b.prix);
  },

  async createPlanAbonnement(input) {
    await tick();
    if (!input.nom.trim()) throw new ApiError("validation", "Le nom est obligatoire", 400);
    if (db().plansAbonnement.some((p) => p.nom.toLowerCase() === input.nom.trim().toLowerCase()))
      conflict("Un plan porte déjà ce nom.", "DUPLICATE");
    const plan = { ...input, nom: input.nom.trim(), prix: Math.round(input.prix), id: newId() };
    db().plansAbonnement.push(plan);
    return clone(plan);
  },

  async updatePlanAbonnement(id, input) {
    await tick();
    const plan = db().plansAbonnement.find((p) => p.id === id) ?? notFound("Plan");
    Object.assign(plan, { ...input, prix: Math.round(input.prix) });
    return clone(plan);
  },

  async deletePlanAbonnement(id) {
    await tick();
    const s = db();
    if (!s.plansAbonnement.some((p) => p.id === id)) notFound("Plan");
    if (s.abonnements.some((a) => a.plan_id === id))
      conflict("Des organisations utilisent encore ce plan. Désactivez-le plutôt.", "STILL_REFERENCED");
    s.plansAbonnement = s.plansAbonnement.filter((p) => p.id !== id);
  },

  async listAllBornes() {
    await tick();
    const s = db();
    return s.bornes.map((b) => ({
      ...clone(b),
      organisation: s.organizations.find((o) => o.id === b.organization_id)?.nom ?? "—",
    }));
  },
};
