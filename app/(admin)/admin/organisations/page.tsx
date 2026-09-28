import type { Metadata } from "next";
import { OrganizationsTable } from "@/components/features/admin/OrganizationsTable";
<<<<<<< HEAD
import { PageHeader } from "@/components/shell/PageHeader";
import { ErrorState } from "@/components/states/States";
=======
import { ErrorState } from "@/components/states/ErrorState";
>>>>>>> 939f032 (First Commit)
import { loadPlatform } from "@/lib/data/load";

export const metadata: Metadata = { title: "Organisations" };

export default async function OrganizationsPage() {
<<<<<<< HEAD
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
=======
  const result = await loadPlatform((r) => r.listOrganizations());
  if (!result.ok) return <ErrorState error={result.error} />;
  return <OrganizationsTable organizations={result.data} />;
>>>>>>> 939f032 (First Commit)
}
