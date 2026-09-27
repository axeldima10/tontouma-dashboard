import type { Metadata } from "next";
import { AccountView } from "@/components/features/account/AccountView";
import { isApiConfigured } from "@/lib/api/server";
import { getSession } from "@/lib/auth/session";
import { loadMe } from "@/lib/data/me";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AdminAccountPage() {
  // Le layout /admin a déjà vérifié la session et le rôle plateforme.
  const session = (await getSession())!;
  const me = await loadMe(session);
  return (
    <AccountView
      variant="admin"
      session={{ mode: session.mode, name: session.name, email: session.email, imageUrl: session.imageUrl, orgId: session.orgId, orgRole: session.orgRole, isPlatformAdmin: session.isPlatformAdmin }}
      me={me}
      demo={!isApiConfigured()}
    />
  );
}
