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
  const user = await currentUser();
  return {
    mode: "clerk",
    userId,
    name: user?.fullName ?? "",
    firstName: user?.firstName?.trim() || null,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
    imageUrl: user?.imageUrl ?? null,
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
