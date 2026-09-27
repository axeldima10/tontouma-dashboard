import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrganizationDetail } from "@/components/features/admin/OrganizationDetail";
import { ErrorState } from "@/components/states/States";
import { ApiError } from "@/lib/api/errors";
import { loadPlatform } from "@/lib/data/load";

export const metadata: Metadata = { title: "Organisation" };

export default async function OrganizationPage({ params }: PageProps<"/admin/organisations/[id]">) {
  const { id } = await params;
  const result = await loadPlatform(async (r) => {
    try {
      const [organization, bornes, plans, members] = await Promise.all([
        r.getOrganization(id),
        r.listAllBornes(id),
        r.listPlans(),
        // Les membres viennent de Clerk via le backend : une panne (502) ne doit pas masquer le reste.
        r.listMembers(id).catch(() => null),
      ]);
      return { organization, bornes, plans, members };
    } catch (error) {
      if (error instanceof ApiError && error.kind === "notFound") return null;
      throw error;
    }
  });

  if (!result.ok) return <ErrorState error={result.error} />;
  if (!result.data) notFound();
  return <OrganizationDetail {...result.data} />;
}
