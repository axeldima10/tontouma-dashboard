import type { Metadata } from "next";
import { OrganizationsTable } from "@/components/features/admin/OrganizationsTable";
import { ErrorState } from "@/components/states/ErrorState";
import { loadPlatform } from "@/lib/data/load";

export const metadata: Metadata = { title: "Organisations" };

export default async function OrganizationsPage() {
  const result = await loadPlatform((r) => r.listOrganizations());
  if (!result.ok) return <ErrorState error={result.error} />;
  return <OrganizationsTable organizations={result.data} />;
}
