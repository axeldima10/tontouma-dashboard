import "server-only";
import { isApiConfigured } from "@/lib/api/server";
<<<<<<< HEAD
import type {
  Borne,
  BorneRequest,
  BorneStatus,
  Department,
  DepartmentRequest,
  Form,
  FormRequest,
  Me,
  OrganizationCandidate,
  PublicBorne,
  PublicOrganization,
  PublicService,
  DocumentTextRequest,
  DocumentUpdateRequest,
  KnowledgeDocument,
  Member,
  Organization,
  OrganizationCreateRequest,
  OrganizationUpdateRequest,
  Plan,
  PlanRequest,
  Procedure,
  ProcedureRequest,
  Service,
  ServiceRequest,
  Statistics,
  Subscription,
} from "@/lib/api/contract";

/**
 * Contexte d'appel côté organisation. Le backend déduit l'organisation du jeton ;
 * `orgKey` sert uniquement au backend fictif pour isoler ses données par organisation.
 */
export type OrgCtx = { orgKey: string };

export type DocumentFilter = { q?: string; category?: string };

/** Identité de session, utile au backend fictif pour imiter `GET /me` (le vrai backend lit le jeton). */
export type SessionIdentity = {
  userId: string;
  email: string | null;
  firstName: string | null;
  name: string;
  orgKey: string | null;
  isPlatformAdmin: boolean;
};

/**
 * Contrat unique entre les écrans et les données (endpoints de docs/API-FRONT.md).
 * Deux implémentations : `backend.ts` (API réelle) et `mock/ops.ts` (développement).
 */
export interface Repository {
  /* Admin — scope : organisation du jeton */
  getStatistics(ctx: OrgCtx): Promise<Statistics>;
  getSubscription(ctx: OrgCtx): Promise<Subscription>;

  listDepartments(ctx: OrgCtx): Promise<Department[]>;
  createDepartment(ctx: OrgCtx, input: DepartmentRequest): Promise<Department>;
  updateDepartment(ctx: OrgCtx, id: string, input: DepartmentRequest): Promise<Department>;
  deleteDepartment(ctx: OrgCtx, id: string): Promise<void>;
  setDepartmentActive(ctx: OrgCtx, id: string, active: boolean): Promise<Department>;

  listServices(ctx: OrgCtx, filter?: { departmentId?: string }): Promise<Service[]>;
  getService(ctx: OrgCtx, id: string): Promise<Service>;
  createService(ctx: OrgCtx, input: ServiceRequest): Promise<Service>;
  updateService(ctx: OrgCtx, id: string, input: ServiceRequest): Promise<Service>;
  deleteService(ctx: OrgCtx, id: string): Promise<void>;
  setServiceActive(ctx: OrgCtx, id: string, active: boolean): Promise<Service>;

  listProcedures(ctx: OrgCtx, filter?: { serviceId?: string; active?: boolean; q?: string }): Promise<Procedure[]>;
=======
import type { OrgAccessStatus } from "@/lib/api/queries/types";
import type {
  AdminOrganizationRow,
  Borne,
  BorneStatus,
  DemandeAcces,
  Departement,
  DocumentConnaissance,
  DocumentMeta,
  Invitation,
  Member,
  MemberRole,
  Organization,
  OrganizationInput,
  PlanAbonnement,
  PlanBatiment,
  PlanInput,
  Position,
  Procedure,
  ProcedureRequest,
  PublicationStatus,
  QRCode,
  QRCodeType,
  ServiceInput,
  ServiceOffering,
  SubscriptionView,
} from "./types";

/** Contexte d'appel : l'organisation vient toujours de la session, jamais de l'URL ni d'un formulaire. */
export type OrgCtx = { orgKey: string; /** Rôle de session, pour les contrôles d’affichage des actions. */ role?: string | null };

export type UploadTicket = { key: string; uploadUrl: string };

/**
 * Contrat unique entre les écrans et les données.
 * Deux implémentations : `backend.ts` (API réelle) et `mock/ops.ts` (développement).
 */
export interface Repository {
  getAccessStatus(ctx: OrgCtx): Promise<OrgAccessStatus>;
  getOrganization(ctx: OrgCtx): Promise<Organization>;
  updateOrganization(ctx: OrgCtx, input: OrganizationInput): Promise<Organization>;

  listDepartements(ctx: OrgCtx): Promise<Departement[]>;
  createDepartement(ctx: OrgCtx, input: { nom: string; description: string | null }): Promise<Departement>;
  updateDepartement(ctx: OrgCtx, id: string, input: { nom: string; description: string | null }): Promise<Departement>;
  deleteDepartement(ctx: OrgCtx, id: string): Promise<void>;
  reorderDepartements(ctx: OrgCtx, ids: string[]): Promise<void>;

