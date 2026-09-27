import type { Metadata } from "next";
import { BornesManager } from "@/components/features/admin/BornesManager";
import { PageHeader } from "@/components/shell/PageHeader";
import { ErrorState } from "@/components/states/States";
import { loadPlatform } from "@/lib/data/load";

export const metadata: Metadata = { title: "Bornes" };

export default async function AdminBornesPage() {
  const result = await loadPlatform(async (r) => {
    const [bornes, organizations] = await Promise.all([r.listAllBornes(), r.listOrganizations()]);
    bornes.sort((a, b) => a.identifier.localeCompare(b.identifier));
    return { bornes, organizations: organizations.map(({ id, name }) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)) };
  });

  return (
    <>
      <PageHeader kicker="Plateforme" title="Bornes" description="Le parc de bornes de toutes les organisations : installation, emplacement et statut." />
      {result.ok ? <BornesManager {...result.data} /> : <ErrorState error={result.error} />}
    </>
  );
}
