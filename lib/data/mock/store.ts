import "server-only";
import type {
<<<<<<< HEAD
  Borne,
  Department,
  Form,
  KnowledgeDocument,
  Member,
  OpeningHours,
  Organization,
  Plan,
  Procedure,
  Service,
} from "@/lib/api/contract";

/**
 * Backend fictif de développement : données en mémoire, réinitialisées au redémarrage.
 * Jamais utilisé quand API_BASE_URL est défini (voir repository.ts).
 */

export type Scenario = "normal" | "empty" | "error" | "expired" | "suspended";
=======
  Abonnement,
  Borne,
  DemandeAcces,
  Departement,
  DocumentConnaissance,
  Facture,
  Invitation,
  Member,
  Organization,
  PlanAbonnement,
  PlanBatiment,
  Position,
  Procedure,
  QRCode,
  ServiceOffering,
} from "../types";

/**
 * Backend fictif de DÉVELOPPEMENT : état en mémoire, réinitialisé au redémarrage du serveur.
 * À supprimer quand le backend réel est branché. Refuse de tourner en production.
 */
if (process.env.NODE_ENV === "production") {
  throw new Error("Le backend fictif (lib/data/mock) ne doit jamais être chargé en production.");
}

export const DEMO_ORG_KEY = "org_demo";

export type StoredDocument = DocumentConnaissance & {
  fileName: string;
  sizeBytes: number;
  /** Horodatage de confirmation : l'indexation progresse à partir de là. */
  confirmedAt: number | null;
  /** Le prochain passage d'indexation échoue (fichiers contenant « erreur »). */
  failIndexing: boolean;
  createdAt: string;
};

export type Upload = { contentType: string; data: Uint8Array };

export type MockState = {
  organizations: Organization[];
  departements: Departement[];
  services: ServiceOffering[];
  procedures: Procedure[];
  documents: StoredDocument[];
  plans: PlanBatiment[];
  positions: Position[];
  bornes: Borne[];
  qrcodes: QRCode[];
  members: Member[];
  invitations: Invitation[];
  plansAbonnement: PlanAbonnement[];
  abonnements: Abonnement[];
  factures: Facture[];
  demandes: DemandeAcces[];
  uploads: Map<string, Upload>;
  /** Clé d'upload → document ou plan en attente de confirmation. */
  pendingUploads: Map<string, { kind: "document" | "plan"; fileName: string; contentType: string }>;
};

const id = () => crypto.randomUUID();
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
const daysAhead = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();

type Scenario = "normal" | "empty" | "error" | "expired" | "suspended";
>>>>>>> 939f032 (First Commit)

export function scenario(): Scenario {
  const value = process.env.FIXTURE_SCENARIO;
  return value === "empty" || value === "error" || value === "expired" || value === "suspended" ? value : "normal";
}

<<<<<<< HEAD
export type OrgData = {
  departments: Department[];
  services: Service[];
  procedures: Procedure[];
  documents: KnowledgeDocument[];
  /** Formulaires, par identifiant de démarche. */
  forms: Record<string, Form>;
  conversations: number;
  messages: number;
  subscription: { id: string; startDate: string; status: "ACTIVE" | "REMPLACEE" | "ANNULEE" };
};

export type Store = {
  plans: Plan[];
  organizations: Organization[];
  members: Record<string, Member[]>;
  bornes: Borne[];
  /** Données de contenu, par identifiant d'organisation backend. */
  orgData: Record<string, OrgData>;
  seq: number;
};

export const DEMO_ORG_KEY = "org_demo";

const now = () => new Date().toISOString();
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

export function uuid(): string {
  return crypto.randomUUID();
}

const WEEKDAYS: OpeningHours[] = (["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"] as const).map((dayOfWeek) => ({
  dayOfWeek,
  opensAt: "08:00",
  closesAt: "16:00",
}));
const FRIDAY: OpeningHours = { dayOfWeek: "FRIDAY", opensAt: "08:00", closesAt: "13:00" };
const OFFICE_HOURS = [...WEEKDAYS, FRIDAY];

