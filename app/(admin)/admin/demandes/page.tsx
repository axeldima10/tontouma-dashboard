import type { Metadata } from "next";
import { AccessRequests } from "@/components/features/admin/AccessRequests";
import { ErrorState } from "@/components/states/ErrorState";
import { loadPlatform } from "@/lib/data/load";

export const metadata: Metadata = { title: "Demandes d’accès" };

export default async function AccessRequestsPage() {
  const result = await loadPlatform((r) => r.listDemandes());
  if (!result.ok) return <ErrorState error={result.error} />;
  return <AccessRequests demandes={result.data} now={new Date().toISOString()} />;
}
