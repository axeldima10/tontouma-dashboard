/**
 * Modèles d'affichage (view models) des écrans.
 * Ce ne sont PAS les schémas du backend : ceux-ci seront générés depuis
 * docs/tontouma-bot-api-contract-complete.yaml, puis convertis vers ces types
 * dans un seul mapper par écran. TODO(contract).
 */

export type OrgAccessStatus = {
  /** Organisation active ou suspendue par la plateforme. */
  organisation: "active" | "suspendue";
  /** État de l'abonnement. */
  abonnement: "actif" | "expire" | "en_attente";
  /** Date de fin de l'abonnement, ISO. */
  finAbonnement: string | null;
};

export type OrgIdentity = {
  nom: string;
  type: string;
  description: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  siteWeb: string | null;
  logoUrl: string | null;
  statut: "active" | "suspendue";
};

export type Usage = { utilise: number; limite: number | null };

export type OrgOverview = {
  identite: OrgIdentity;
  services: { publies: number; brouillons: number };
  demarches: { publiees: number; brouillons: number };
  documents: { indexes: number; enCours: number; erreurs: number };
  plans: { total: number; servicesSansPosition: number };
  bornes: { actives: number; total: number; limite: number | null };
  abonnement: {
    plan: string;
    statut: OrgAccessStatus["abonnement"];
    debut: string;
    fin: string;
    prochainRenouvellement: string | null;
    montant: number;
    membres: Usage;
    bornes: Usage;
  } | null;
};

export type AdminOverview = {
  organisations: {
    total: number;
    actives: number;
    suspendues: number;
    nouveauxCeMois: number;
    parType: { type: string; total: number }[];
    recentes: { id: string; nom: string; type: string; creeLe: string }[];
  };
  demandes: {
    enAttente: number;
    liste: { id: string; organisation: string; type: string; contact: string; recueLe: string }[];
  };
  bornes: {
    total: number;
    actives: number;
    liste: { id: string; nom: string; organisation: string; statut: "active" | "inactive" | "maintenance" }[];
  };
};
