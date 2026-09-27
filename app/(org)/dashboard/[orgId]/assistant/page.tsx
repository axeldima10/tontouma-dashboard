import type { Metadata } from "next";
import { AssistantConsole } from "@/components/features/assistant/AssistantConsole";
import { requireOrgContext } from "@/lib/auth/guards";
import { loadMe } from "@/lib/data/me";

export const metadata: Metadata = { title: "Tester l’assistant" };

export default async function OrgAssistantPage({ params }: PageProps<"/dashboard/[orgId]/assistant">) {
  const { orgId } = await params;
  const context = await requireOrgContext(orgId);
  // L'identifiant backend de l'organisation vient de GET /me, jamais de l'URL.
  const me = await loadMe(context.session);
  const organizationId = me.ok ? me.data.organizationId : null;
  const organizationName = (me.ok ? me.data.organizationName : null) ?? context.session.orgName ?? "Votre organisation";
  return <AssistantConsole mode={{ kind: "org", organizationId, organizationName }} />;
}
