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
    </>
  );
}
