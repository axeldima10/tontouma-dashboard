/**
 * Modèle de jeton Clerk (JWT template) que le backend sait lire : il y cherche `org_id`, `org_role` et `email`.
 * Vide ou absent = jeton de session standard de Clerk. Un nom de modèle n'est pas un secret : le navigateur
 * en a besoin pour l'envoi direct de documents.
 */
export function backendJwtTemplate(): string | undefined {
  return process.env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE?.trim() || undefined;
}
