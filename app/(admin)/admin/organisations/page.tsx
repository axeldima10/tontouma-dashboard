import type { Metadata } from "next";
import { OrganizationsTable } from "@/components/features/admin/OrganizationsTable";
import { PageHeader } from "@/components/shell/PageHeader";
import { ErrorState } from "@/components/states/States";
import { loadPlatform } from "@/lib/data/load";

export const metadata: Metadata = { title: "Organisations" };

export default async function OrganizationsPage() {
  const result = await loadPlatform(async (r) => {
    const [organizations, plans] = await Promise.all([r.listOrganizations(), r.listPlans()]);
    organizations.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { organizations, plans };
  });
  if (!result.ok) {
    return (
      <>
        <PageHeader kicker="Plateforme" title="Organisations" />
        <ErrorState error={result.error} />
      </>
    );
  }
  return <OrganizationsTable {...result.data} />;
}
