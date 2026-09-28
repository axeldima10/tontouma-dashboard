import type { Metadata } from "next";
import { PlansManager } from "@/components/features/admin/PlansManager";
import { ErrorState } from "@/components/states/ErrorState";
import { loadPlatform } from "@/lib/data/load";

export const metadata: Metadata = { title: "Plans d’abonnement" };

export default async function SubscriptionPlansPage() {
  const result = await loadPlatform((r) => r.listPlansAbonnement());
  if (!result.ok) return <ErrorState error={result.error} />;
  return <PlansManager plans={result.data} />;
}
