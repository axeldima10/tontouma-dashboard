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
          {children}
        </ReadOnlyProvider>
      </AppShell>
    </SessionProvider>
  );
}
