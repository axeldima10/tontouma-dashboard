import type { Metadata } from "next";
import { Suspense } from "react";
import { Greeting } from "@/components/overview/Greeting";
import { OrgOverviewSkeleton } from "@/components/overview/OverviewSkeleton";
import { OrgOverviewView } from "@/components/overview/OrgOverviewView";
import { ErrorState } from "@/components/states/ErrorState";
import { settle } from "@/lib/api/errors";
import { getOrgOverview } from "@/lib/api/queries/overview";
import { hasSuperAdminRole } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { formatLongToday } from "@/lib/format";

export const metadata: Metadata = { title: "Vue d’ensemble" };

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
    </>
  );
}
