import type { Metadata } from "next";
import { AccountView } from "@/components/features/account/AccountView";
import { isApiConfigured } from "@/lib/api/server";
import { requireOrgContext } from "@/lib/auth/guards";
import { loadMe } from "@/lib/data/me";

export const metadata: Metadata = { title: "Mon compte" };

export default async function OrgAccountPage({ params }: PageProps<"/dashboard/[orgId]/compte">) {
  const { orgId } = await params;
  const { session } = await requireOrgContext(orgId);
  const me = await loadMe(session);
  return (
    <AccountView
      variant="org"
      session={{ mode: session.mode, name: session.name, email: session.email, imageUrl: session.imageUrl, orgId: session.orgId, orgRole: session.orgRole, isPlatformAdmin: session.isPlatformAdmin }}
      me={me}
      demo={!isApiConfigured()}
    />
  );
}
