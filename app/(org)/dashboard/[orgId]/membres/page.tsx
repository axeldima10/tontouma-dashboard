import type { Metadata } from "next";
import { MembersManager } from "@/components/features/team/MembersManager";
import { ForbiddenState } from "@/components/states";
import { ErrorState } from "@/components/states/ErrorState";
import { loadSuperAdmin } from "@/lib/data/load";

export const metadata: Metadata = { title: "Membres" };

export default async function MembersPage({ params }: PageProps<"/dashboard/[orgId]/membres">) {
  const { orgId } = await params;
  const page = await loadSuperAdmin(orgId, async (r, ctx) => {
    const [members, invitations, subscription] = await Promise.all([
      r.listMembers(ctx),
      r.listInvitations(ctx),
      r.getSubscription(ctx),
    ]);
    return { members, invitations, limit: subscription.plan.limiteUtilisateurs };
  });
  if (page.forbidden) return <ForbiddenState reason="role" backHref={`/dashboard/${page.context.orgId}`} />;
  if (!page.result.ok) return <ErrorState error={page.result.error} />;
  return <MembersManager {...page.result.data} currentUserId={page.context.session.userId} now={new Date().toISOString()} />;
}
