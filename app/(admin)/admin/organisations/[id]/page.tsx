import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrganizationDetail } from "@/components/features/admin/OrganizationDetail";
import { ErrorState } from "@/components/states/ErrorState";
import { ApiError } from "@/lib/api/errors";
import { loadPlatform } from "@/lib/data/load";

export const metadata: Metadata = { title: "Organisation" };

export default async function OrganizationPage({ params }: PageProps<"/admin/organisations/[id]">) {
  const { id } = await params;
  const result = await loadPlatform((r) =>
    r.getOrganizationById(id).catch((error: unknown) => {
      if (error instanceof ApiError && error.kind === "notFound") return null;
      throw error;
    }),
  );
  if (!result.ok) return <ErrorState error={result.error} />;
  if (!result.data) notFound();
  return <OrganizationDetail organization={result.data} />;
}
