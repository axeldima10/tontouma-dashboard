"use client";

import { ArrowRight, Building2, CircleCheck, CirclePause, MonitorSmartphone, Plus, Receipt } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { CountUp, Stagger, StaggerItem } from "@/components/motion/Motion";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { KpiTile, ProgressRing, SegmentBar } from "@/components/ui/Metrics";
import { ActivePill, BornePill } from "@/components/ui/StatusPill";
import type { Borne, Organization, Plan } from "@/lib/api/contract";
import { BILLING_PERIOD_LABELS, formatRelative, formatXOF } from "@/lib/format";

type AdminOverviewProps = { organizations: Organization[]; plans: Plan[]; bornes: Borne[]; now: string };

export function AdminOverview({ organizations, plans, bornes, now }: AdminOverviewProps) {
  const current = new Date(now);
  const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
  const active = organizations.filter((o) => o.active).length;
  const suspended = organizations.length - active;
  const newThisMonth = organizations.filter((o) => new Date(o.createdAt) >= monthStart).length;
  const orgName = new Map(organizations.map((o) => [o.id, o.name]));

  const byPlan = plans
    .map((plan) => ({ plan, count: organizations.filter((o) => o.plan?.id === plan.id).length }))
    .filter((p) => p.count > 0 || p.plan.active)
    .sort((a, b) => b.count - a.count);
  const maxByPlan = Math.max(1, ...byPlan.map((p) => p.count));

  const byType = [...organizations.reduce((map, o) => map.set(o.type ?? "Autre", (map.get(o.type ?? "Autre") ?? 0) + 1), new Map<string, number>())].sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <StaggerItem className="sm:col-span-1 lg:col-span-3">
        <KpiTile icon={<Building2 />} label="Organisations" value={organizations.length} hint={`+${newThisMonth} ce mois`} href="/admin/organisations" />
      </StaggerItem>
      <StaggerItem className="lg:col-span-3">
        <KpiTile icon={<CircleCheck />} accent="brand" label="Actives" value={active} hint={organizations.length ? `${Math.round((active / organizations.length) * 100)} % du total` : "—"} />
      </StaggerItem>
      <StaggerItem className="lg:col-span-3">
        <KpiTile icon={<CirclePause />} accent="warning" label="Suspendues" value={suspended} hint={suspended > 0 ? "Action requise" : "Aucune"} href="/admin/organisations?statut=suspendue" />
      </StaggerItem>
      <StaggerItem className="lg:col-span-3">
        <KpiTile icon={<MonitorSmartphone />} accent="info" label="Bornes installées" value={bornes.length} href="/admin/bornes">
          <SegmentBar
            segments={[
              { label: "OK", value: bornes.filter((b) => b.status === "ACTIVE").length, className: "bg-brand" },
              { label: "Maint.", value: bornes.filter((b) => b.status === "MAINTENANCE").length, className: "bg-[#f5a122]" },
              { label: "HS", value: bornes.filter((b) => b.status === "HORS_SERVICE").length, className: "bg-destructive" },
            ]}
          />
        </KpiTile>
      </StaggerItem>

      {/* Organisations par plan */}
      <StaggerItem className="lg:col-span-7">
        <section className="glass h-full rounded-[30px] p-6 sm:p-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
            <ProgressRing value={active} max={organizations.length} size={170} label={`${active} organisations actives sur ${organizations.length}`}>
              <div>
                <p className="tabular text-[40px] leading-none font-light tracking-[-0.04em] text-foreground">
                  <CountUp value={active} />
                </p>
                <p className="mt-1 text-xs text-muted-foreground">actives</p>
              </div>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Organisations par plan</h2>
                <Button href="/admin/plans" variant="ghost" size="sm">
                  Plans <ArrowRight className="size-3.5" />
                </Button>
              </div>
              <ul className="mt-4 space-y-3.5">
                {byPlan.map(({ plan, count }, index) => (
                  <li key={plan.id}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        <Receipt className="size-3.5 text-muted-foreground" aria-hidden /> {plan.name}
                        <span className="text-xs font-normal text-muted-foreground">
                          {formatXOF(plan.amount ?? 0)} / {BILLING_PERIOD_LABELS[plan.billingPeriod]}
                        </span>
                      </span>
                      <b className="tabular font-semibold text-foreground">{count}</b>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-foreground/[0.07]">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-brand to-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / maxByPlan) * 100}%` }}
                        transition={{ duration: 1, delay: 0.2 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </StaggerItem>

      {/* Dernières organisations */}
      <StaggerItem className="lg:col-span-5">
        <section className="surface h-full p-5 sm:p-6">
          <header className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Dernières organisations</h2>
            <Button href="/admin/organisations?nouvelle=1" size="sm" icon={<Plus />}>
              Créer
            </Button>
          </header>
          <ul className="divide-y divide-border">
            {organizations.slice(0, 5).map((org) => (
              <li key={org.id}>
                <Link href={`/admin/organisations/${org.id}`} className="group -mx-2 flex items-center gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-accent">
                  <Avatar name={org.name} imageUrl={org.logoUrl} size={38} square />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{org.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {org.type ?? "Organisation"} · {formatRelative(org.createdAt, current)}
                    </p>
                  </div>
                  <ActivePill active={org.active} on="Active" off="Suspendue" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </StaggerItem>

      {/* État des bornes */}
      <StaggerItem className="lg:col-span-7">
        <section className="surface h-full p-5 sm:p-6">
          <header className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">État des bornes</h2>
            <Button href="/admin/bornes" variant="ghost" size="sm">
              Tout voir <ArrowRight className="size-3.5" />
            </Button>
          </header>
          {bornes.length === 0 ? (
            <p className="hatch rounded-[18px] px-4 py-8 text-center text-sm text-muted-foreground">Aucune borne installée pour l’instant.</p>
          ) : (
            <ul className="divide-y divide-border">
              {[...bornes]
                .sort((a, b) => (a.status === "ACTIVE" ? 1 : 0) - (b.status === "ACTIVE" ? 1 : 0))
                .slice(0, 6)
                .map((borne) => (
                  <li key={borne.id} className="flex items-center gap-3 py-2.5">
                    <span className="grid size-9 place-items-center rounded-xl bg-accent">
                      <MonitorSmartphone className="size-4 text-muted-foreground" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="tabular truncate text-sm font-semibold text-foreground">{borne.identifier}</p>
                      <p className="truncate text-xs text-muted-foreground">{orgName.get(borne.organizationId ?? "") ?? "—"}</p>
                    </div>
                    <BornePill status={borne.status} />
                  </li>
                ))}
            </ul>
          )}
        </section>
      </StaggerItem>

      {/* Par type */}
      <StaggerItem className="lg:col-span-5">
        <section className="glass h-full rounded-[26px] p-5 sm:p-6">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Organisations par type</h2>
          <ul className="mt-4 space-y-3">
            {byType.map(([type, count], index) => (
              <li key={type}>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{type}</span>
                  <b className="tabular font-semibold text-foreground">{count}</b>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-foreground/[0.07]">
                  <motion.div
                    className="h-full rounded-full bg-brand"
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / Math.max(1, organizations.length)) * 100}%` }}
                    transition={{ duration: 1, delay: 0.3 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </StaggerItem>
    </Stagger>
  );
}
