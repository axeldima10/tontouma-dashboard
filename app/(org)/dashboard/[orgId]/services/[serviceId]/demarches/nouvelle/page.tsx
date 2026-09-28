import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProcedureEditor } from "@/components/features/procedures/ProcedureEditor";
import { ErrorState } from "@/components/states/ErrorState";
import { loadProcedureEditor } from "@/lib/data/procedure-page";

export const metadata: Metadata = { title: "Nouvelle démarche" };

export default async function NewProcedurePage({ params }: PageProps<"/dashboard/[orgId]/services/[serviceId]/demarches/nouvelle">) {
  const { orgId, serviceId } = await params;
  const { context, result } = await loadProcedureEditor(orgId, serviceId, null);
  if (!result.ok) return <ErrorState error={result.error} />;
  if (!result.data) notFound();
  return <ProcedureEditor basePath={`/dashboard/${context.orgId}`} {...result.data} />;
}
