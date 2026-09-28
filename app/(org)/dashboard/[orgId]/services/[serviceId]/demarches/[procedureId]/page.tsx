import type { Metadata } from "next";
<<<<<<< HEAD
import { notFound, redirect } from "next/navigation";
import { ProcedureEditor } from "@/components/features/procedures/ProcedureEditor";
import { ErrorState } from "@/components/states/States";
=======
import { notFound } from "next/navigation";
import { ProcedureEditor } from "@/components/features/procedures/ProcedureEditor";
import { ErrorState } from "@/components/states/ErrorState";
>>>>>>> 939f032 (First Commit)
import { loadProcedureEditor } from "@/lib/data/procedure-page";

export const metadata: Metadata = { title: "Démarche" };

<<<<<<< HEAD
export default async function ProcedurePage({ params }: PageProps<"/dashboard/[orgId]/services/[serviceId]/demarches/[procedureId]">) {
  const { orgId, serviceId, procedureId } = await params;
  const { context, result } = await loadProcedureEditor(orgId, serviceId, procedureId);
  if (!result.ok) return <ErrorState error={result.error} />;
  if (!result.data?.procedure) notFound();
  const { procedure } = result.data;
  // L'URL ne fait que naviguer : si la démarche appartient à un autre service, on corrige le chemin.
  if (procedure.serviceId !== serviceId) redirect(`/dashboard/${context.orgId}/services/${procedure.serviceId}/demarches/${procedure.id}`);
  return <ProcedureEditor key={procedure.id} basePath={`/dashboard/${context.orgId}`} {...result.data} />;
=======
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
>>>>>>> 939f032 (First Commit)
}
