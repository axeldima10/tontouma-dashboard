import type { Metadata } from "next";
<<<<<<< HEAD
import { OrgBornes } from "@/components/features/bornes/OrgBornes";
import { PageHeader } from "@/components/shell/PageHeader";
import { ErrorState, ForbiddenState } from "@/components/states/States";
import { getAccessState, loadSuperAdmin } from "@/lib/data/load";

export const metadata: Metadata = { title: "Bornes" };

export default async function BornesPage({ params }: PageProps<"/dashboard/[orgId]/bornes">) {
  const { orgId } = await params;
  const load = await loadSuperAdmin(orgId, async (r, ctx) => {
    const [bornes, access] = await Promise.all([r.listBornes(ctx), getAccessState(ctx.orgKey)]);
    return { bornes, limit: access.subscription?.plan.maxBornes ?? null };
  });

  if (load.forbidden) return <ForbiddenState reason="role" backHref={`/dashboard/${load.context.orgId}`} />;
  if (!load.result.ok) {
    return (
      <>
        <PageHeader kicker="Gestion" title="Bornes" />
        <ErrorState error={load.result.error} />
      </>
    );
  }
  return <OrgBornes {...load.result.data} now={new Date().toISOString()} />;
=======
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
>>>>>>> 939f032 (First Commit)
}
