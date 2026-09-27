import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetail } from "@/components/features/services/ServiceDetail";
import { ErrorState } from "@/components/states/States";
import { ApiError } from "@/lib/api/errors";
import { loadOrg } from "@/lib/data/load";

export const metadata: Metadata = { title: "Service" };

export default async function ServicePage({ params }: PageProps<"/dashboard/[orgId]/services/[serviceId]">) {
  const { orgId, serviceId } = await params;
  const { context, result } = await loadOrg(orgId, async (r, ctx) => {
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
}
