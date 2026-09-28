import type { Metadata } from "next";
import { ServicesBoard } from "@/components/features/services/ServicesBoard";
import { ErrorState } from "@/components/states/ErrorState";
import { loadOrg } from "@/lib/data/load";

export const metadata: Metadata = { title: "Services & démarches" };

export default async function ServicesPage({ params }: PageProps<"/dashboard/[orgId]/services">) {
  const { orgId } = await params;
  const { context, result } = await loadOrg(orgId, async (r, ctx) => {
    const [departements, services, procedures] = await Promise.all([
      r.listDepartements(ctx),
      r.listServices(ctx),
      r.listProcedures(ctx),
    ]);
    return { departements, services, procedures: procedures.map(({ id, serviceId, active }) => ({ id, serviceId, active })) };
  });
  if (!result.ok) return <ErrorState error={result.error} />;
  return <ServicesBoard basePath={`/dashboard/${context.orgId}`} {...result.data} />;
}
