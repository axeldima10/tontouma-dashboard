import "server-only";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isSuperAdminRole } from "./roles";
import { getSession } from "./session";
import type { Session } from "./types";

export type OrgContext = {
  session: Session;
  orgId: string;
  orgRole: string | null;
  isSuperAdmin: boolean;
};

/** Contrôle d'accès au niveau de la ressource (layout / page), et non dans le proxy. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (session) return session;
  // Seul le mode Clerk peut ne pas avoir de session.
  const { redirectToSignIn } = await auth();
  return redirectToSignIn();
}

/**
 * Réconcilie l'identifiant d'organisation de l'URL avec l'organisation active.
 * L'URL sert uniquement à la navigation : en cas d'écart, on redirige vers l'organisation active.
 */
export async function requireOrgContext(urlOrgId: string): Promise<OrgContext> {
  const session = await requireSession();
  if (!session.orgId) redirect("/dashboard");
  if (session.orgId !== urlOrgId) redirect(`/dashboard/${session.orgId}`);
  return {
    session,
    orgId: session.orgId,
    orgRole: session.orgRole,
    isSuperAdmin: isSuperAdminRole(session.orgRole),
  };
}

/** Pour masquer / refuser côté UI. Le backend reste seul juge. */
export async function hasSuperAdminRole(): Promise<boolean> {
  return isSuperAdminRole((await getSession())?.orgRole);
}

export async function isPlatformAdmin(): Promise<boolean> {
  return (await getSession())?.isPlatformAdmin ?? false;
}
