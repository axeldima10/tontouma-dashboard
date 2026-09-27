import type { Metadata } from "next";
import { DocumentsLibrary } from "@/components/features/documents/DocumentsLibrary";
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
}
