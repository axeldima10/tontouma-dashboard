import type { Metadata } from "next";
import { SubscriptionView } from "@/components/features/subscription/SubscriptionView";
import { PageHeader } from "@/components/shell/PageHeader";
import { ErrorState, ForbiddenState } from "@/components/states/States";
import { loadSuperAdmin } from "@/lib/data/load";

export const metadata: Metadata = { title: "Abonnement" };

export default async function SubscriptionPage({ params }: PageProps<"/dashboard/[orgId]/abonnement">) {
  const { orgId } = await params;
  const load = await loadSuperAdmin(orgId, async (r, ctx) => {
    const [subscription, statistics] = await Promise.all([r.getSubscription(ctx), r.getStatistics(ctx).catch(() => null)]);
    return { subscription, statistics };
  });

  if (load.forbidden) return <ForbiddenState reason="role" backHref={`/dashboard/${load.context.orgId}`} />;
  if (!load.result.ok) {
    return (
      <>
        <PageHeader kicker="Gestion" title="Abonnement" />
        <ErrorState error={load.result.error} />
      </>
    );
  }
  return <SubscriptionView {...load.result.data} />;
}
