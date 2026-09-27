"use server";

import { orgAction, platformAction } from "./run";

export type SearchEntry = { id: string; label: string; hint: string; href: string; kind: "service" | "procedure" | "organization" };

/** Index de la palette de commandes (⌘K) de l'organisation : services et démarches. Lecture seule. */
export async function orgSearchIndex(basePath: string) {
  return orgAction({ revalidate: false }, async (r, ctx) => {
    const [services, procedures] = await Promise.all([r.listServices(ctx), r.listProcedures(ctx)]);
    return [
      ...services.map<SearchEntry>((s) => ({
        id: s.id,
        label: s.name,
        hint: s.departmentName ?? "Service",
        href: `${basePath}/services/${s.id}`,
        kind: "service",
      })),
      ...procedures.map<SearchEntry>((p) => ({
        id: p.id,
        label: p.title,
        hint: p.serviceName ?? "Démarche",
        href: `${basePath}/services/${p.serviceId}/demarches/${p.id}`,
        kind: "procedure",
      })),
    ];
  });
}

/** Index de la palette de commandes de l'administration : organisations. Lecture seule. */
export async function platformSearchIndex() {
  return platformAction(
    async (r) =>
      (await r.listOrganizations()).map<SearchEntry>((o) => ({
        id: o.id,
        label: o.name,
        hint: o.type ?? "Organisation",
        href: `/admin/organisations/${o.id}`,
        kind: "organization",
      })),
    { revalidate: false },
  );
}
