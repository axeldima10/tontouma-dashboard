import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminOverviewView } from "@/components/overview/AdminOverviewView";
import { Greeting } from "@/components/overview/Greeting";
import { AdminOverviewSkeleton } from "@/components/overview/OverviewSkeleton";
import { ErrorState } from "@/components/states/ErrorState";
import { settle } from "@/lib/api/errors";
import { getAdminOverview } from "@/lib/api/queries/overview";
import { formatLongToday } from "@/lib/format";

export const metadata: Metadata = { title: "Tableau de bord" };

async function OverviewSection() {
  const result = await settle(getAdminOverview());
  if (!result.ok) return <ErrorState error={result.error} />;
  // Les durées relatives sont calculées depuis la même horloge côté serveur et client.
  return <AdminOverviewView data={result.data} now={new Date().toISOString()} />;
}

export default function AdminOverviewPage() {
  return (
    <>
      <Greeting kicker={formatLongToday()} title="Bonjour, équipe Tontouma" subtitle="Vue globale de la plateforme." />
      <Suspense fallback={<AdminOverviewSkeleton />}>
        <OverviewSection />
      </Suspense>
    </>
  );
}
