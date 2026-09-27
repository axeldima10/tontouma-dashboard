"use client";

import { ArrowRight, Building, CreditCard, FileText, Layers, MessagesSquare, MonitorSmartphone, Plus, Sparkles, Upload } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { CountUp, Stagger, StaggerItem } from "@/components/motion/Motion";
import { useReadOnly } from "@/components/states/ReadOnly";
import { Button } from "@/components/ui/Button";
import { KpiTile, ProgressRing, SegmentBar, UsageMeter } from "@/components/ui/Metrics";
import { Tip } from "@/components/ui/Menu";
import { StatusPill } from "@/components/ui/StatusPill";
import type { Procedure, Statistics, Subscription } from "@/lib/api/contract";
import { BILLING_PERIOD_LABELS, formatDay, formatRelative, formatXOF } from "@/lib/format";

type OrgOverviewProps = {
  basePath: string;
  statistics: Statistics;
  drafts: Procedure[];
  subscription: Subscription | null;
  isSuperAdmin: boolean;
  now: string;
};

const SUBSCRIPTION_STATUS = {
  ACTIVE: { label: "Actif", tone: "success" },
  REMPLACEE: { label: "Remplacé", tone: "warning" },
  ANNULEE: { label: "Annulé", tone: "danger" },
} as const;

