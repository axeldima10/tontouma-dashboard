import type { Metadata } from "next";
<<<<<<< HEAD
import { AdminOverview } from "@/components/features/admin/AdminOverview";
import { PageHeader } from "@/components/shell/PageHeader";
import { ErrorState } from "@/components/states/States";
import { loadPlatform } from "@/lib/data/load";
=======
import { Suspense } from "react";
import { AdminOverviewView } from "@/components/overview/AdminOverviewView";
import { Greeting } from "@/components/overview/Greeting";
import { AdminOverviewSkeleton } from "@/components/overview/OverviewSkeleton";
import { ErrorState } from "@/components/states/ErrorState";
import { settle } from "@/lib/api/errors";
import { getAdminOverview } from "@/lib/api/queries/overview";
>>>>>>> 939f032 (First Commit)
import { formatLongToday } from "@/lib/format";

export const metadata: Metadata = { title: "Tableau de bord" };

<<<<<<< HEAD
export default async function AdminOverviewPage() {
  const result = await loadPlatform(async (r) => {
    const [organizations, plans, bornes] = await Promise.all([r.listOrganizations(), r.listPlans(), r.listAllBornes()]);
    organizations.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { organizations, plans, bornes };
  });

  return (
    <>
      <PageHeader kicker={formatLongToday()} title="Bonjour, équipe Tontouma" description="Vue globale de la plateforme et de ses organisations clientes." />
      {result.ok ? <AdminOverview {...result.data} now={new Date().toISOString()} /> : <ErrorState error={result.error} />}
=======
async function OverviewSection() {
  const result = await settle(getAdminOverview());
  if (!result.ok) return <ErrorState error={result.error} />;
  // Les durées relatives sont calculées depuis la même horloge côté serveur et client.
  return <AdminOverviewView data={result.data} now={new Date().toISOString()} />;
}

export default function AdminOverviewPage() {
  return (
    <>
      <Greeting kicker={formatLongToday()} title="Bonjour, équipe Tontouma" subtitle="Vue globale de la plateforme." />
      <Suspense fallback={<AdminOverviewSkeleton />}>
        <OverviewSection />
      </Suspense>
>>>>>>> 939f032 (First Commit)
    </>
  );
}
