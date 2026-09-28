import type { Metadata } from "next";
import { DocumentsLibrary } from "@/components/features/documents/DocumentsLibrary";
<<<<<<< HEAD
import { PageHeader } from "@/components/shell/PageHeader";
import { ErrorState } from "@/components/states/States";
import { getAccessState, loadOrg } from "@/lib/data/load";

export const metadata: Metadata = { title: "Base de connaissances" };

export default async function DocumentsPage({ params }: PageProps<"/dashboard/[orgId]/documents">) {
  const { orgId } = await params;
  const { context, result } = await loadOrg(orgId, async (r, ctx) => {
    const [documents, procedures, access] = await Promise.all([r.listDocuments(ctx), r.listProcedures(ctx), getAccessState(ctx.orgKey)]);
    documents.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const cited = new Set(documents.map((d) => d.sourceProcedureId).filter(Boolean));
    return {
      documents,
      limit: access.subscription?.plan.maxAiDocuments ?? null,
      procedures: Object.fromEntries(procedures.filter((p) => cited.has(p.id)).map((p) => [p.id, { title: p.title, serviceId: p.serviceId }])),
    };
  });

  if (!result.ok) {
    return (
      <>
        <PageHeader kicker="Contenu" title="Base de connaissances" />
        <ErrorState error={result.error} />
      </>
    );
  }
  return <DocumentsLibrary basePath={`/dashboard/${context.orgId}`} {...result.data} />;
=======
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
>>>>>>> 939f032 (First Commit)
}