function plan(name: string, amount: number, maxAdmins: number, maxBornes: number, maxAiDocuments: number, features: string[], description: string): Plan {
  return {
    id: uuid(),
    name,
    description,
    amount,
    currency: "XOF",
    billingPeriod: "MOIS",
    maxAdmins,
    maxBornes,
    maxAiDocuments,
    active: true,
    features: features.map((label, displayOrder) => ({ id: uuid(), label, displayOrder })),
    createdAt: daysAgo(200),
    updatedAt: daysAgo(30),
  };
}

function organization(
  name: string,
  type: string,
  planRef: Plan,
  createdDaysAgo: number,
  extra: Partial<Organization> = {},
): Organization {
  return {
    id: uuid(),
    clerkOrgId: null,
    name,
    type,
    ninea: null,
    address: "Dakar, Sénégal",
    phone: "+221 33 800 00 00",
    email: null,
    logoUrl: null,
    openingHours: OFFICE_HOURS,
    plan: { id: planRef.id, name: planRef.name },
    active: true,
    createdAt: daysAgo(createdDaysAgo),
    updatedAt: daysAgo(Math.max(0, createdDaysAgo - 3)),
    ...extra,
  };
}

/** Contenu réaliste d'une mairie d'arrondissement (organisation de démonstration). */
function seedOrgData(organizationId: string, empty: boolean): OrgData {
  const base: OrgData = {
    departments: [],
    services: [],
    procedures: [],
    documents: [],
    forms: {},
    conversations: empty ? 0 : 1284,
    messages: empty ? 0 : 5932,
    subscription: { id: uuid(), startDate: daysAgo(120).slice(0, 10), status: scenario() === "expired" ? "ANNULEE" : "ACTIVE" },
  };
  if (empty) return base;

  const dep = (name: string, description: string): Department => ({
    id: uuid(),
    organizationId,
    name,
    description,
    active: true,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(12),
  });
  const etatCivil = dep("État civil", "Naissances, mariages, décès et certificats.");
  const urbanisme = dep("Urbanisme & foncier", "Permis, autorisations et cadastre.");
  const social = dep("Action sociale", "Aides, bourses et accompagnement des familles.");
  base.departments = [etatCivil, urbanisme, social];

  const svc = (d: Department, name: string, description: string, location: string, active: boolean): Service => ({
    id: uuid(),
    departmentId: d.id,
    departmentName: d.name,
    name,
    description,
    location,
    phone: "+221 33 821 45 10",
    openingHours: OFFICE_HOURS,
    active,
    createdAt: daysAgo(80),
    updatedAt: daysAgo(5),
  });
  const naissances = svc(etatCivil, "Bureau des naissances", "Déclarations et extraits d’actes de naissance.", "Rez-de-chaussée, guichet 2", true);
  const mariages = svc(etatCivil, "Célébration des mariages", "Publication des bans et célébration civile.", "1er étage, salle des mariages", true);
  const permis = svc(urbanisme, "Permis de construire", "Dépôt et suivi des demandes de permis.", "Bâtiment B, bureau 12", true);
  const aides = svc(social, "Aides aux familles", "Bourses sociales et aides ponctuelles.", "Annexe sociale, porte 4", false);
  base.services = [naissances, mariages, permis, aides];

  const proc = (
    s: Service,
    title: string,
    description: string,
    conditions: string[],
    cost: number | null,
    processingDays: number | null,
    docs: string[],
    active: boolean,
    updatedDaysAgo: number,
  ): Procedure => ({
    id: uuid(),
    organizationId,
    serviceId: s.id,
    serviceName: s.name,
    title,
    description,
    conditions: conditions.join("\n"),
    cost,
    costCurrency: "XOF",
    place: s.location,
    additionalInfo: null,
    processingDays,
    active,
    requiredDocuments: docs.map((label, displayOrder) => ({ id: uuid(), label, displayOrder })),
    createdAt: daysAgo(60),
    updatedAt: daysAgo(updatedDaysAgo),
  });
  base.procedures = [
    proc(naissances, "Extrait d’acte de naissance", "Obtenir une copie officielle de son acte de naissance.", ["Être né dans la commune", "Se présenter en personne ou mandater un proche"], 200, 1, ["Pièce d’identité", "Numéro de l’acte (si connu)"], true, 2),
    proc(naissances, "Déclaration de naissance", "Déclarer la naissance d’un enfant dans les délais légaux.", ["Déclaration dans les 30 jours suivant la naissance"], 0, 0, ["Certificat d’accouchement", "Pièces d’identité des parents", "Livret de famille"], true, 9),
    proc(mariages, "Publication des bans", "Annoncer publiquement un projet de mariage civil.", ["Deux futurs époux majeurs", "Au moins un domicile dans la commune"], 5000, 10, ["Extraits de naissance des deux époux", "Certificats de résidence", "Pièces d’identité des témoins"], false, 1),
    proc(permis, "Demande de permis de construire", "Obtenir l’autorisation de construire ou d’agrandir.", ["Être propriétaire ou mandaté par le propriétaire", "Terrain situé dans la commune"], 75000, 60, ["Titre foncier ou bail", "Plans signés par un architecte", "Formulaire de demande"], true, 20),
    proc(aides, "Bourse sociale familiale", "Aide financière pour les familles en situation difficile.", ["Résider dans la commune depuis 1 an"], null, 30, ["Certificat de résidence", "Justificatifs de revenus"], false, 4),
  ];

  const extrait = base.procedures[0];
  const field = (name: string, label: string, fieldType: Form["sections"][number]["fields"][number]["fieldType"], displayOrder: number, extra: Partial<Form["sections"][number]["fields"][number]> = {}) => ({
    id: uuid(),
    name,
    label,
    fieldType,
    placeholder: null,
    required: true,
    displayOrder,
    defaultValue: null,
    helpText: null,
    validationRegex: null,
    validationMessage: null,
    options: [],
    ...extra,
  });
  base.forms[extrait.id] = {
    id: uuid(),
    procedureId: extrait.id,
    name: "Demande d’extrait de naissance",
    description: "À remplir avant de vous présenter au guichet.",
    active: true,
    sections: [
      {
        id: uuid(),
        title: "Personne concernée",
        description: null,
        displayOrder: 0,
        fields: [
          field("nom", "Nom", "TEXT", 0, { placeholder: "Diop" }),
          field("prenom", "Prénom", "TEXT", 1),
          field("date_naissance", "Date de naissance", "DATE", 2),
        ],
      },
      {
        id: uuid(),
        title: "Demande",
        description: "Précisez le type d’extrait souhaité.",
        displayOrder: 1,
        fields: [
          field("type_extrait", "Type d’extrait", "SELECT", 0, {
            options: ["Copie intégrale", "Extrait avec filiation", "Extrait sans filiation"].map((label, displayOrder) => ({ id: uuid(), label, displayOrder })),
          }),
          field("telephone", "Téléphone", "PHONE", 1, { helpText: "Pour vous prévenir quand l’extrait est prêt.", required: false }),
        ],
      },
    ],
    createdAt: daysAgo(20),
    updatedAt: daysAgo(3),
  };

  const doc = (title: string, category: string, size: number, active: boolean, daysOld: number, sourceProcedureId: string | null = null): KnowledgeDocument => ({
    id: uuid(),
    organizationId,
    title,
    fileUrl: `https://files.example.invalid/${encodeURIComponent(title)}.pdf`,
    fileSizeBytes: size,
    source: "Mairie de Dakar-Plateau",
    category,
    active,
    sourceProcedureId,
    createdAt: daysAgo(daysOld),
    updatedAt: daysAgo(daysOld),
  });
  base.documents = [
    doc("Code de la famille — extraits état civil", "Règlement", 1_842_000, true, 40),
    doc("Guide du citoyen 2026", "Guide", 3_210_000, true, 18),
    doc("FAQ urbanisme", "FAQ", 412_000, true, 7, base.procedures[3].id),
    doc("Ancien barème des timbres (2019)", "Règlement", 220_000, false, 300),
  ];
  return base;
}

