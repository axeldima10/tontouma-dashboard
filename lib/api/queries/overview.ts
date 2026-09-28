import "server-only";
import { cache } from "react";
import { repo, type OrgCtx } from "@/lib/data/repository";
import type { AdminOverview, OrgAccessStatus, OrgOverview } from "./types";

/** Statut d'accès (suspension, abonnement) — détermine le mode lecture seule. Mémorisé par requête. */
export const getOrgAccessStatus = cache(async (orgKey: string): Promise<OrgAccessStatus> => {
  return (await repo()).getAccessStatus({ orgKey });
});

/** Vue d'ensemble composée à partir des listes (aucune règle métier : simples comptages d'affichage). */
export async function getOrgOverview(ctx: OrgCtx, withSubscription: boolean): Promise<OrgOverview> {
  const r = await repo();
  const [organization, services, procedures, documents, plans, bornes, subscription] = await Promise.all([
    r.getOrganization(ctx),
    r.listServices(ctx),
    r.listProcedures(ctx),
    r.listDocuments(ctx),
    r.listPlans(ctx),
    withSubscription ? r.listBornes(ctx) : Promise.resolve([]),
    withSubscription ? r.getSubscription(ctx) : Promise.resolve(null),
  ]);

  const placedServices = new Set<string>();
  if (plans.length > 0) {
    const details = await Promise.all(plans.map((plan) => r.getPlan(ctx, plan.id)));
    details.forEach((plan) =>
      plan.positions.filter((p) => p.entite_type === "service").forEach((p) => placedServices.add(p.entite_id)),
    );
  }

  return {
    identite: {
      nom: organization.nom,
      type: organization.type,
      description: organization.description,
      adresse: organization.adresse,
      telephone: organization.telephone,
      email: organization.email,
      siteWeb: organization.siteWeb,
      logoUrl: organization.logo_url,
      statut: organization.statut,
    },
    services: {
      publies: services.filter((s) => s.statut_publication === "publie").length,
      brouillons: services.filter((s) => s.statut_publication === "brouillon").length,
    },
    demarches: {
      publiees: procedures.filter((p) => p.active).length,
      brouillons: procedures.filter((p) => !p.active).length,
    },
    documents: {
      indexes: documents.filter((d) => d.statutIndexation === "indexe").length,
      enCours: documents.filter((d) => d.statutIndexation === "en_attente" || d.statutIndexation === "en_cours").length,
      erreurs: documents.filter((d) => d.statutIndexation === "erreur").length,
    },
    plans: {
      total: plans.length,
      servicesSansPosition: plans.length > 0 ? services.filter((s) => !placedServices.has(s.id)).length : services.length,
    },
    bornes: {
      actives: bornes.filter((b) => b.statut === "active").length,
      total: bornes.length,
      limite: subscription?.plan.limiteBornes ?? null,
    },
    abonnement: subscription && {
      plan: subscription.plan.nom,
      statut:
        subscription.abonnement.statut === "active"
          ? "actif"
          : subscription.abonnement.statut === "expiree"
            ? "expire"
            : "en_attente",
      debut: subscription.abonnement.dateDebut,
      fin: subscription.abonnement.dateFin,
      prochainRenouvellement: subscription.abonnement.prochainRenouvellement,
      montant: subscription.abonnement.montant,
      membres: { utilise: subscription.usage.membres, limite: subscription.plan.limiteUtilisateurs },
      bornes: { utilise: subscription.usage.bornes, limite: subscription.plan.limiteBornes },
    },
  };
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const r = await repo();
  const [organisations, demandes, bornes] = await Promise.all([r.listOrganizations(), r.listDemandes(), r.listAllBornes()]);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const byType = new Map<string, number>();
  organisations.forEach((o) => byType.set(o.type, (byType.get(o.type) ?? 0) + 1));
  const pending = demandes.filter((d) => d.statut === "en_attente");

  return {
    organisations: {
      total: organisations.length,
      actives: organisations.filter((o) => o.statut === "active").length,
      suspendues: organisations.filter((o) => o.statut === "suspendue").length,
      nouveauxCeMois: organisations.filter((o) => new Date(o.dateCreation) >= monthStart).length,
      parType: [...byType.entries()].map(([type, total]) => ({ type, total })).sort((a, b) => b.total - a.total),
      recentes: organisations.slice(0, 4).map((o) => ({ id: o.id, nom: o.nom, type: o.type, creeLe: o.dateCreation })),
    },
    demandes: {
      enAttente: pending.length,
      liste: pending.slice(0, 4).map((d) => ({
        id: d.id,
        organisation: d.nomOrganisation,
        type: d.typeOrganisation ?? "—",
        contact: d.emailContact,
        recueLe: d.dateDemande,
      })),
    },
    bornes: {
      total: bornes.length,
      actives: bornes.filter((b) => b.statut === "active").length,
      liste: bornes.slice(0, 6).map((b) => ({ id: b.id, nom: b.codeUnique, organisation: b.organisation, statut: b.statut })),
    },
  };
}
