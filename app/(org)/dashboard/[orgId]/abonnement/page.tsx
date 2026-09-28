import type { Metadata } from "next";
import { SubscriptionView } from "@/components/features/subscription/SubscriptionView";
import { ForbiddenState } from "@/components/states";
import { ErrorState } from "@/components/states/ErrorState";
import { loadSuperAdmin } from "@/lib/data/load";

export const metadata: Metadata = { title: "Abonnement" };

export default async function SubscriptionPage({ params }: PageProps<"/dashboard/[orgId]/abonnement">) {
  const { orgId } = await params;
  const page = await loadSuperAdmin(orgId, (r, ctx) => r.getSubscription(ctx));
  if (page.forbidden) return <ForbiddenState reason="role" backHref={`/dashboard/${page.context.orgId}`} />;
  if (!page.result.ok) return <ErrorState error={page.result.error} />;
  return <SubscriptionView data={page.result.data} />;
}