function seed(): Store {
  const essentiel = plan("Essentiel", 25_000, 2, 1, 20, ["Assistant texte", "1 borne", "Support par email"], "Pour démarrer avec un service pilote.");
  const standard = plan("Standard", 75_000, 5, 3, 100, ["Assistant texte et voix", "3 bornes", "QR codes illimités", "Support prioritaire"], "Pour une mairie ou une agence.");
  const premium = plan("Premium", 180_000, 15, 10, 500, ["Tout Standard", "10 bornes", "Multi-sites", "Accompagnement dédié"], "Pour les grands établissements publics.");
  const archive = { ...plan("Pilote 2025", 0, 1, 1, 10, ["Offre de lancement"], "Plan historique, fermé aux nouvelles souscriptions."), active: false };

  const demo = organization("Mairie de Dakar-Plateau", "Mairie", standard, 120, {
    clerkOrgId: DEMO_ORG_KEY,
    ninea: "005123456",
    address: "Avenue Léopold Sédar Senghor, Dakar-Plateau",
    email: "contact@dakarplateau.sn",
    active: scenario() !== "suspended",
  });
  const organizations = [
    demo,
    organization("Hôpital Principal de Dakar", "Hôpital", premium, 64),
    organization("Mairie de Rufisque-Est", "Mairie", essentiel, 21),
    organization("Direction des impôts et domaines", "Agence", standard, 9),
    organization("Mairie de Thiès-Nord", "Mairie", essentiel, 180, { active: false }),
  ];

  const borne = (org: Organization, identifier: string, location: string, status: Borne["status"]): Borne => ({
    id: uuid(),
    organizationId: org.id,
    departmentId: null,
    departmentName: null,
    identifier,
    location,
    status,
    createdAt: daysAgo(50),
    updatedAt: daysAgo(3),
  });
  const bornes = [
    borne(demo, "BORNE-DKP-001", "Hall d’accueil", "ACTIVE"),
    borne(demo, "BORNE-DKP-002", "Annexe sociale", "MAINTENANCE"),
    borne(organizations[1], "BORNE-HPD-001", "Urgences — entrée", "ACTIVE"),
    borne(organizations[1], "BORNE-HPD-002", "Consultations externes", "ACTIVE"),
    borne(organizations[2], "BORNE-RUF-001", "Accueil", "HORS_SERVICE"),
  ];

  const members: Record<string, Member[]> = {
    [demo.id]: [
      { clerkUserId: "user_dev_aissatou", firstName: "Aïssatou", lastName: "Diallo", identifier: "aissatou.diallo@dakarplateau.sn", role: "org:super_admin" },
      { clerkUserId: "user_dev_moussa", firstName: "Moussa", lastName: "Ba", identifier: "moussa.ba@dakarplateau.sn", role: "org:admin" },
    ],
    [organizations[1].id]: [
      { clerkUserId: "user_dev_fatou", firstName: "Fatou", lastName: "Ndiaye", identifier: "f.ndiaye@hpd.sn", role: "org:super_admin" },
    ],
  };

  const empty = scenario() === "empty";
  return {
    plans: [essentiel, standard, premium, archive],
    organizations,
    members,
    bornes: empty ? [] : bornes,
    orgData: { [demo.id]: seedOrgData(demo.id, empty) },
    seq: 1,
  };
}

