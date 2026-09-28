import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapEditor } from "@/components/features/maps/MapEditor";
import { ErrorState } from "@/components/states/ErrorState";
import { ApiError } from "@/lib/api/errors";
import { loadOrg } from "@/lib/data/load";

export const metadata: Metadata = { title: "Plan du bâtiment" };

export default async function PlanPage({ params }: PageProps<"/dashboard/[orgId]/plans/[planId]">) {
  const { orgId, planId } = await params;
  const { context, result } = await loadOrg(orgId, async (r, ctx) => {
    const plan = await r.getPlan(ctx, planId).catch((error: unknown) => {
      if (error instanceof ApiError && error.kind === "notFound") return null;
      throw error;
    });
    if (!plan) return null;
    const [services, bornes] = await Promise.all([r.listServices(ctx), r.listBornes(ctx)]);
    return { plan, services, bornes };
  });
  if (!result.ok) return <ErrorState error={result.error} />;
  if (!result.data) notFound();
  return (
    <MapEditor
      key={result.data.plan.id}
      basePath={`/dashboard/${context.orgId}`}
      canPlaceBornes={context.isSuperAdmin}
      {...result.data}
    />
  );
}