  listServices(ctx: OrgCtx): Promise<ServiceOffering[]>;
  getService(ctx: OrgCtx, id: string): Promise<ServiceOffering>;
  createService(ctx: OrgCtx, input: ServiceInput): Promise<ServiceOffering>;
  updateService(ctx: OrgCtx, id: string, input: ServiceInput): Promise<ServiceOffering>;
  deleteService(ctx: OrgCtx, id: string): Promise<void>;
  reorderServices(ctx: OrgCtx, ids: string[]): Promise<void>;
  setServiceStatus(ctx: OrgCtx, id: string, statut: PublicationStatus): Promise<ServiceOffering>;

  listProcedures(ctx: OrgCtx, filter?: { serviceId?: string }): Promise<Procedure[]>;
>>>>>>> 939f032 (First Commit)
  getProcedure(ctx: OrgCtx, id: string): Promise<Procedure>;
  createProcedure(ctx: OrgCtx, input: ProcedureRequest): Promise<Procedure>;
  updateProcedure(ctx: OrgCtx, id: string, input: ProcedureRequest): Promise<Procedure>;
  deleteProcedure(ctx: OrgCtx, id: string): Promise<void>;
  setProcedureActive(ctx: OrgCtx, id: string, active: boolean): Promise<Procedure>;

<<<<<<< HEAD
  listDocuments(ctx: OrgCtx, filter?: DocumentFilter): Promise<KnowledgeDocument[]>;
  createTextDocument(ctx: OrgCtx, input: DocumentTextRequest): Promise<KnowledgeDocument>;
  /** Backend fictif uniquement : en réel, le navigateur envoie le fichier directement au backend. */
  uploadDocument(ctx: OrgCtx, meta: { title: string; source: string | null; category: string | null }, file: File): Promise<KnowledgeDocument>;
  updateDocument(ctx: OrgCtx, id: string, input: DocumentUpdateRequest): Promise<KnowledgeDocument>;
  deleteDocument(ctx: OrgCtx, id: string): Promise<void>;
  setDocumentActive(ctx: OrgCtx, id: string, active: boolean): Promise<KnowledgeDocument>;

  /** Formulaire d'une démarche ; `null` si la démarche n'en a pas encore (404). */
  getForm(ctx: OrgCtx, procedureId: string): Promise<Form | null>;
  createForm(ctx: OrgCtx, procedureId: string, input: FormRequest): Promise<Form>;
  replaceForm(ctx: OrgCtx, procedureId: string, input: FormRequest): Promise<Form>;
  deleteForm(ctx: OrgCtx, procedureId: string): Promise<void>;
  setFormActive(ctx: OrgCtx, procedureId: string, active: boolean): Promise<Form>;

  listBornes(ctx: OrgCtx): Promise<Borne[]>;
  setBorneStatus(ctx: OrgCtx, id: string, status: BorneStatus): Promise<Borne>;

  /* Profil — `GET /me` */
  getMe(identity: SessionIdentity): Promise<Me>;

  /* Public — ce que voient les citoyens (sans jeton) */
  getPublicOrganization(organizationId: string): Promise<PublicOrganization>;
  searchPublicOrganizations(q: string): Promise<OrganizationCandidate[]>;
  listPublicServices(organizationId: string): Promise<PublicService[]>;
  listPublicProcedures(organizationId: string, q?: string): Promise<Procedure[]>;
  getPublicProcedure(id: string): Promise<Procedure>;
  getPublicForm(procedureId: string): Promise<Form | null>;
  getPublicBorne(borneId: string): Promise<PublicBorne>;

  /* SuperAdmin — personnel Tontouma, scope global */
  listOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization>;
  createOrganization(input: OrganizationCreateRequest): Promise<Organization>;
  updateOrganization(id: string, input: OrganizationUpdateRequest): Promise<Organization>;
  changeOrganizationPlan(id: string, planId: string): Promise<Organization>;
  setOrganizationActive(id: string, active: boolean): Promise<Organization>;
  listMembers(organizationId: string): Promise<Member[]>;
  inviteAdmin(organizationId: string, email: string): Promise<void>;
  removeAdmin(organizationId: string, clerkUserId: string): Promise<void>;

  listPlans(activeOnly?: boolean): Promise<Plan[]>;
  createPlan(input: PlanRequest): Promise<Plan>;
  updatePlan(id: string, input: PlanRequest): Promise<Plan>;
  deletePlan(id: string): Promise<void>;
  setPlanActive(id: string, active: boolean): Promise<Plan>;

