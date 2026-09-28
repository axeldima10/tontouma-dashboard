/** Clés de rôle Clerk exactes (préfixées). Ne jamais comparer aux libellés. */
export const ORG_ROLES = {
  superAdmin: "org:super_admin",
  admin: "org:admin",
} as const;

export type OrgRole = (typeof ORG_ROLES)[keyof typeof ORG_ROLES];

/** Valeur de la claim `platform_role` (métadonnées publiques Clerk) du personnel Tontouma. */
export const PLATFORM_ADMIN_ROLE = "admin";

export const ROLE_LABELS: Record<OrgRole, string> = {
  "org:super_admin": "Super administrateur",
  "org:admin": "Administrateur",
};

export function isSuperAdminRole(role: string | null | undefined): boolean {
  return role === ORG_ROLES.superAdmin;
}

export function isPlatformAdminClaims(claims: CustomJwtSessionClaims | null | undefined): boolean {
  return claims?.platform_role === PLATFORM_ADMIN_ROLE;
}
