import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { cache } from "react";
import { isDevAuth } from "./mode";
import { DEV_ORG, PERSONA_COOKIE, PERSONAS, toPersonaId } from "./personas";
import { isPlatformAdminClaims } from "./roles";
import type { Session } from "./types";

async function devSession(): Promise<Session> {
  const persona = PERSONAS[toPersonaId((await cookies()).get(PERSONA_COOKIE)?.value)];
  const inOrg = persona.orgRole !== null;
  return {
    mode: "dev",
    userId: `dev_${persona.id}`,
    name: persona.name,
    firstName: persona.firstName,
    email: persona.email,
    imageUrl: null,
    orgId: inOrg ? DEV_ORG.id : null,
    orgName: inOrg ? DEV_ORG.name : null,
    orgRole: persona.orgRole,
    isPlatformAdmin: persona.isPlatformAdmin,
    personaId: persona.id,
  };
}

async function clerkSession(): Promise<Session | null> {
  const { isAuthenticated, userId, orgId, orgRole, sessionClaims } = await auth();
  if (!isAuthenticated || !userId) return null;
  // Identité affichée : lue dans le jeton si la claim `email` y est configurée (aucun appel réseau),
  // sinon demandée à l'API Clerk.
  const identity =
    typeof sessionClaims?.email === "string"
      ? {
          name: sessionClaims.full_name ?? "",
          firstName: sessionClaims.first_name ?? null,
          email: sessionClaims.email,
          imageUrl: sessionClaims.image_url ?? null,
        }
      : await currentUser().then((user) => ({
          name: user?.fullName ?? "",
          firstName: user?.firstName ?? null,
          email: user?.primaryEmailAddress?.emailAddress ?? null,
          imageUrl: user?.imageUrl ?? null,
        }));
  return {
    mode: "clerk",
    userId,
    name: identity.name,
    firstName: identity.firstName?.trim() || null,
    email: identity.email,
    imageUrl: identity.imageUrl || null,
    orgId: orgId ?? null,
    orgName: null,
    orgRole: orgRole ?? null,
    isPlatformAdmin: isPlatformAdminClaims(sessionClaims),
    personaId: null,
  };
}

/** Point d'entrée unique de l'identité côté serveur. Mémorisé par requête. */
export const getSession = cache(async (): Promise<Session | null> => {
  return isDevAuth() ? devSession() : clerkSession();
});

/** Jeton à joindre aux appels backend : aucun en mode dev. */
export async function getBackendToken(): Promise<string | null> {
  if (isDevAuth()) return null;
  const { getToken } = await auth();
  return getToken();
}