  listAllBornes(organizationId?: string): Promise<Borne[]>;
  createBorne(input: BorneRequest): Promise<Borne>;
  updateBorne(id: string, input: BorneRequest): Promise<Borne>;
  deleteBorne(id: string): Promise<void>;
  setAnyBorneStatus(id: string, status: BorneStatus): Promise<Borne>;
=======
  listDocuments(ctx: OrgCtx): Promise<(DocumentConnaissance & { fileName: string; sizeBytes: number; createdAt: string })[]>;
  requestDocumentUpload(ctx: OrgCtx, file: { fileName: string; contentType: string; sizeBytes: number }): Promise<UploadTicket>;
  confirmDocument(ctx: OrgCtx, key: string, meta: DocumentMeta): Promise<DocumentConnaissance>;
  retryDocument(ctx: OrgCtx, id: string): Promise<DocumentConnaissance>;
  deleteDocument(ctx: OrgCtx, id: string): Promise<void>;

  listPlans(ctx: OrgCtx): Promise<(PlanBatiment & { points: number })[]>;
  getPlan(ctx: OrgCtx, id: string): Promise<PlanBatiment & { positions: Position[] }>;
  requestPlanUpload(ctx: OrgCtx, file: { fileName: string; contentType: string; sizeBytes: number }): Promise<UploadTicket & { imageUrl: string }>;
  createPlan(ctx: OrgCtx, input: { nom: string; image_url: string }): Promise<PlanBatiment>;
  renamePlan(ctx: OrgCtx, id: string, nom: string): Promise<PlanBatiment>;
  deletePlan(ctx: OrgCtx, id: string): Promise<void>;
  savePosition(
    ctx: OrgCtx,
    planId: string,
    input: { entite_type: Position["entite_type"]; entite_id: string; coordonnee_x: number; coordonnee_y: number },
  ): Promise<Position>;
  deletePosition(ctx: OrgCtx, planId: string, positionId: string): Promise<void>;

  listBornes(ctx: OrgCtx): Promise<Borne[]>;
  createBorne(ctx: OrgCtx, input: { nom: string; localisation: string | null }): Promise<Borne>;
  updateBorne(ctx: OrgCtx, id: string, input: { nom: string; localisation: string | null; statut: BorneStatus }): Promise<Borne>;
  deleteBorne(ctx: OrgCtx, id: string): Promise<void>;

  listQRCodes(ctx: OrgCtx): Promise<QRCode[]>;
  createQRCode(ctx: OrgCtx, input: { type: QRCodeType; cible_id: string | null }): Promise<QRCode>;
  setQRCodeActive(ctx: OrgCtx, id: string, actif: boolean): Promise<QRCode>;
  deleteQRCode(ctx: OrgCtx, id: string): Promise<void>;

  listMembers(ctx: OrgCtx): Promise<Member[]>;
  listInvitations(ctx: OrgCtx): Promise<Invitation[]>;
  invite(ctx: OrgCtx, input: { email: string; role: MemberRole }): Promise<Invitation>;
  revokeInvitation(ctx: OrgCtx, id: string): Promise<void>;
  changeMemberRole(ctx: OrgCtx, memberId: string, role: MemberRole): Promise<Member>;
  removeMember(ctx: OrgCtx, memberId: string): Promise<void>;

  getSubscription(ctx: OrgCtx): Promise<SubscriptionView>;

  listOrganizations(): Promise<AdminOrganizationRow[]>;
  getOrganizationById(id: string): Promise<AdminOrganizationRow>;
  setOrganizationStatus(id: string, statut: Organization["statut"], motif: string): Promise<AdminOrganizationRow>;

  listDemandes(): Promise<DemandeAcces[]>;
  decideDemande(id: string, decision: "approuvee" | "rejetee", motif: string | null): Promise<DemandeAcces>;

  listPlansAbonnement(): Promise<PlanAbonnement[]>;
  createPlanAbonnement(input: PlanInput): Promise<PlanAbonnement>;
  updatePlanAbonnement(id: string, input: PlanInput): Promise<PlanAbonnement>;
  deletePlanAbonnement(id: string): Promise<void>;

  /** Bornes de toutes les organisations (vue plateforme). */
  listAllBornes(): Promise<(Borne & { organisation: string })[]>;
>>>>>>> 939f032 (First Commit)
}

/** Backend réel si API_BASE_URL est défini, sinon backend fictif de développement (jamais chargé en prod). */
export async function repo(): Promise<Repository> {
  if (isApiConfigured()) return (await import("./backend")).backendRepository;
<<<<<<< HEAD
  if (process.env.NODE_ENV === "production") throw new Error("API_BASE_URL est obligatoire en production.");
=======
>>>>>>> 939f032 (First Commit)
  return (await import("./mock/ops")).mockRepository;
}