export function OrgOverview({ basePath, statistics: s, drafts, subscription, isSuperAdmin, now }: OrgOverviewProps) {
  const { readOnly } = useReadOnly();
  const bornes = s.borneActiveCount + s.borneMaintenanceCount + s.borneOutOfServiceCount;
  const published = s.activeProcedureCount;
  const coverage = s.procedureCount > 0 ? Math.round((published / s.procedureCount) * 100) : 0;

  return (
    <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Carte héros : ce que l'assistant sait */}
      <StaggerItem className="lg:col-span-8">
        <section className="glass relative h-full overflow-hidden rounded-[30px] p-6 sm:p-8">
          <span aria-hidden className="hatch pointer-events-none absolute top-0 right-0 h-full w-1/2 opacity-40 [mask-image:linear-gradient(to_left,black,transparent)]" />
          <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center">
            <ProgressRing value={published} max={s.procedureCount} label={`${published} démarches publiées sur ${s.procedureCount}`}>
              <div>
                <p className="tabular text-[44px] leading-none font-light tracking-[-0.04em] text-foreground">
                  <CountUp value={coverage} />
                  <span className="text-2xl text-muted-foreground">%</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">publié</p>
              </div>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <p className="kicker flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-brand-ink" aria-hidden /> Ce que sait l’assistant
              </p>
              <h2 className="mt-2 text-[26px] leading-tight font-light tracking-tight text-foreground">
                <b className="font-semibold">{published}</b> démarche{published > 1 ? "s" : ""} publiée{published > 1 ? "s" : ""} sur{" "}
                <b className="font-semibold">{s.procedureCount}</b>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Seul le contenu publié est expliqué aux citoyens, sur les bornes et sur mobile.
                {drafts.length > 0 && ` ${drafts.length} brouillon${drafts.length > 1 ? "s" : ""} attend${drafts.length > 1 ? "ent" : ""} votre relecture.`}
              </p>
              <dl className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { label: "Départements", value: s.departmentCount, Icon: Building },
                  { label: "Services", value: s.serviceCount, Icon: Layers },
                  { label: "Documents", value: s.knowledgeDocumentCount, Icon: FileText },
                ].map(({ label, value, Icon }) => (
                  <div key={label} className="rounded-[18px] bg-card/70 px-3.5 py-3 shadow-[var(--card-shadow)]">
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Icon className="size-3.5" aria-hidden /> {label}
                    </dt>
                    <dd className="tabular mt-1 text-2xl font-light text-foreground">
                      <CountUp value={value} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      </StaggerItem>

      {/* Conversations */}
      <StaggerItem className="lg:col-span-4">
        <section className="relative h-full overflow-hidden rounded-[30px] bg-primary p-6 text-primary-foreground shadow-[0_24px_48px_-24px_var(--primary)] sm:p-8">
          <span aria-hidden className="absolute -top-16 -right-16 size-48 rounded-full bg-[radial-gradient(closest-side,var(--brand),transparent)] opacity-60" />
          <span aria-hidden className="absolute -bottom-20 -left-10 size-56 rounded-full bg-[radial-gradient(closest-side,#6fb8c4,transparent)] opacity-30" />
          <div className="relative">
            <span className="grid size-11 place-items-center rounded-2xl bg-white/10 backdrop-blur-md">
              <MessagesSquare className="size-5" aria-hidden />
            </span>
            <p className="tabular mt-6 text-[44px] leading-none font-light tracking-[-0.04em]">
              <CountUp value={s.conversationCount} />
            </p>
            <p className="mt-2 text-sm font-semibold">Conversations avec les citoyens</p>
            <p className="mt-1 text-xs opacity-75">
              <CountUp value={s.messageCount} /> messages échangés au total
            </p>
          </div>
        </section>
      </StaggerItem>

      {/* Tuiles */}
      <StaggerItem className="sm:col-span-1 lg:col-span-4">
        <KpiTile icon={<Layers />} accent="brand" label="Services" value={s.serviceCount} hint={`${s.departmentCount} département${s.departmentCount > 1 ? "s" : ""}`} href={`${basePath}/services`} />
      </StaggerItem>
      <StaggerItem className="lg:col-span-4">
        <KpiTile icon={<FileText />} accent="info" label="Documents de référence" value={s.knowledgeDocumentCount} href={`${basePath}/documents`}>
          {subscription && <UsageMeter label="Quota du plan" used={s.knowledgeDocumentCount} limit={subscription.plan.maxAiDocuments} />}
        </KpiTile>
      </StaggerItem>
      <StaggerItem className="lg:col-span-4">
        <KpiTile icon={<MonitorSmartphone />} label="Bornes" value={bornes} href={isSuperAdmin ? `${basePath}/bornes` : undefined}>
          <SegmentBar
            segments={[
              { label: "En service", value: s.borneActiveCount, className: "bg-brand" },
              { label: "Maintenance", value: s.borneMaintenanceCount, className: "bg-[#f5a122]" },
              { label: "Hors service", value: s.borneOutOfServiceCount, className: "bg-destructive" },
            ]}
          />
        </KpiTile>
      </StaggerItem>

      {/* Brouillons à publier */}
      <StaggerItem className="lg:col-span-8">
        <section className="surface h-full p-5 sm:p-6">
          <header className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-foreground">À relire avant publication</h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">Brouillons invisibles des citoyens.</p>
            </div>
            <Button href={`${basePath}/services`} variant="ghost" size="sm">
              Tout voir <ArrowRight className="size-3.5" />
            </Button>
          </header>
          {drafts.length === 0 ? (
            <div className="flex items-center gap-3 rounded-[18px] bg-brand-soft px-4 py-4 text-sm text-brand-ink">
              <Sparkles className="size-4 shrink-0" aria-hidden /> Tout est publié : l’assistant est à jour.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {drafts.slice(0, 5).map((procedure, index) => (
                <motion.li key={procedure.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + index * 0.05 }}>
                  <Link
                    href={`${basePath}/services/${procedure.serviceId}/demarches/${procedure.id}`}
                    className="group -mx-2 flex items-center gap-3 rounded-2xl px-2 py-3 transition hover:bg-accent"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning-soft text-warning">
                      <FileText className="size-[18px]" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{procedure.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {procedure.serviceName} · modifiée {formatRelative(procedure.updatedAt, new Date(now))}
                      </p>
                    </div>
                    <StatusPill tone="warning">Brouillon</StatusPill>
                    <ArrowRight className="size-4 text-subtle transition group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden />
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}
        </section>
      </StaggerItem>

      {/* Abonnement ou raccourcis */}
      <StaggerItem className="lg:col-span-4">
        {isSuperAdmin && subscription ? (
          <section className="glass h-full rounded-[26px] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <CreditCard className="size-[18px]" aria-hidden />
              </span>
              <StatusPill tone={SUBSCRIPTION_STATUS[subscription.status].tone}>{SUBSCRIPTION_STATUS[subscription.status].label}</StatusPill>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">Plan</p>
            <p className="text-2xl font-light tracking-tight text-foreground">{subscription.plan.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatXOF(subscription.plan.amount ?? 0)} / {BILLING_PERIOD_LABELS[subscription.plan.billingPeriod]} · depuis le {formatDay(subscription.startDate)}
            </p>
            <div className="mt-5 space-y-3">
              <UsageMeter label="Bornes" used={bornes} limit={subscription.plan.maxBornes} />
            </div>
            <Button href={`${basePath}/abonnement`} variant="secondary" size="sm" className="mt-5 w-full">
              Détails de l’abonnement
            </Button>
          </section>
        ) : (
          <QuickActions basePath={basePath} disabled={readOnly} />
        )}
      </StaggerItem>

      {isSuperAdmin && subscription && (
        <StaggerItem className="lg:col-span-12">
          <QuickActions basePath={basePath} disabled={readOnly} dock />
        </StaggerItem>
      )}
    </Stagger>
  );
}

/** Raccourcis : dock de verre (comme la barre d'icônes de la référence). */
function QuickActions({ basePath, disabled, dock }: { basePath: string; disabled: boolean; dock?: boolean }) {
  const actions = [
    { label: "Nouveau service", href: `${basePath}/services?nouveau=service`, Icon: Plus },
    { label: "Ajouter un document", href: `${basePath}/documents?nouveau=fichier`, Icon: Upload },
    { label: "Voir les démarches", href: `${basePath}/services`, Icon: Layers },
  ];

  if (dock) {
    return (
      <nav aria-label="Raccourcis" className="flex justify-center">
        <div className="glass flex items-center gap-1.5 rounded-full p-1.5">
          {actions.map(({ label, href, Icon }) => (
            <Tip key={label} content={label}>
              <Link
                href={disabled && href.includes("nouveau") ? "#" : href}
                aria-disabled={disabled && href.includes("nouveau")}
                className="group flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-muted-foreground transition hover:bg-card hover:text-foreground hover:shadow-[var(--card-shadow)] aria-disabled:pointer-events-none aria-disabled:opacity-40"
              >
                <Icon className="size-[18px] transition-transform group-hover:scale-110" aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            </Tip>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <section className="glass h-full rounded-[26px] p-5 sm:p-6">
      <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Raccourcis</h2>
      <ul className="mt-4 space-y-2">
        {actions.map(({ label, href, Icon }) => (
          <li key={label}>
            <Link
              href={href}
              aria-disabled={disabled && href.includes("nouveau")}
              className="group flex items-center gap-3 rounded-2xl bg-card/70 px-3 py-3 text-sm font-medium text-foreground shadow-[var(--card-shadow)] transition hover:-translate-y-0.5 aria-disabled:pointer-events-none aria-disabled:opacity-40"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-accent">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="flex-1">{label}</span>
              <ArrowRight className="size-4 text-subtle transition group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
