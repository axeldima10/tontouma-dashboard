"use client";

import { ArrowRight, Building2, CheckCircle2, CircleAlert, Inbox, MonitorSmartphone, PieChart, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { KpiTile } from "@/components/ui/KpiTile";
import { ProgressBar } from "@/components/ui/Progress";
import { StatusPill, type Tone } from "@/components/ui/StatusPill";
import type { AdminOverview } from "@/lib/api/queries/types";
import { formatNumber, formatPercent, formatRelative, formatShortDate } from "@/lib/format";
import { Reveal } from "@/lib/motion/Reveal";

const KIOSK_STATUS: Record<AdminOverview["bornes"]["liste"][number]["statut"], { tone: Tone; label: string }> = {
  active: { tone: "success", label: "Active" },
  maintenance: { tone: "warning", label: "Maintenance" },
  inactive: { tone: "neutral", label: "Inactive" },
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => word.length > 2 || /^[A-Z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export function AdminOverviewView({ data, now }: { data: AdminOverview; now: string }) {
  const clock = new Date(now);
  const { organisations, demandes, bornes } = data;
  const maxType = Math.max(1, ...organisations.parType.map((t) => t.total));

  return (
    <div className="space-y-5">
      <Reveal className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5" stagger={0.06}>
        <KpiTile
          label="Organisations"
          value={organisations.total}
          hint={`+${formatNumber(organisations.nouveauxCeMois)} ce mois`}
          icon={<Building2 />}
          tone="info"
          href="/admin/organisations"
        />
        <KpiTile
          label="Org. actives"
          value={organisations.actives}
          hint={organisations.total ? `${formatPercent(organisations.actives / organisations.total)} du total` : "—"}
          icon={<CheckCircle2 />}
          href="/admin/organisations"
        />
        <KpiTile
          label="Org. suspendues"
          value={organisations.suspendues}
          hint={organisations.suspendues > 0 ? "Action requise" : "Aucune"}
          icon={<CircleAlert />}
          tone="warning"
          href="/admin/organisations"
        />
        <KpiTile
          label="Demandes en attente"
          value={demandes.enAttente}
          hint={demandes.enAttente > 0 ? "À examiner" : "File vide"}
          icon={<Inbox />}
          tone="violet"
          href="/admin/demandes"
        />
        <KpiTile
          label="Bornes installées"
          value={bornes.total}
          hint={`${formatNumber(bornes.actives)} actives`}
          icon={<MonitorSmartphone />}
          tone="neutral"
          className="col-span-2 md:col-span-1"
        />
      </Reveal>

      <Reveal className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]" delay={0.25}>
        <Card>
          <CardHeader
            title="Demandes d’accès en attente"
            icon={<Inbox />}
            description="Organisations qui souhaitent rejoindre Tontouma Bot."
            action={
              demandes.liste.length > 0 && (
                <Button href="/admin/demandes" variant="ghost" size="sm" icon={<ArrowRight className="size-3.5" />}>
                  Tout voir
                </Button>
              )
            }
          />
          {demandes.liste.length === 0 ? (
            <EmptyState
              icon={<Sparkles />}
              title="Aucune demande en attente"
              description="Les nouvelles demandes d’organisations apparaîtront ici pour validation."
            />
          ) : (
            <ul className="-mx-2 divide-y divide-line">
              {demandes.liste.map((demande) => (
                <li key={demande.id} className="flex items-center gap-3 px-2 py-3">
                  <span
                    aria-hidden
                    className="font-display grid size-10 shrink-0 place-items-center rounded-xl bg-violet-soft text-[13px] font-semibold text-violet"
                  >
                    {initials(demande.organisation)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text">{demande.organisation}</p>
                    <p className="truncate text-xs text-muted">
                      {demande.type} · {demande.contact} · {formatRelative(demande.recueLe, clock)}
                    </p>
                  </div>
                  <Button href="/admin/demandes" variant="secondary" size="sm">
                    Examiner
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="flex flex-col">
          <CardHeader title="Organisations par type" icon={<PieChart />} />
          {organisations.parType.length === 0 ? (
            <p className="text-sm text-muted">Aucune organisation cliente pour le moment.</p>
          ) : (
            <ul className="space-y-4">
              {organisations.parType.map((type, index) => (
                <li key={type.type}>
                  <div className="mb-1.5 flex justify-between text-[13px]">
                    <span className="text-text">{type.type}</span>
                    <span className="tabular font-semibold text-text">{formatNumber(type.total)}</span>
                  </div>
                  <ProgressBar value={type.total / maxType} label={`${type.type} : ${type.total}`} delay={0.4 + index * 0.08} />
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 border-t border-line pt-5">
            <p className="text-[13px] font-semibold text-text">Dernières organisations créées</p>
            {organisations.recentes.length === 0 ? (
              <p className="mt-2 text-sm text-muted">—</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {organisations.recentes.map((org) => (
                  <li key={org.id} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="truncate text-text">{org.nom}</span>
                    <span className="shrink-0 text-muted">{formatShortDate(org.creeLe)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.4}>
        <Card>
          <CardHeader title="État des bornes" icon={<MonitorSmartphone />} description="Statut déclaré de chaque borne installée." />
          {bornes.liste.length === 0 ? (
            <EmptyState
              icon={<MonitorSmartphone />}
              title="Aucune borne installée"
              description="Les bornes créées par les organisations apparaîtront ici."
            />
          ) : (
            <>
              <table className="hidden w-full text-left text-sm md:table">
                <thead>
                  <tr className="border-b border-line text-[11px] tracking-[0.1em] text-muted uppercase">
                    <th scope="col" className="pb-3 font-medium">Borne</th>
                    <th scope="col" className="pb-3 font-medium">Organisation</th>
                    <th scope="col" className="pb-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {bornes.liste.map((borne) => (
                    <tr key={borne.id} className="transition-colors hover:bg-surface-2">
                      <td className="py-3.5 font-medium text-text tabular">{borne.nom}</td>
                      <td className="py-3.5 text-muted">{borne.organisation}</td>
                      <td className="py-3.5">
                        <StatusPill tone={KIOSK_STATUS[borne.statut].tone} pulse={borne.statut === "active"}>
                          {KIOSK_STATUS[borne.statut].label}
                        </StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="space-y-2 md:hidden">
                {bornes.liste.map((borne) => (
                  <li key={borne.id} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">{borne.nom}</p>
                      <p className="truncate text-xs text-muted">{borne.organisation}</p>
                    </div>
                    <StatusPill tone={KIOSK_STATUS[borne.statut].tone}>{KIOSK_STATUS[borne.statut].label}</StatusPill>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </Reveal>
    </div>
  );
}
