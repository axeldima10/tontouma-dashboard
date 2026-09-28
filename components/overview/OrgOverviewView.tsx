"use client";

import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Globe,
  Layers,
  Loader,
  Mail,
  MapPin,
  MapPinOff,
  MonitorSmartphone,
  Pencil,
  Phone,
  PenLine,
  Map as MapIcon,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { KpiTile } from "@/components/ui/KpiTile";
import { ProgressBar, ProgressRing } from "@/components/ui/Progress";
import { StatusPill } from "@/components/ui/StatusPill";
import type { OrgOverview, Usage } from "@/lib/api/queries/types";
import { cn } from "@/lib/cn";
import { formatDate, formatNumber, formatXOF } from "@/lib/format";
import { Reveal } from "@/lib/motion/Reveal";

type OrgOverviewViewProps = {
  data: OrgOverview;
  basePath: string;
  isSuperAdmin: boolean;
};

export function OrgOverviewView({ data, basePath, isSuperAdmin }: OrgOverviewViewProps) {
  const hasContent = data.services.publies + data.services.brouillons > 0;

  return (
    <div className="space-y-5">
      <Reveal className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <IdentityCard data={data} basePath={basePath} isSuperAdmin={isSuperAdmin} />

        <div className="min-w-0 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <KpiTile
              label="Services publiés"
              value={data.services.publies}
              hint={`${formatNumber(data.services.brouillons)} en brouillon`}
              icon={<Layers />}
              href={`${basePath}/services`}
            />
            <KpiTile
              label="Démarches publiées"
              value={data.demarches.publiees}
              hint={`${formatNumber(data.demarches.brouillons)} en brouillon`}
              icon={<PenLine />}
              tone="info"
              href={`${basePath}/services`}
            />
            <KpiTile
              label="Documents indexés"
              value={data.documents.indexes}
              hint={
                data.documents.erreurs > 0 ? (
                  <span className="text-danger">{formatNumber(data.documents.erreurs)} en erreur</span>
                ) : (
                  "Aucune erreur d’indexation"
                )
              }
              icon={<FileText />}
              tone={data.documents.erreurs > 0 ? "danger" : "violet"}
              href={`${basePath}/documents`}
            />
            {isSuperAdmin ? (
              <KpiTile
                label="Bornes actives"
                value={data.bornes.actives}
                suffix={data.bornes.limite !== null ? `/ ${data.bornes.limite}` : undefined}
                hint={`${formatNumber(data.bornes.total)} installée${data.bornes.total > 1 ? "s" : ""}`}
                icon={<MonitorSmartphone />}
                tone="warning"
                href={`${basePath}/bornes`}
              />
            ) : (
              <KpiTile
                label="Plans du bâtiment"
                value={data.plans.total}
                hint={`${formatNumber(data.plans.servicesSansPosition)} service(s) à placer`}
                icon={<MapIcon />}
                tone="warning"
                href={`${basePath}/plans`}
              />
            )}
          </div>

          {hasContent ? <AssistantReadiness data={data} basePath={basePath} /> : <FirstSteps basePath={basePath} />}
        </div>
      </Reveal>

      {isSuperAdmin && data.abonnement && (
        <Reveal delay={0.35}>
          <SubscriptionStrip abonnement={data.abonnement} basePath={basePath} />
        </Reveal>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function IdentityCard({ data, basePath, isSuperAdmin }: OrgOverviewViewProps) {
  const { identite } = data;
  const fields: { label: string; value: string | null; icon: ReactNode; href?: string }[] = [
    { label: "Adresse", value: identite.adresse, icon: <MapPin /> },
    { label: "Téléphone", value: identite.telephone, icon: <Phone />, href: identite.telephone ? `tel:${identite.telephone.replace(/\s/g, "")}` : undefined },
    { label: "Email", value: identite.email, icon: <Mail />, href: identite.email ? `mailto:${identite.email}` : undefined },
    { label: "Site web", value: identite.siteWeb?.replace(/^https?:\/\//, "") ?? null, icon: <Globe />, href: identite.siteWeb ?? undefined },
  ];

  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-4">
        <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-soft-green text-green-ink ring-1 ring-green/15">
          {identite.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- logo servi par le stockage objet
            <img src={identite.logoUrl} alt="" className="size-full object-cover" />
          ) : (
            <Building2 className="size-6" aria-hidden />
          )}
        </span>
        <div className="min-w-0">
          <h2 className="font-display truncate text-lg font-semibold text-text">{identite.nom}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatusPill tone={identite.statut === "active" ? "success" : "danger"} pulse={identite.statut === "active"}>
              {identite.statut === "active" ? "Active" : "Suspendue"}
            </StatusPill>
            <span className="text-xs text-muted">{identite.type}</span>
          </div>
        </div>
      </div>

      <hr className="my-5 border-line" />

      <div>
        <p className="text-xs font-medium text-muted">Description</p>
        <p className={cn("mt-1 text-sm leading-relaxed", identite.description ? "text-text" : "text-subtle italic")}>
          {identite.description ?? "Aucune description. Elle aide l’assistant à présenter votre organisation."}
        </p>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label} className="flex min-w-0 gap-3">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-surface-3 text-muted [&_svg]:size-3.5">
              {field.icon}
            </span>
            <div className="min-w-0">
              <dt className="text-xs font-medium text-muted">{field.label}</dt>
              <dd className="mt-0.5 truncate text-sm">
                {field.value ? (
                  field.href ? (
                    <a href={field.href} className="text-text underline-offset-4 hover:text-green-ink hover:underline">
                      {field.value}
                    </a>
                  ) : (
                    <span className="text-text">{field.value}</span>
                  )
                ) : (
                  <span className="text-subtle italic">Non renseigné</span>
                )}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      {isSuperAdmin && (
        <div className="mt-auto pt-6">
          <Button href={`${basePath}/parametres`} variant="secondary" className="w-full" icon={<Pencil className="size-4" />}>
            Modifier les informations
          </Button>
        </div>
      )}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */

type Task = { key: string; icon: ReactNode; tone: "danger" | "warning" | "info"; label: string; href: string; live?: boolean };

function AssistantReadiness({ data, basePath }: { data: OrgOverview; basePath: string }) {
  const total = data.demarches.publiees + data.demarches.brouillons;
  const ratio = total > 0 ? data.demarches.publiees / total : 0;

  const tasks: Task[] = [];
  if (data.documents.erreurs > 0)
    tasks.push({
      key: "doc-erreur",
      icon: <AlertTriangle />,
      tone: "danger",
      label: `${formatNumber(data.documents.erreurs)} document(s) en erreur d’indexation`,
      href: `${basePath}/documents`,
    });
  if (data.demarches.brouillons > 0)
    tasks.push({
      key: "brouillons",
      icon: <PenLine />,
      tone: "warning",
      label: `${formatNumber(data.demarches.brouillons)} démarche(s) en brouillon, invisibles pour les citoyens`,
      href: `${basePath}/services`,
    });
  if (data.plans.servicesSansPosition > 0)
    tasks.push({
      key: "positions",
      icon: <MapPinOff />,
      tone: "info",
      label: `${formatNumber(data.plans.servicesSansPosition)} service(s) sans position sur un plan`,
      href: `${basePath}/plans`,
    });
  if (data.documents.enCours > 0)
    tasks.push({
      key: "indexation",
      icon: <Loader />,
      tone: "info",
      label: `${formatNumber(data.documents.enCours)} document(s) en cours d’indexation`,
      href: `${basePath}/documents`,
      live: true,
    });

  const TONES = {
    danger: "bg-danger-soft text-danger",
    warning: "bg-warning-soft text-warning",
    info: "bg-info-soft text-info",
  } as const;

  return (
    <Card>
      <CardHeader
        title="Ce que l’assistant peut expliquer"
        icon={<Sparkles />}
        description="Seul le contenu publié est connu de l’assistant."
      />
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <ProgressRing value={ratio} label="Démarches publiées">
          <div>
            <p className="font-display tabular text-[28px] leading-none font-semibold text-text">{Math.round(ratio * 100)} %</p>
            <p className="mt-1 text-[11px] text-muted">publié</p>
          </div>
        </ProgressRing>

        <div className="w-full min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-text">Prochaines actions</p>
          {tasks.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-soft-green px-3 py-3 text-sm text-green-ink">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              Tout est publié et à jour. Les citoyens reçoivent des réponses complètes.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {tasks.map((task) => (
                <li key={task.key}>
                  <Link
                    href={task.href}
                    className="group flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-line hover:bg-surface-2"
                  >
                    <span className={cn("grid size-8 shrink-0 place-items-center rounded-[10px] [&_svg]:size-4", TONES[task.tone], task.live && "[&_svg]:animate-spin")}>
                      {task.icon}
                    </span>
                    <span className="min-w-0 flex-1 text-[13px] text-text">{task.label}</span>
                    <ArrowRight className="size-4 shrink-0 text-subtle transition-transform duration-300 group-hover:translate-x-1 group-hover:text-green-ink" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

function FirstSteps({ basePath }: { basePath: string }) {
  const steps = [
    { title: "Créez un service", body: "État civil, urbanisme, accueil… avec horaires et localisation." },
    { title: "Ajoutez ses démarches", body: "Coût, délai, conditions et pièces requises en champs structurés." },
    { title: "Publiez", body: "L’assistant les expliquera aux citoyens, par écrit et à voix haute." },
  ];
  return (
    <Card className="relative overflow-hidden">
      <div aria-hidden className="absolute -top-20 -right-20 size-56 rounded-full bg-[radial-gradient(closest-side,var(--aurora-a),transparent)]" />
      <CardHeader
        title="Donnez la parole à votre administration"
        icon={<Sparkles />}
        description="Aucun contenu pour l’instant : l’assistant ne peut encore rien expliquer aux citoyens."
      />
      <ol className="relative grid gap-3 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-2xl border border-line bg-surface-2 p-4">
            <span className="font-display grid size-7 place-items-center rounded-full bg-green text-[13px] font-semibold text-on-green">
              {index + 1}
            </span>
            <p className="mt-3 text-sm font-semibold text-text">{step.title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
      <div className="relative mt-5">
        <Button href={`${basePath}/services`} magnetic icon={<Layers className="size-4" />}>
          Créer mon premier service
        </Button>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */

function UsageMeter({ label, usage }: { label: string; usage: Usage }) {
  const ratio = usage.limite ? usage.utilise / usage.limite : 0;
  const tone = ratio >= 1 ? "danger" : ratio >= 0.8 ? "warning" : "green";
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="text-muted">{label}</span>
        <span className="tabular font-semibold text-text">
          {formatNumber(usage.utilise)}
          <span className="font-normal text-subtle"> / {usage.limite !== null ? formatNumber(usage.limite) : "∞"}</span>
        </span>
      </div>
      <ProgressBar value={ratio} tone={tone} label={`${label} utilisés`} className="mt-2" />
    </div>
  );
}

function SubscriptionStrip({ abonnement, basePath }: { abonnement: NonNullable<OrgOverview["abonnement"]>; basePath: string }) {
  const statut = {
    actif: { tone: "success" as const, label: "Actif" },
    expire: { tone: "danger" as const, label: "Expiré" },
    en_attente: { tone: "warning" as const, label: "En attente" },
  }[abonnement.statut];

  return (
    <Card className="grid items-center gap-6 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted">Abonnement</p>
        <div className="mt-1 flex items-center gap-2">
          <p className="font-display text-lg font-semibold text-text">Plan {abonnement.plan}</p>
          <StatusPill tone={statut.tone}>{statut.label}</StatusPill>
        </div>
        <p className="mt-0.5 text-[13px] text-muted">
          {formatXOF(abonnement.montant)} ·{" "}
          {abonnement.prochainRenouvellement
            ? `renouvellement le ${formatDate(abonnement.prochainRenouvellement)}`
            : `terminé le ${formatDate(abonnement.fin)}`}
        </p>
      </div>
      <UsageMeter label="Membres" usage={abonnement.membres} />
      <UsageMeter label="Bornes" usage={abonnement.bornes} />
      <Button href={`${basePath}/abonnement`} variant="ghost" icon={<ArrowRight className="size-4" />} className="justify-self-start md:justify-self-end">
        Détails
      </Button>
    </Card>
  );
}
