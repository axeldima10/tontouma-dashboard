<<<<<<< HEAD
"use client";

import { CalendarDays, Check, FileText, MonitorSmartphone, ShieldCheck, Users } from "lucide-react";
import { CountUp, Stagger, StaggerItem } from "@/components/motion/Motion";
import { PageHeader } from "@/components/shell/PageHeader";
import { UsageMeter } from "@/components/ui/Metrics";
import { StatusPill } from "@/components/ui/StatusPill";
import type { Statistics, Subscription } from "@/lib/api/contract";
import { BILLING_PERIOD_LABELS, BILLING_PERIOD_NAMES, formatDay } from "@/lib/format";

const STATUS = {
  ACTIVE: { label: "Actif", tone: "success", text: "Votre abonnement est actif : publication et modifications sont ouvertes." },
  REMPLACEE: { label: "Remplacé", tone: "warning", text: "Cet abonnement a été remplacé. Contactez l’équipe Tontouma pour vérifier votre plan actuel." },
  ANNULEE: { label: "Annulé", tone: "danger", text: "Cet abonnement est annulé : le tableau de bord est en lecture seule." },
} as const;

/** Abonnement en lecture seule : plan, statut, date de début, limites et consommation. Aucun paiement ici. */
export function SubscriptionView({ subscription, statistics }: { subscription: Subscription; statistics: Statistics | null }) {
  const { plan } = subscription;
  const status = STATUS[subscription.status];
  const bornes = statistics ? statistics.borneActiveCount + statistics.borneMaintenanceCount + statistics.borneOutOfServiceCount : null;

  return (
    <>
      <PageHeader kicker="Gestion" title="Abonnement" description="Votre plan, ses limites et votre consommation. Le paiement se fait avec l’équipe Tontouma." />

      <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <StaggerItem className="lg:col-span-3">
          <section className="relative h-full overflow-hidden rounded-[30px] bg-primary p-7 text-primary-foreground shadow-[0_28px_56px_-28px_var(--primary)] sm:p-9">
            <span aria-hidden className="absolute -top-24 -right-20 size-72 rounded-full bg-[radial-gradient(closest-side,var(--brand),transparent)] opacity-50" />
            <span aria-hidden className="absolute -bottom-28 left-10 size-72 rounded-full bg-[radial-gradient(closest-side,#6fb8c4,transparent)] opacity-25" />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider uppercase backdrop-blur-md">
                  {BILLING_PERIOD_NAMES[plan.billingPeriod]}
                </span>
                <StatusPill tone={status.tone} className="bg-white/90">
                  {status.label}
                </StatusPill>
              </div>
              <p className="mt-8 text-sm opacity-75">Plan</p>
              <h2 className="text-[40px] leading-tight font-light tracking-[-0.03em]">{plan.name}</h2>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="tabular text-3xl font-semibold tracking-tight">
                  <CountUp value={plan.amount ?? 0} currency />
                </span>
                <span className="opacity-75">/ {BILLING_PERIOD_LABELS[plan.billingPeriod]}</span>
              </p>
              {plan.description && <p className="mt-4 max-w-md text-sm leading-relaxed opacity-80">{plan.description}</p>}
              <p className="mt-8 flex items-center gap-2 text-sm opacity-80">
                <CalendarDays className="size-4" aria-hidden /> Depuis le {formatDay(subscription.startDate)}
              </p>
            </div>
          </section>
        </StaggerItem>

        <StaggerItem className="lg:col-span-2">
          <section className="glass h-full rounded-[30px] p-6 sm:p-7">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Limites et consommation</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">{status.text}</p>
            <div className="mt-6 space-y-5">
              {bornes !== null && <UsageMeter label="Bornes" used={bornes} limit={plan.maxBornes} icon={<MonitorSmartphone />} />}
              {statistics && <UsageMeter label="Documents de référence" used={statistics.knowledgeDocumentCount} limit={plan.maxAiDocuments} icon={<FileText />} />}
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <Users className="size-4 text-muted-foreground" aria-hidden /> Administrateurs
                </span>
                <span className="text-muted-foreground">
                  jusqu’à <b className="tabular font-semibold text-foreground">{plan.maxAdmins ?? "∞"}</b>
                </span>
              </div>
            </div>
          </section>
        </StaggerItem>

        {plan.features.length > 0 && (
          <StaggerItem className="lg:col-span-5">
            <section className="surface p-6 sm:p-7">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-foreground">
                <ShieldCheck className="size-4 text-brand-ink" aria-hidden /> Inclus dans votre plan
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[...plan.features]
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((feature) => (
                    <li key={feature.id} className="flex items-center gap-3 rounded-[16px] bg-muted px-4 py-3 text-sm text-foreground">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-on-brand">
                        <Check className="size-3.5" aria-hidden />
                      </span>
                      {feature.label}
                    </li>
                  ))}
              </ul>
            </section>
          </StaggerItem>
        )}
      </Stagger>
=======
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
>>>>>>> 939f032 (First Commit)
    </>
  );
}
