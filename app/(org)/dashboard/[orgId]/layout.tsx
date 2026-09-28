<<<<<<< HEAD
import { cookies } from "next/headers";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { AppShell } from "@/components/shell/AppShell";
import { ReadOnlyBanner, ReadOnlyProvider } from "@/components/states/ReadOnly";
import { requireOrgContext } from "@/lib/auth/guards";
import { getAccessState } from "@/lib/data/load";
import { isApiConfigured } from "@/lib/api/server";
import { SIDEBAR_COOKIE } from "@/lib/nav";

/** Détecte une seule fois le mode lecture seule plutôt que de laisser chaque formulaire échouer en 403. */
export default async function OrgLayout({ children, params }: LayoutProps<"/dashboard/[orgId]">) {
  const { orgId } = await params;
  const context = await requireOrgContext(orgId);
  const [access, cookieStore] = await Promise.all([getAccessState(context.orgId), cookies()]);

  return (
    <SessionProvider session={context.session}>
      <AppShell
        variant="org"
        basePath={`/dashboard/${context.orgId}`}
        isSuperAdmin={context.isSuperAdmin}
        initialCollapsed={cookieStore.get(SIDEBAR_COOKIE)?.value === "1"}
        demo={!isApiConfigured()}
      >
        <ReadOnlyProvider reason={access.readOnly}>
          <ReadOnlyBanner reason={access.readOnly} />
=======
import { SessionProvider } from "@/components/auth/SessionProvider";
import { AppShell } from "@/components/shell/AppShell";
import { ReadOnlyBanner, ReadOnlyProvider, type ReadOnlyReason } from "@/components/states/ReadOnly";
import { getOrgAccessStatus } from "@/lib/api/queries/overview";
import { requireOrgContext } from "@/lib/auth/guards";

/** Détecte une seule fois le mode lecture seule plutôt que de laisser chaque formulaire échouer en 403. */
async function readOnlyReason(orgKey: string): Promise<ReadOnlyReason> {
  try {
    const status = await getOrgAccessStatus(orgKey);
    if (status.organisation === "suspendue") return "suspendue";
    if (status.abonnement === "expire") return "expire";
    return null;
  } catch {
    // Statut inconnu : le backend refusera toute écriture interdite ; les écrans gèrent le 403.
    return null;
  }
}

export default async function OrgLayout({ children, params }: LayoutProps<"/dashboard/[orgId]">) {
  const { orgId } = await params;
  const context = await requireOrgContext(orgId);
  const reason = await readOnlyReason(context.orgId);

  return (
    <SessionProvider session={context.session}>
      <AppShell variant="org" basePath={`/dashboard/${context.orgId}`} isSuperAdmin={context.isSuperAdmin}>
        <ReadOnlyProvider reason={reason}>
          <ReadOnlyBanner reason={reason} />
>>>>>>> 939f032 (First Commit)
          {children}
        </ReadOnlyProvider>
      </AppShell>
    </SessionProvider>
  );
}
