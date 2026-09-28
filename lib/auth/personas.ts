import { ORG_ROLES, type OrgRole } from "./roles";

/** Utilisateurs fictifs du mode développement (aucun secret, aucun jeton). */
export type PersonaId = "org-super-admin" | "org-admin" | "platform-admin";

export const PERSONA_COOKIE = "dev_persona";
export const DEFAULT_PERSONA: PersonaId = "org-super-admin";

export const DEV_ORG = { id: "org_demo", name: "Mairie de Dakar-Plateau" } as const;

export type Persona = {
  id: PersonaId;
  label: string;
  name: string;
  firstName: string;
  email: string;
  orgRole: OrgRole | null;
  isPlatformAdmin: boolean;
};

export const PERSONAS: Record<PersonaId, Persona> = {
  "org-super-admin": {
    id: "org-super-admin",
    label: "Super admin organisation",
    name: "Aïssatou Diallo",
    firstName: "Aïssatou",
    email: "aissatou.diallo@dakarplateau.sn",
    orgRole: ORG_ROLES.superAdmin,
    isPlatformAdmin: false,
  },
  "org-admin": {
    id: "org-admin",
    label: "Admin organisation",
    name: "Moussa Ba",
    firstName: "Moussa",
    email: "moussa.ba@dakarplateau.sn",
    orgRole: ORG_ROLES.admin,
    isPlatformAdmin: false,
  },
  "platform-admin": {
    id: "platform-admin",
    label: "Équipe Tontouma",
    name: "Équipe Tontouma",
    firstName: "équipe",
    email: "admin@tontouma.sn",
    orgRole: null,
    isPlatformAdmin: true,
  },
};

export function toPersonaId(value: string | undefined): PersonaId {
  return value && value in PERSONAS ? (value as PersonaId) : DEFAULT_PERSONA;
}
