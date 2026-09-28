import type { Metadata } from "next";
import { ServicesBoard } from "@/components/features/services/ServicesBoard";
<<<<<<< HEAD
import { PageHeader } from "@/components/shell/PageHeader";
import { ErrorState } from "@/components/states/States";
=======
import { ErrorState } from "@/components/states/ErrorState";
>>>>>>> 939f032 (First Commit)
import { loadOrg } from "@/lib/data/load";

export const metadata: Metadata = { title: "Services & démarches" };

export default async function ServicesPage({ params }: PageProps<"/dashboard/[orgId]/services">) {
  const { orgId } = await params;
  const { context, result } = await loadOrg(orgId, async (r, ctx) => {
<<<<<<< HEAD
    const [departments, services, procedures] = await Promise.all([r.listDepartments(ctx), r.listServices(ctx), r.listProcedures(ctx)]);
    return { departments, services, procedures: procedures.map(({ serviceId, active }) => ({ serviceId, active })) };
  });

  if (!result.ok) {
    return (
      <>
        <PageHeader kicker="Contenu" title="Services & démarches" />
        <ErrorState error={result.error} />
      </>
    );
  }
=======
    const [departements, services, procedures] = await Promise.all([
      r.listDepartements(ctx),
      r.listServices(ctx),
      r.listProcedures(ctx),
    ]);
    return { departements, services, procedures: procedures.map(({ id, serviceId, active }) => ({ id, serviceId, active })) };
  });
  if (!result.ok) return <ErrorState error={result.error} />;
>>>>>>> 939f032 (First Commit)
  return <ServicesBoard basePath={`/dashboard/${context.orgId}`} {...result.data} />;
}
