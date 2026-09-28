/**
 * Types des entités telles que le backend les expose.
 * - Démarches : export OpenAPI live (`/api/v1/admin/procedures`) — noms anglais.
 * - Le reste : docs/tontouma-bot-api-contract-complete.yaml — TODO(contract) : à aligner sur
 *   l'export live complet dès qu'il est disponible (seuls les mappers des dépôts changeront).
 */

export type Uuid = string;

/* ---------------------------------- Démarches (live) ---------------------------------- */

export type RequiredDocument = { id: Uuid; label: string; displayOrder: number };

export type Procedure = {
  id: Uuid;
  organizationId: Uuid;
  serviceId: Uuid;
  serviceName: string;
  title: string;
  description: string;
  /** Texte libre côté backend ; l'éditeur l'affiche comme une liste, une condition par ligne. */
  conditions: string;
  /** Entier, en devise `costCurrency` (XOF). */
  cost: number | null;
  costCurrency: string;
  place: string | null;
  additionalInfo: string | null;
  processingDays: number | null;
  /** false = brouillon (invisible des citoyens), true = publiée. */
  active: boolean;
  requiredDocuments: RequiredDocument[];
  createdAt: string;
  updatedAt: string;
};

export type ProcedureRequest = {
  serviceId: Uuid;
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

export type Page<T> = { content: T[]; page: number; size: number; totalElements: number; totalPages: number };

/* ------------------------------ Structure (YAML — TODO(contract)) ------------------------------ */

export type Departement = {
  id: Uuid;
  organization_id: Uuid;
  nom: string;
  description: string | null;
  ordre: number;
  statut: "actif" | "inactif";
};

export type PublicationStatus = "brouillon" | "publie";

export type ServiceOffering = {
  id: Uuid;
  departement_id: Uuid | null;
  organization_id: Uuid;
  nom: string;
  description: string | null;
  localisation: string | null;
  telephone: string | null;
  email: string | null;
  horaires: string | null;
  description_orientation: string | null;
  ordre: number;
  statut_publication: PublicationStatus;
};

export type ServiceInput = Omit<ServiceOffering, "id" | "organization_id" | "ordre" | "statut_publication">;

export type IndexingStatus = "en_attente" | "en_cours" | "indexe" | "erreur";

export type DocumentConnaissance = {
  id: Uuid;
  organization_id: Uuid;
  service_id: Uuid | null;
  procedure_id: Uuid | null;
  titre: string;
  type: string;
  description: string | null;
  categorie: string | null;
  fichierUrl: string | null;
  statutIndexation: IndexingStatus;
};

export type DocumentMeta = {
  titre: string;
  type: string;
  description: string | null;
  service_id: Uuid | null;
  procedure_id: Uuid | null;
};

export type PlanBatiment = { id: Uuid; organization_id: Uuid; nom: string; image_url: string | null };

export type Position = {
  id: Uuid;
  plan_id: Uuid;
  entite_type: "borne" | "service";
  entite_id: Uuid;
  /** Pourcentage de la largeur de l'image, 0 à 100. */
  coordonnee_x: number;
  /** Pourcentage de la hauteur de l'image, 0 à 100. */
  coordonnee_y: number;
};

export type BorneStatus = "active" | "inactive" | "maintenance";

export type Borne = {
  id: Uuid;
  organization_id: Uuid;
  codeUnique: string;
  nom: string;
  localisation: string | null;
  statut: BorneStatus;
  versionLogicielle: string | null;
};

export type QRCodeType = "organisation" | "service" | "demarche";

export type QRCode = {
  id: Uuid;
  borne_id: Uuid | null;
  organization_id: Uuid;
  code: string;
  url: string;
  type: QRCodeType;
  /** Cible (service ou démarche) — TODO(contract) : absent du YAML, nécessaire pour l'affichage. */
  cible_id: Uuid | null;
  actif: boolean;
  dateExpiration: string | null;
};

/* --------------------------------- Organisation & équipe --------------------------------- */

export type Organization = {
  id: Uuid;
  clerk_org_id: string;
  nom: string;
  type: string;
  description: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  siteWeb: string | null;
  logo_url: string | null;
  statut: "active" | "suspendue";
  dateCreation: string;
};

export type OrganizationInput = Pick<
  Organization,
  "nom" | "type" | "description" | "adresse" | "telephone" | "email" | "siteWeb"
>;

export type MemberRole = "super_admin" | "admin";

/** TODO(contract) : aucun endpoint de liste des membres dans le YAML ni dans l'export live. */
export type Member = { id: string; nom: string; email: string; role: MemberRole; depuis: string };

export type Invitation = {
  id: Uuid;
  organisation_id: Uuid;
  email: string;
  role: MemberRole;
  statut: "envoyee" | "acceptee" | "expiree";
  dateExpiration: string;
};

/* ---------------------------------------- Abonnement ---------------------------------------- */

export type PlanAbonnement = {
  id: Uuid;
  nom: string;
  description: string | null;
  prix: number;
  devise: string;
  periode: "mensuel" | "trimestriel" | "annuel";
  limiteUtilisateurs: number;
  limiteBornes: number;
  limiteStockage: number | null;
  fonctionnalites: string[];
  statut: "actif" | "inactif";
};

export type PlanInput = Omit<PlanAbonnement, "id">;

export type Abonnement = {
  id: Uuid;
  organization_id: Uuid;
  plan_id: Uuid;
  statut: "active" | "expiree" | "suspendue";
  dateDebut: string;
  dateFin: string;
  prochainRenouvellement: string | null;
  modeRenouvellement: "automatique" | "manuel";
  montant: number;
  devise: string;
};

export type Facture = {
  id: Uuid;
  abonnement_id: Uuid;
  numero: string;
  dateEmission: string;
  dateEcheance: string;
  montant: number;
  devise: string;
  statut: "brouillon" | "emise" | "payee" | "en_retard" | "annulee";
  fichierPDF: string | null;
};

export type SubscriptionView = {
  abonnement: Abonnement;
  plan: PlanAbonnement;
  factures: Facture[];
  usage: { membres: number; bornes: number };
};

/* ------------------------------------- Plateforme ------------------------------------- */

export type DemandeAcces = {
  id: Uuid;
  nomOrganisation: string;
  emailContact: string;
  telephoneContact: string | null;
  message: string | null;
  statut: "en_attente" | "approuvee" | "rejetee";
  dateDemande: string;
  /** Type d'organisation déclaré — TODO(contract) : absent du YAML. */
  typeOrganisation: string | null;
};

export type AdminOrganizationRow = Organization & {
  plan: string | null;
  abonnementStatut: Abonnement["statut"] | null;
  bornes: number;
  membres: number;
};
