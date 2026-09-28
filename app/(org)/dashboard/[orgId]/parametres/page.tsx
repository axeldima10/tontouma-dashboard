import type { Metadata } from "next";
import { SettingsForm } from "@/components/features/settings/SettingsForm";
import { ForbiddenState } from "@/components/states";
import { ErrorState } from "@/components/states/ErrorState";
import { loadSuperAdmin } from "@/lib/data/load";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage({ params }: PageProps<"/dashboard/[orgId]/parametres">) {
  const { orgId } = await params;
  const page = await loadSuperAdmin(orgId, async (r, ctx) => {
    const [organization, documents] = await Promise.all([r.getOrganization(ctx), r.listDocuments(ctx)]);
    return { organization, documents: documents.filter((d) => !d.service_id && !d.procedure_id) };
  });
  if (page.forbidden) return <ForbiddenState reason="role" backHref={`/dashboard/${page.context.orgId}`} />;
  if (!page.result.ok) return <ErrorState error={page.result.error} />;
  return <SettingsForm {...page.result.data} />;
}
