import type { Metadata } from "next";
import { DocumentsLibrary } from "@/components/features/documents/DocumentsLibrary";
import { ErrorState } from "@/components/states/ErrorState";
import { loadOrg } from "@/lib/data/load";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage({ params }: PageProps<"/dashboard/[orgId]/documents">) {
  const { orgId } = await params;
  const { result } = await loadOrg(orgId, async (r, ctx) => {
    const [documents, services, procedures] = await Promise.all([r.listDocuments(ctx), r.listServices(ctx), r.listProcedures(ctx)]);
    return {
      documents,
      services: services.map((s) => ({ id: s.id, label: s.nom })),
      procedures: procedures.map((p) => ({ id: p.id, label: p.title, serviceId: p.serviceId })),
    };
  });
  if (!result.ok) return <ErrorState error={result.error} />;
  return <DocumentsLibrary {...result.data} />;
}