const globalStore = globalThis as unknown as { __tontoumaMock?: Store };

export function store(): Store {
  globalStore.__tontoumaMock ??= seed();
  return globalStore.__tontoumaMock;
}

/**
 * Organisation backend correspondant à la clé de session (Clerk org id, ou org de démo en mode dev).
 * Une organisation Clerk inconnue est créée à la volée avec le contenu de démonstration.
 */
export function orgFor(orgKey: string): { org: Organization; data: OrgData } {
  const s = store();
  let org = s.organizations.find((o) => o.clerkOrgId === orgKey);
  if (!org) {
    const standard = s.plans.find((p) => p.name === "Standard") ?? s.plans[0];
    org = organization("Organisation de démonstration", "Mairie", standard, 1, { clerkOrgId: orgKey });
    s.organizations.push(org);
  }
  s.orgData[org.id] ??= seedOrgData(org.id, scenario() === "empty");
  return { org, data: s.orgData[org.id] };
}

export { now };
=======
function seed(): MockState {
  const s = scenario();
  const empty = s === "empty";

  const plansAbonnement: PlanAbonnement[] = [
    {
      id: id(),
      nom: "Essentiel",
      description: "Pour une petite structure qui démarre.",
      prix: 150_000,
      devise: "XOF",
      periode: "annuel",
      limiteUtilisateurs: 3,
      limiteBornes: 1,
      limiteStockage: 2,
      fonctionnalites: ["Assistant texte", "1 borne", "QR codes illimités"],
      statut: "actif",
    },
    {
      id: id(),
      nom: "Institution",
      description: "Mairies et directions avec plusieurs guichets.",
      prix: 450_000,
      devise: "XOF",
      periode: "annuel",
      limiteUtilisateurs: 10,
      limiteBornes: 5,
      limiteStockage: 20,
      fonctionnalites: ["Assistant texte et voix", "Plans du bâtiment", "5 bornes", "Support prioritaire"],
      statut: "actif",
    },
    {
      id: id(),
      nom: "Réseau",
      description: "Ministères et réseaux multi-sites.",
      prix: 1_200_000,
      devise: "XOF",
      periode: "annuel",
      limiteUtilisateurs: 40,
      limiteBornes: 25,
      limiteStockage: 100,
      fonctionnalites: ["Tout Institution", "25 bornes", "Accompagnement dédié"],
      statut: "actif",
    },
  ];

  const demoOrgId = id();
  const organizations: Organization[] = [
    {
      id: demoOrgId,
      clerk_org_id: DEMO_ORG_KEY,
      nom: "Mairie de Dakar-Plateau",
      type: "Mairie",
      description: empty ? null : "Services d’état civil, d’urbanisme et d’action sociale de la commune de Dakar-Plateau.",
      adresse: empty ? null : "Place de l’Indépendance, Dakar",
      telephone: empty ? null : "+221 33 823 00 00",
      email: empty ? null : "contact@dakarplateau.sn",
      siteWeb: empty ? null : "https://dakarplateau.sn",
      logo_url: null,
      statut: s === "suspended" ? "suspendue" : "active",
      dateCreation: daysAgo(270),
    },
    ...(
      [
        ["Mairie de Rufisque", "Mairie", 2, "active"],
        ["Ministère de la Santé", "Ministère", 7, "active"],
        ["Mairie de Thiès", "Mairie", 16, "active"],
        ["Hôpital Principal de Dakar", "Hôpital", 24, "active"],
        ["Mairie de Saint-Louis", "Mairie", 60, "suspendue"],
        ["Direction des impôts", "Agence", 95, "active"],
        ["Mairie de Ziguinchor", "Mairie", 130, "active"],
      ] as const
    ).map(([nom, type, age, statut]) => ({
      id: id(),
      clerk_org_id: `org_${nom.toLowerCase().replace(/[^a-z]+/g, "_")}`,
      nom,
      type,
      description: null,
      adresse: "Sénégal",
      telephone: null,
      email: null,
      siteWeb: null,
      logo_url: null,
      statut: statut as Organization["statut"],
      dateCreation: daysAgo(age),
    })),
  ];

  const abonnements: Abonnement[] = organizations.map((org, index) => {
    const plan = plansAbonnement[index === 0 ? 1 : index % 3];
    const expired = org.id === demoOrgId && s === "expired";
    return {
      id: id(),
      organization_id: org.id,
      plan_id: plan.id,
      statut: expired ? "expiree" : org.statut === "suspendue" ? "suspendue" : "active",
      dateDebut: daysAgo(expired ? 368 : 269),
      dateFin: expired ? daysAgo(3) : daysAhead(96),
      prochainRenouvellement: expired ? null : daysAhead(96),
      modeRenouvellement: "manuel",
      montant: plan.prix,
      devise: "XOF",
    };
  });

  const demoSub = abonnements[0];
  const factures: Facture[] = [
    { numero: "FAC-2026-0112", emission: 269, statut: "payee" as const },
    { numero: "FAC-2025-0087", emission: 634, statut: "payee" as const },
  ].map((f) => ({
    id: id(),
    abonnement_id: demoSub.id,
    numero: f.numero,
    dateEmission: daysAgo(f.emission),
    dateEcheance: daysAgo(f.emission - 30),
    montant: demoSub.montant,
    devise: "XOF",
    statut: f.statut,
    fichierPDF: null,
  }));

  const state: MockState = {
    organizations,
    departements: [],
    services: [],
    procedures: [],
    documents: [],
    plans: [],
    positions: [],
    bornes: [],
    qrcodes: [],
    members: [
      { id: "dev_org-super-admin", nom: "Aïssatou Diallo", email: "aissatou.diallo@dakarplateau.sn", role: "super_admin", depuis: daysAgo(269) },
      ...(empty
        ? []
        : [
            { id: "dev_org-admin", nom: "Moussa Ba", email: "moussa.ba@dakarplateau.sn", role: "admin" as const, depuis: daysAgo(200) },
            { id: id(), nom: "Khady Ndiaye", email: "khady.ndiaye@dakarplateau.sn", role: "admin" as const, depuis: daysAgo(120) },
            { id: id(), nom: "Ousmane Faye", email: "ousmane.faye@dakarplateau.sn", role: "admin" as const, depuis: daysAgo(40) },
          ]),
    ],
    invitations: empty
      ? []
      : [
          {
            id: id(),
            organisation_id: demoOrgId,
            email: "fatou.sarr@dakarplateau.sn",
            role: "admin",
            statut: "envoyee",
            dateExpiration: daysAhead(5),
          },
        ],
    plansAbonnement,
    abonnements,
    factures,
    demandes: [
      ["Mairie de Mbour", "Mairie", "Awa Ndiaye", "awa.ndiaye@mbour.sn", 0.1, "Nous souhaitons installer deux bornes à l’accueil."],
      ["Centre hospitalier de Kaolack", "Hôpital", "Dr Moussa Sarr", "direction@chr-kaolack.sn", 1, "Orientation des patients vers les services."],
      ["Direction des passeports", "Agence", "Fatou Diop", "f.diop@passeports.gouv.sn", 3, null],
      ["Mairie de Louga", "Mairie", "Ibrahima Fall", "ibrahima.fall@louga.sn", 5, "Démarches d’état civil en wolof."],
    ].map(([nom, type, , email, age, message]) => ({
      id: id(),
      nomOrganisation: nom as string,
      emailContact: email as string,
      telephoneContact: "+221 77 000 00 00",
      message: message as string | null,
      statut: "en_attente" as const,
      dateDemande: daysAgo(age as number),
      typeOrganisation: type as string,
    })),
    uploads: new Map(),
    pendingUploads: new Map(),
  };

  if (!empty) seedDemoContent(state, demoOrgId);

  // Bornes des autres organisations (vue plateforme).
  organizations.slice(1).forEach((org, index) => {
    for (let n = 0; n < 1 + (index % 3); n++) {
      state.bornes.push({
        id: id(),
        organization_id: org.id,
        codeUnique: `TB-${org.nom.slice(-3).toUpperCase().replace(/[^A-Z]/g, "X")}-${100 + index * 10 + n}`,
        nom: `Borne ${n + 1}`,
        localisation: "Hall d’accueil",
        statut: n === 1 ? "maintenance" : org.statut === "suspendue" ? "inactive" : "active",
        versionLogicielle: "1.4.2",
      });
    }
  });

  return state;
}

