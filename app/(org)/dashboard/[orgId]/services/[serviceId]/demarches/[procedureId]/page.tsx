import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProcedureEditor } from "@/components/features/procedures/ProcedureEditor";
import { ErrorState } from "@/components/states/ErrorState";
import { loadProcedureEditor } from "@/lib/data/procedure-page";

export const metadata: Metadata = { title: "Démarche" };

export default async function ProcedurePage({
  params,
}: PageProps<"/dashboard/[orgId]/services/[serviceId]/demarches/[procedureId]">) {
  const { orgId, serviceId, procedureId } = await params;
  const { context, result } = await loadProcedureEditor(orgId, serviceId, procedureId);
  if (!result.ok) return <ErrorState error={result.error} />;
  if (!result.data || !result.data.procedure) notFound();
  return (
    <ProcedureEditor
      key={result.data.procedure.id}
      basePath={`/dashboard/${context.orgId}`}
      {...result.data}
    />
  );
}
