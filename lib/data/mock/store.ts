import "server-only";
import type {
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

export function scenario(): Scenario {
  const value = process.env.FIXTURE_SCENARIO;
  return value === "empty" || value === "error" || value === "expired" || value === "suspended" ? value : "normal";
}

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
