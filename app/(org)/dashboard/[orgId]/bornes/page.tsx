import type { Metadata } from "next";
import { OrgBornes } from "@/components/features/bornes/OrgBornes";
import { PageHeader } from "@/components/shell/PageHeader";
import { ErrorState, ForbiddenState } from "@/components/states/States";
import { getAccessState, loadSuperAdmin } from "@/lib/data/load";

export const metadata: Metadata = { title: "Bornes" };

export default async function BornesPage({ params }: PageProps<"/dashboard/[orgId]/bornes">) {
  const { orgId } = await params;
  const load = await loadSuperAdmin(orgId, async (r, ctx) => {
    const [bornes, access] = await Promise.all([r.listBornes(ctx), getAccessState(ctx.orgKey)]);
    return { bornes, limit: access.subscription?.plan.maxBornes ?? null };
  });

  if (load.forbidden) return <ForbiddenState reason="role" backHref={`/dashboard/${load.context.orgId}`} />;
  if (!load.result.ok) {
    return (
      <>
        <PageHeader kicker="Gestion" title="Bornes" />
        <ErrorState error={load.result.error} />
      </>
    );
  }
  return <OrgBornes {...load.result.data} now={new Date().toISOString()} />;
}
