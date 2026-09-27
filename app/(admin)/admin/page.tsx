import type { Metadata } from "next";
import { AdminOverview } from "@/components/features/admin/AdminOverview";
import { PageHeader } from "@/components/shell/PageHeader";
import { ErrorState } from "@/components/states/States";
import { loadPlatform } from "@/lib/data/load";
import { formatLongToday } from "@/lib/format";

export const metadata: Metadata = { title: "Tableau de bord" };

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
    </>
  );
}
