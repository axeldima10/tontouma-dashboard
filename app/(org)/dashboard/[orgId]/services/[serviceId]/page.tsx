import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetail } from "@/components/features/services/ServiceDetail";
<<<<<<< HEAD
import { ErrorState } from "@/components/states/States";
=======
import { ErrorState } from "@/components/states/ErrorState";
>>>>>>> 939f032 (First Commit)
import { ApiError } from "@/lib/api/errors";
import { loadOrg } from "@/lib/data/load";

export const metadata: Metadata = { title: "Service" };

export default async function ServicePage({ params }: PageProps<"/dashboard/[orgId]/services/[serviceId]">) {
  const { orgId, serviceId } = await params;
  const { context, result } = await loadOrg(orgId, async (r, ctx) => {
<<<<<<< HEAD
    try {
      const [service, departments, procedures] = await Promise.all([
        r.getService(ctx, serviceId),
        r.listDepartments(ctx),
        r.listProcedures(ctx, { serviceId }),
      ]);
      return { service, departments, procedures };
    } catch (error) {
      if (error instanceof ApiError && error.kind === "notFound") return null;
      throw error;
    }
  });

  if (!result.ok) return <ErrorState error={result.error} />;
  if (!result.data) notFound();
  return <ServiceDetail key={result.data.service.updatedAt} basePath={`/dashboard/${context.orgId}`} {...result.data} />;
=======
    const service = await r.getService(ctx, serviceId).catch((error: unknown) => {
      if (error instanceof ApiError && error.kind === "notFound") return null;
      throw error;
    });
    if (!service) return null;
    const [departements, procedures, documents] = await Promise.all([
      r.listDepartements(ctx),
      r.listProcedures(ctx, { serviceId }),
      r.listDocuments(ctx),
    ]);
    return { service, departements, procedures, documents: documents.filter((d) => d.service_id === serviceId && !d.procedure_id) };
  });
  if (!result.ok) return <ErrorState error={result.error} />;
  if (!result.data) notFound();
  return <ServiceDetail key={result.data.service.id} basePath={`/dashboard/${context.orgId}`} {...result.data} />;
>>>>>>> 939f032 (First Commit)
}
