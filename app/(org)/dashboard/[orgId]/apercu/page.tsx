import type { Metadata } from "next";
import { PublicPreview } from "@/components/features/public/PublicPreview";
import { PageHeader } from "@/components/shell/PageHeader";
import { ErrorState, StatePanel } from "@/components/states/States";
import { ApiError, settle } from "@/lib/api/errors";
import { requireOrgContext } from "@/lib/auth/guards";
import { loadMe } from "@/lib/data/me";
import { repo } from "@/lib/data/repository";
import { EyeOff } from "lucide-react";

export const metadata: Metadata = { title: "Aperçu public" };

export default async function PublicPreviewPage({ params, searchParams }: PageProps<"/dashboard/[orgId]/apercu">) {
  const { orgId } = await params;
  const search = await searchParams;
  const query = typeof search.q === "string" ? search.q.slice(0, 100) : "";
  const procedureId = typeof search.procedure === "string" ? search.procedure : null;
  const context = await requireOrgContext(orgId);
  const basePath = `/dashboard/${context.orgId}`;

  // L'identifiant backend de l'organisation vient de GET /me (jamais de l'URL).
  const me = await loadMe(context.session);
  if (!me.ok || !me.data.organizationId) {
    return (
      <>
        <PageHeader kicker="Contenu" title="Aperçu public" />
        {me.ok ? (
          <StatePanel icon={<EyeOff />} tone="warning" title="Organisation non reliée au backend" description="GET /me ne renvoie pas d’organisation : vérifiez la page « Mon compte »." />
        ) : (
          <ErrorState error={me.error} />
        )}
      </>
    );
  }
  const organizationId = me.data.organizationId;

  const result = await settle(
    (async () => {
      const r = await repo();
      try {
        const [organization, services, procedures, selected] = await Promise.all([
          r.getPublicOrganization(organizationId),
          r.listPublicServices(organizationId),
          r.listPublicProcedures(organizationId, query || undefined),
          procedureId
            ? Promise.all([r.getPublicProcedure(procedureId), r.getPublicForm(procedureId)])
                .then(([procedure, form]) => ({ procedure, form }))
                .catch(() => null)
            : Promise.resolve(null),
        ]);
        return { organization, services, procedures, selected };
      } catch (error) {
        // 404 public : organisation désactivée → les citoyens ne voient rien.
        if (error instanceof ApiError && error.kind === "notFound") return null;
        throw error;
      }
    })(),
  );

  if (!result.ok) {
    return (
      <>
        <PageHeader kicker="Contenu" title="Aperçu public" />
        <ErrorState error={result.error} />
      </>
    );
  }
  if (!result.data) {
    return (
      <>
        <PageHeader kicker="Contenu" title="Aperçu public" />
        <StatePanel
          icon={<EyeOff />}
          tone="warning"
          title="Invisible pour les citoyens"
          description="Les endpoints publics répondent 404 : l’organisation est désactivée. Les bornes et l’application citoyenne n’affichent rien tant qu’elle n’est pas réactivée par l’équipe Tontouma."
        />
      </>
    );
  }
  return <PublicPreview basePath={basePath} query={query} {...result.data} />;
}
