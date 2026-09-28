import type { Metadata } from "next";
<<<<<<< HEAD
import { OrgOverview } from "@/components/features/overview/OrgOverview";
import { PageHeader } from "@/components/shell/PageHeader";
import { ErrorState } from "@/components/states/States";
import { getAccessState, loadOrg } from "@/lib/data/load";
=======
import { Suspense } from "react";
import { Greeting } from "@/components/overview/Greeting";
import { OrgOverviewSkeleton } from "@/components/overview/OverviewSkeleton";
import { OrgOverviewView } from "@/components/overview/OrgOverviewView";
import { ErrorState } from "@/components/states/ErrorState";
import { settle } from "@/lib/api/errors";
import { getOrgOverview } from "@/lib/api/queries/overview";
import { hasSuperAdminRole } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
>>>>>>> 939f032 (First Commit)
import { formatLongToday } from "@/lib/format";

export const metadata: Metadata = { title: "Vue d’ensemble" };

<<<<<<< HEAD
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
=======
async function OverviewSection({ orgKey, basePath, isSuperAdmin }: { orgKey: string; basePath: string; isSuperAdmin: boolean }) {
  const result = await settle(getOrgOverview({ orgKey }, isSuperAdmin));
  if (!result.ok) return <ErrorState error={result.error} />;
  return <OrgOverviewView data={result.data} basePath={basePath} isSuperAdmin={isSuperAdmin} />;
}

export default async function OrgOverviewPage({ params }: PageProps<"/dashboard/[orgId]">) {
  const { orgId } = await params;
  const [session, isSuperAdmin] = await Promise.all([getSession(), hasSuperAdminRole()]);
  const firstName = session?.firstName;

  return (
    <>
      <Greeting
        kicker={formatLongToday()}
        title={firstName ? `Bonjour, ${firstName}` : "Bonjour"}
        subtitle="Voici ce que l’assistant sait de votre organisation aujourd’hui."
      />
      <Suspense fallback={<OrgOverviewSkeleton />}>
        <OverviewSection orgKey={orgId} basePath={`/dashboard/${orgId}`} isSuperAdmin={isSuperAdmin} />
      </Suspense>
>>>>>>> 939f032 (First Commit)
    </>
  );
}
