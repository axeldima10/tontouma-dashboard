import type { Metadata } from "next";
import { KiosksManager } from "@/components/features/kiosks/KiosksManager";
import { ForbiddenState } from "@/components/states";
import { ErrorState } from "@/components/states/ErrorState";
import { loadSuperAdmin } from "@/lib/data/load";

export const metadata: Metadata = { title: "Bornes & QR codes" };

export default async function KiosksPage({ params }: PageProps<"/dashboard/[orgId]/bornes">) {
  const { orgId } = await params;
  const page = await loadSuperAdmin(orgId, async (r, ctx) => {
    const [bornes, qrcodes, subscription, services, procedures] = await Promise.all([
      r.listBornes(ctx),
      r.listQRCodes(ctx),
      r.getSubscription(ctx),
      r.listServices(ctx),
      r.listProcedures(ctx),
    ]);
    return {
      bornes,
      qrcodes,
      limit: subscription.plan.limiteBornes,
      services: services.map(({ id, nom }) => ({ id, nom })),
      procedures: procedures.map(({ id, title }) => ({ id, title })),
    };
  });
  if (page.forbidden) return <ForbiddenState reason="role" backHref={`/dashboard/${page.context.orgId}`} />;
  if (!page.result.ok) return <ErrorState error={page.result.error} />;
  return <KiosksManager {...page.result.data} />;
}
