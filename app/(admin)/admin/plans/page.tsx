import type { Metadata } from "next";
import { PlansManager } from "@/components/features/admin/PlansManager";
import { PageHeader } from "@/components/shell/PageHeader";
import { ErrorState } from "@/components/states/States";
import { loadPlatform } from "@/lib/data/load";

export const metadata: Metadata = { title: "Plans d’abonnement" };

export default async function PlansPage() {
  const result = await loadPlatform(async (r) => {
    const [plans, organizations] = await Promise.all([r.listPlans(), r.listOrganizations()]);
    const usage: Record<string, number> = {};
    for (const org of organizations) if (org.plan) usage[org.plan.id] = (usage[org.plan.id] ?? 0) + 1;
    return { plans, usage };
  });
  if (!result.ok) {
    return (
      <>
        <PageHeader kicker="Plateforme" title="Plans d’abonnement" />
        <ErrorState error={result.error} />
      </>
    );
  }
  return <PlansManager {...result.data} />;
}
