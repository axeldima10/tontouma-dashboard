import "server-only";
import { isApiConfigured } from "@/lib/api/server";
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
  getProcedure(ctx: OrgCtx, id: string): Promise<Procedure>;
  createProcedure(ctx: OrgCtx, input: ProcedureRequest): Promise<Procedure>;
  updateProcedure(ctx: OrgCtx, id: string, input: ProcedureRequest): Promise<Procedure>;
  deleteProcedure(ctx: OrgCtx, id: string): Promise<void>;
  setProcedureActive(ctx: OrgCtx, id: string, active: boolean): Promise<Procedure>;

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
}

/** Backend réel si API_BASE_URL est défini, sinon backend fictif de développement (jamais chargé en prod). */
export async function repo(): Promise<Repository> {
  if (isApiConfigured()) return (await import("./backend")).backendRepository;
  return (await import("./mock/ops")).mockRepository;
}