function seedDemoContent(state: MockState, orgId: string) {
  const etatCivil: Departement = { id: id(), organization_id: orgId, nom: "État civil", description: "Naissances, mariages, décès.", ordre: 0, statut: "actif" };
  const urbanisme: Departement = { id: id(), organization_id: orgId, nom: "Urbanisme", description: "Permis et autorisations.", ordre: 1, statut: "actif" };
  state.departements.push(etatCivil, urbanisme);

  const svc = (dep: Departement | null, nom: string, ordre: number, extra: Partial<ServiceOffering>): ServiceOffering => ({
    id: id(),
    departement_id: dep?.id ?? null,
    organization_id: orgId,
    nom,
    description: null,
    localisation: null,
    telephone: null,
    email: null,
    horaires: "Lundi–vendredi, 8 h – 15 h 30",
    description_orientation: null,
    ordre,
    statut_publication: "publie",
    ...extra,
  });

  const naissances = svc(etatCivil, "Bureau des naissances", 0, {
    description: "Déclarations et extraits d’actes de naissance.",
    localisation: "Rez-de-chaussée, guichet 3",
    description_orientation: "Couloir central, première porte à droite.",
    telephone: "+221 33 823 00 10",
  });
  const mariages = svc(etatCivil, "Bureau des mariages", 1, {
    description: "Publication des bans et célébration.",
    localisation: "1er étage, salle 12",
    description_orientation: "Escalier principal, puis à gauche jusqu’au fond.",
  });
  const permis = svc(urbanisme, "Guichet urbanisme", 0, {
    description: "Permis de construire et certificats d’urbanisme.",
    localisation: "Bâtiment B, rez-de-chaussée",
    statut_publication: "brouillon",
  });
  const accueil = svc(null, "Accueil et orientation", 0, {
    description: "Renseignements généraux.",
    localisation: "Hall d’entrée",
    description_orientation: "Juste en face de l’entrée principale.",
  });
  state.services.push(naissances, mariages, permis, accueil);

  const proc = (service: ServiceOffering, p: Partial<Procedure> & { title: string }, docs: string[]): Procedure => ({
    id: id(),
    organizationId: orgId,
    serviceId: service.id,
    serviceName: service.nom,
    description: "",
    conditions: "",
    cost: null,
    costCurrency: "XOF",
    place: service.localisation,
    additionalInfo: null,
    processingDays: null,
    active: true,
    requiredDocuments: docs.map((label, i) => ({ id: id(), label, displayOrder: i })),
    createdAt: daysAgo(90),
    updatedAt: daysAgo(12),
    ...p,
  });

  state.procedures.push(
    proc(naissances, {
      title: "Extrait d’acte de naissance",
      description: "Obtenir une copie certifiée d’un acte de naissance enregistré à Dakar-Plateau.",
      conditions: "Être la personne concernée, un parent ou un mandataire\nConnaître le numéro de registre ou la date de naissance",
      cost: 200,
      processingDays: 2,
    }, ["Pièce d’identité du demandeur", "Numéro de registre (si connu)"]),
    proc(naissances, {
      title: "Déclaration de naissance",
      description: "Déclarer une naissance survenue dans la commune.",
      conditions: "Déclaration dans les 12 mois suivant la naissance",
      cost: 0,
      processingDays: 1,
    }, ["Certificat d’accouchement", "Pièces d’identité des parents"]),
    proc(mariages, {
      title: "Célébration de mariage",
      description: "Constituer le dossier et fixer la date de célébration.",
      conditions: "Futurs époux majeurs\nPublication des bans 10 jours avant",
      cost: 5000,
      processingDays: 15,
      active: false,
    }, ["Extraits de naissance des époux", "Certificats de résidence", "Pièces d’identité des témoins"]),
    proc(permis, {
      title: "Permis de construire",
      description: "Autorisation préalable à toute construction nouvelle.",
      conditions: "Être propriétaire ou mandaté par le propriétaire\nTerrain situé dans la commune",
      cost: 25000,
      processingDays: 60,
      active: false,
    }, ["Titre de propriété", "Plans de l’architecte", "Pièce d’identité"]),
  );

  const doc = (titre: string, extra: Partial<StoredDocument>): StoredDocument => ({
    id: id(),
    organization_id: orgId,
    service_id: null,
    procedure_id: null,
    titre,
    type: "Guide",
    description: null,
    categorie: null,
    fichierUrl: null,
    statutIndexation: "indexe",
    fileName: `${titre.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`,
    sizeBytes: 480_000,
    confirmedAt: Date.now() - 3_600_000,
    failIndexing: false,
    createdAt: daysAgo(30),
    ...extra,
  });
  state.documents.push(
    doc("Règlement intérieur de la mairie", { type: "Règlement", sizeBytes: 1_240_000 }),
    doc("Guide de l’état civil", { service_id: naissances.id, sizeBytes: 2_100_000 }),
    doc("FAQ mariages", { type: "FAQ", service_id: mariages.id, failIndexing: true, confirmedAt: Date.now() - 60_000 }),
  );

  const borne: Borne = {
    id: id(),
    organization_id: orgId,
    codeUnique: "TB-DKP-4821",
    nom: "Borne du hall",
    localisation: "Hall d’entrée",
    statut: "active",
    versionLogicielle: "1.4.2",
  };
  const borne2: Borne = { ...borne, id: id(), codeUnique: "TB-DKP-7390", nom: "Borne état civil", localisation: "Rez-de-chaussée", statut: "active" };
  const borne3: Borne = { ...borne, id: id(), codeUnique: "TB-DKP-1057", nom: "Borne urbanisme", localisation: "Bâtiment B", statut: "maintenance" };
  state.bornes.push(borne, borne2, borne3);

  state.qrcodes.push({
    id: id(),
    borne_id: null,
    organization_id: orgId,
    code: "QR-DKP-ORG",
    url: "https://app.tontoumabot.sn/o/dakar-plateau",
    type: "organisation",
    cible_id: null,
    actif: true,
    dateExpiration: null,
  });

  const plan: PlanBatiment = { id: id(), organization_id: orgId, nom: "Rez-de-chaussée", image_url: "/demo/plan-rdc.svg" };
  state.plans.push(plan);
  state.positions.push(
    { id: id(), plan_id: plan.id, entite_type: "borne", entite_id: borne.id, coordonnee_x: 50, coordonnee_y: 82 },
    { id: id(), plan_id: plan.id, entite_type: "service", entite_id: accueil.id, coordonnee_x: 50, coordonnee_y: 62 },
    { id: id(), plan_id: plan.id, entite_type: "service", entite_id: naissances.id, coordonnee_x: 22, coordonnee_y: 30 },
  );
}

const globalForMock = globalThis as unknown as { __tontoumaMock?: MockState };

/** État partagé, conservé entre les rechargements à chaud du serveur de dev. */
export function db(): MockState {
  globalForMock.__tontoumaMock ??= seed();
  return globalForMock.__tontoumaMock;
}

export function newId(): string {
  return id();
}
>>>>>>> 939f032 (First Commit)
