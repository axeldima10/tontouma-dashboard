import type { Metadata } from "next";
import { PlansList } from "@/components/features/maps/PlansList";
import { ErrorState } from "@/components/states/ErrorState";
import { loadOrg } from "@/lib/data/load";

export const metadata: Metadata = { title: "Plans du bâtiment" };

export default async function PlansPage({ params }: PageProps<"/dashboard/[orgId]/plans">) {
  const { orgId } = await params;
  const { context, result } = await loadOrg(orgId, (r, ctx) => r.listPlans(ctx));
  if (!result.ok) return <ErrorState error={result.error} />;
  return <PlansList plans={result.data} basePath={`/dashboard/${context.orgId}`} />;
}
