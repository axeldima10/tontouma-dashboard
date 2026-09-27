import type { Metadata } from "next";
import { OrgOverview } from "@/components/features/overview/OrgOverview";
import { PageHeader } from "@/components/shell/PageHeader";
import { ErrorState } from "@/components/states/States";
import { getAccessState, loadOrg } from "@/lib/data/load";
import { formatLongToday } from "@/lib/format";

export const metadata: Metadata = { title: "Vue d’ensemble" };

export default async function OrgOverviewPage({ params }: PageProps<"/dashboard/[orgId]">) {
  const { orgId } = await params;
  const { context, result } = await loadOrg(orgId, async (r, ctx) => {
    const [statistics, drafts, access] = await Promise.all([
      r.getStatistics(ctx),
      r.listProcedures(ctx, { active: false }),
      getAccessState(ctx.orgKey),
    ]);
    drafts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return { statistics, drafts, subscription: access.subscription };
  });
  const firstName = context.session.firstName;

  return (
    <>
      <PageHeader
        kicker={formatLongToday()}
        title={firstName ? `Bonjour, ${firstName}` : "Bonjour"}
        description="Voici ce que l’assistant sait de votre organisation aujourd’hui."
      />
      {result.ok ? (
        <OrgOverview
          basePath={`/dashboard/${context.orgId}`}
          isSuperAdmin={context.isSuperAdmin}
          now={new Date().toISOString()}
          {...result.data}
        />
      ) : (
        <ErrorState error={result.error} />
      )}
    </>
  );
}
