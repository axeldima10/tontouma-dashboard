import { CalendarClock, CheckCircle2, FileDown, Receipt, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/states";
import { InfoRow, UsageMeter } from "@/components/ui/Bits";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusPill, type Tone } from "@/components/ui/StatusPill";
import type { Facture, SubscriptionView as View } from "@/lib/data/types";
import { formatDate, formatXOF } from "@/lib/format";
import { Reveal } from "@/lib/motion/Reveal";

const SUB_STATUS: Record<View["abonnement"]["statut"], { tone: Tone; label: string }> = {
  active: { tone: "success", label: "Actif" },
  expiree: { tone: "danger", label: "Expiré" },
  suspendue: { tone: "warning", label: "Suspendu" },
};

const INVOICE_STATUS: Record<Facture["statut"], { tone: Tone; label: string }> = {
  brouillon: { tone: "neutral", label: "Brouillon" },
  emise: { tone: "info", label: "Émise" },
  payee: { tone: "success", label: "Payée" },
  en_retard: { tone: "danger", label: "En retard" },
  annulee: { tone: "neutral", label: "Annulée" },
};

const PERIOD = { mensuel: "mois", trimestriel: "trimestre", annuel: "an" } as const;

/** Lecture seule : aucun bouton de paiement dans cette version (Mobile Money hors périmètre). */
export function SubscriptionView({ data }: { data: View }) {
  const { abonnement, plan, factures, usage } = data;
  const status = SUB_STATUS[abonnement.statut];

  return (
    <>
      <PageHeader title="Abonnement" description="Votre plan, ses limites et vos factures." />
      <Reveal className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <Card className="relative overflow-hidden">
            <div aria-hidden className="absolute -top-24 -right-24 size-64 rounded-full bg-[radial-gradient(closest-side,var(--aurora-a),transparent)]" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-soft-green text-green-ink">
                  <Sparkles className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-medium text-muted">Plan actuel</p>
                  <p className="font-display text-2xl font-semibold text-text">{plan.nom}</p>
                </div>
                <StatusPill tone={status.tone} pulse={abonnement.statut === "active"} className="ml-auto">
                  {status.label}
                </StatusPill>
              </div>
              <p className="font-display tabular mt-5 text-[34px] leading-none font-semibold text-text">
                {formatXOF(abonnement.montant)}
                <span className="ml-1.5 text-base font-medium text-muted">/ {PERIOD[plan.periode]}</span>
              </p>
              {plan.description && <p className="mt-2 text-sm text-muted">{plan.description}</p>}
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {plan.fonctionnalites.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-text">
                    <CheckCircle2 className="size-4 shrink-0 text-green-ink" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card>
            <CardHeader title="Échéances" icon={<CalendarClock />} />
            <dl className="divide-y divide-line">
              <InfoRow label="Début">{formatDate(abonnement.dateDebut)}</InfoRow>
              <InfoRow label="Fin">{formatDate(abonnement.dateFin)}</InfoRow>
              <InfoRow label="Prochain renouvellement">
                {abonnement.prochainRenouvellement ? formatDate(abonnement.prochainRenouvellement) : "—"}
              </InfoRow>
              <InfoRow label="Renouvellement">{abonnement.modeRenouvellement === "automatique" ? "Automatique" : "Manuel"}</InfoRow>
            </dl>
            <p className="mt-4 rounded-xl bg-surface-2 px-3 py-2.5 text-xs text-muted">
              Pour renouveler ou changer de plan, contactez l’équipe Tontouma. Le paiement en ligne arrive prochainement.
            </p>
          </Card>
        </div>

        <Card>
          <CardHeader title="Utilisation des limites" />
          <div className="grid gap-6 sm:grid-cols-2">
            <UsageMeter label="Utilisateurs (membres + invitations)" used={usage.membres} limit={plan.limiteUtilisateurs} />
            <UsageMeter label="Bornes" used={usage.bornes} limit={plan.limiteBornes} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Factures" icon={<Receipt />} />
          {factures.length === 0 ? (
            <EmptyState icon={<Receipt />} title="Aucune facture" description="Vos factures apparaîtront ici après chaque échéance." />
          ) : (
            <>
              <table className="hidden w-full text-left text-sm md:table">
                <thead>
                  <tr className="border-b border-line text-[11px] tracking-[0.1em] text-muted uppercase">
                    <th scope="col" className="pb-3 font-medium">Numéro</th>
                    <th scope="col" className="pb-3 font-medium">Émise le</th>
                    <th scope="col" className="pb-3 font-medium">Échéance</th>
                    <th scope="col" className="pb-3 text-right font-medium">Montant</th>
                    <th scope="col" className="pb-3 font-medium">Statut</th>
                    <th scope="col" className="pb-3 text-right font-medium">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {factures.map((f) => (
                    <tr key={f.id}>
                      <td className="py-3.5 font-mono text-[13px] text-text">{f.numero}</td>
                      <td className="py-3.5 text-muted">{formatDate(f.dateEmission)}</td>
                      <td className="py-3.5 text-muted">{formatDate(f.dateEcheance)}</td>
                      <td className="tabular py-3.5 text-right font-medium text-text">{formatXOF(f.montant)}</td>
                      <td className="py-3.5">
                        <StatusPill tone={INVOICE_STATUS[f.statut].tone}>{INVOICE_STATUS[f.statut].label}</StatusPill>
                      </td>
                      <td className="py-3.5 text-right">
                        {f.fichierPDF ? (
                          <a href={f.fichierPDF} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] font-medium text-green-ink hover:underline">
                            <FileDown className="size-4" aria-hidden /> Télécharger
                          </a>
                        ) : (
                          <span className="text-xs text-subtle">Indisponible</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="space-y-2 md:hidden">
                {factures.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[13px] text-text">{f.numero}</p>
                      <p className="text-xs text-muted">{formatDate(f.dateEmission)}</p>
                    </div>
                    <div className="text-right">
                      <p className="tabular text-sm font-semibold text-text">{formatXOF(f.montant)}</p>
                      <StatusPill tone={INVOICE_STATUS[f.statut].tone}>{INVOICE_STATUS[f.statut].label}</StatusPill>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </Reveal>
    </>
  );
}
