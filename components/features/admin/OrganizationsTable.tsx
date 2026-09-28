"use client";

<<<<<<< HEAD
import { ArrowUpRight, Building2, Mail, Plus } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/states/States";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { AffixInput } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ActivePill } from "@/components/ui/StatusPill";
import { MobileCard, MobileList, SearchField, Table, Td, Th, Toolbar } from "@/components/ui/Table";
import { Segmented } from "@/components/ui/Tabs";
import { createOrganization } from "@/lib/actions/platform";
import type { Organization, Plan } from "@/lib/api/contract";
import { BILLING_PERIOD_LABELS, formatDate, formatXOF } from "@/lib/format";
import { useAction } from "@/lib/hooks/useAction";
import { OrganizationFields, organizationErrors, toOrganizationForm, toOrganizationRequest } from "./OrganizationForm";

type StatusFilter = "all" | "active" | "suspended";

type OrganizationsTableProps = { organizations: Organization[]; plans: Plan[] };

export function OrganizationsTable({ organizations, plans }: OrganizationsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>(searchParams.get("statut") === "suspendue" ? "suspended" : "all");
  const [creating, setCreating] = useState<number | null>(searchParams.get("nouvelle") ? 0 : null);

  const visible = organizations.filter(
    (o) =>
      (status === "all" || (status === "active" ? o.active : !o.active)) &&
      (!query || `${o.name} ${o.type ?? ""} ${o.email ?? ""} ${o.ninea ?? ""}`.toLowerCase().includes(query.toLowerCase())),
  );
  const active = organizations.filter((o) => o.active).length;

  return (
    <>
      <PageHeader
        kicker="Plateforme"
        title="Organisations"
        description="Les clients Tontouma Bot : informations, plan, administrateurs, bornes et statut."
        actions={
          <Button icon={<Plus />} onClick={() => setCreating(Date.now())}>
            Nouvelle organisation
          </Button>
        }
      />

      <Toolbar>
        <Segmented
          aria-label="Filtrer par statut"
          value={status}
          onValueChange={setStatus}
          options={[
            { value: "all", label: "Toutes", count: organizations.length },
            { value: "active", label: "Actives", count: active },
            { value: "suspended", label: "Suspendues", count: organizations.length - active },
          ]}
        />
        <SearchField value={query} onChange={setQuery} placeholder="Nom, type, email, NINEA…" className="w-full sm:ml-auto sm:w-80" />
      </Toolbar>

      {organizations.length === 0 ? (
        <EmptyState
          size="page"
          icon={<Building2 />}
          title="Aucune organisation cliente"
          description="Créez la première organisation : son espace Clerk est provisionné et son premier administrateur reçoit une invitation par email."
          action={
            <Button icon={<Plus />} onClick={() => setCreating(Date.now())}>
              Nouvelle organisation
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState icon={<Building2 />} title="Aucune organisation ne correspond" description="Modifiez la recherche ou le filtre." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Organisation</Th>
                <Th>Type</Th>
                <Th>Plan</Th>
                <Th>Contact</Th>
                <Th>Créée le</Th>
                <Th>Statut</Th>
                <Th className="w-10">
                  <span className="sr-only">Ouvrir</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((org, index) => (
                <motion.tr
                  key={org.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 12) * 0.03 }}
                  onClick={() => router.push(`/admin/organisations/${org.id}`)}
                  className="group cursor-pointer transition-colors last:[&>td]:border-b-0 hover:bg-accent/60"
                >
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={org.name} imageUrl={org.logoUrl} size={38} square />
                      <Link href={`/admin/organisations/${org.id}`} className="font-semibold text-foreground" onClick={(e) => e.stopPropagation()}>
                        {org.name}
                      </Link>
                    </div>
                  </Td>
                  <Td className="text-muted-foreground">{org.type ?? "—"}</Td>
                  <Td>{org.plan ? <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold">{org.plan.name}</span> : "—"}</Td>
                  <Td className="max-w-56 truncate text-muted-foreground">{org.email ?? org.phone ?? "—"}</Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{formatDate(org.createdAt, { day: "numeric", month: "short", year: "numeric" })}</Td>
                  <Td>
                    <ActivePill active={org.active} on="Active" off="Suspendue" />
                  </Td>
                  <Td>
                    <ArrowUpRight className="size-4 text-subtle transition group-hover:text-foreground" aria-hidden />
                  </Td>
                </motion.tr>
              ))}
            </tbody>
          </Table>
          <MobileList>
            {visible.map((org) => (
              <MobileCard key={org.id} className="p-0">
                <Link href={`/admin/organisations/${org.id}`} className="flex items-center gap-3 p-4">
                  <Avatar name={org.name} imageUrl={org.logoUrl} size={42} square />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{org.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {org.type ?? "Organisation"} · {org.plan?.name ?? "Sans plan"}
                    </p>
                  </div>
                  <ActivePill active={org.active} on="Active" off="Suspendue" />
                </Link>
              </MobileCard>
            ))}
          </MobileList>
        </>
      )}

      {creating !== null && (
        <CreateOrganizationDialog
          key={creating}
          plans={plans.filter((p) => p.active)}
          onClose={() => {
            setCreating(null);
            if (searchParams.get("nouvelle")) router.replace("/admin/organisations");
          }}
        />
      )}
    </>
  );
}

function CreateOrganizationDialog({ plans, onClose }: { plans: Plan[]; onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState(() => toOrganizationForm(null));
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [adminEmail, setAdminEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { run, pending } = useAction();

  const emailError = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim()) ? null : "Adresse email invalide.";
  const invalid = Object.values(organizationErrors(form)).some(Boolean) || !planId || emailError !== null;

  const submit = async () => {
    setSubmitted(true);
    if (invalid) return;
    const result = await run(() => createOrganization({ ...toOrganizationRequest(form), planId, adminEmail: adminEmail.trim() }), {
      success: "Organisation créée",
      successDescription: `Invitation envoyée à ${adminEmail.trim()}.`,
    });
    if (result.ok) {
      onClose();
      router.push(`/admin/organisations/${result.data.id}`);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      dismissible={false}
      size="lg"
      icon={<Building2 />}
      title="Nouvelle organisation"
      description="L’organisation Clerk est provisionnée et le premier administrateur reçoit une invitation par email."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button loading={pending} onClick={submit}>
            Créer et inviter
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <OrganizationFields form={form} onChange={setForm} showErrors={submitted} withHours={false} />
        <div className="grid gap-4 rounded-[20px] bg-muted p-4 sm:grid-cols-2">
          <Field label="Plan d’abonnement" required error={submitted && !planId ? "Choisissez un plan." : null}>
            {(p) => (
              <Select
                {...p}
                value={planId}
                onValueChange={setPlanId}
                placeholder={plans.length ? "Choisir un plan" : "Aucun plan actif"}
                options={plans.map((plan) => ({
                  value: plan.id,
                  label: plan.name,
                  description: `${formatXOF(plan.amount ?? 0)} / ${BILLING_PERIOD_LABELS[plan.billingPeriod]}`,
                }))}
              />
            )}
          </Field>
          <Field label="Email du premier administrateur" required error={submitted ? emailError : null}>
            {(p) => <AffixInput {...p} prefix={<Mail />} type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} maxLength={255} placeholder="dsi@mairie.sn" />}
          </Field>
        </div>
      </div>
    </Dialog>
  );
}
=======
import { ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/states";
import { FilterChips, SearchInput } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import type { AdminOrganizationRow } from "@/lib/data/types";
import { formatDate, formatNumber } from "@/lib/format";
import { Reveal } from "@/lib/motion/Reveal";
import { SuspendDialog } from "./SuspendDialog";

type StatusFilter = "toutes" | "active" | "suspendue";

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export function OrganizationsTable({ organizations }: { organizations: AdminOrganizationRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("toutes");
  const [target, setTarget] = useState<AdminOrganizationRow | null>(null);

  const rows = useMemo(() => {
    const q = normalize(query.trim());
    return organizations.filter(
      (o) => (status === "toutes" || o.statut === status) && (!q || normalize(`${o.nom} ${o.type}`).includes(q)),
    );
  }, [organizations, query, status]);

  return (
    <>
      <PageHeader title="Organisations" description="Les structures clientes de Tontouma Bot." />
      <Reveal className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterChips
            label="Statut"
            value={status}
            onChange={setStatus}
            chips={[
              { value: "toutes", label: "Toutes", count: organizations.length },
              { value: "active", label: "Actives", count: organizations.filter((o) => o.statut === "active").length },
              { value: "suspendue", label: "Suspendues", count: organizations.filter((o) => o.statut === "suspendue").length },
            ]}
          />
          <SearchInput value={query} onChange={setQuery} placeholder="Rechercher une organisation…" label="Rechercher une organisation" />
        </div>

        <Card className="p-0 sm:p-0">
          {rows.length === 0 ? (
            <EmptyState
              icon={<Building2 />}
              title={organizations.length === 0 ? "Aucune organisation" : "Aucun résultat"}
              description={
                organizations.length === 0
                  ? "Les organisations apparaissent ici après approbation de leur demande d’accès."
                  : "Modifiez la recherche ou le filtre de statut."
              }
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-[11px] tracking-[0.1em] text-muted uppercase">
                      <th scope="col" className="px-5 py-3.5 font-medium">Organisation</th>
                      <th scope="col" className="px-3 py-3.5 font-medium">Plan</th>
                      <th scope="col" className="px-3 py-3.5 text-right font-medium">Bornes</th>
                      <th scope="col" className="px-3 py-3.5 text-right font-medium">Membres</th>
                      <th scope="col" className="px-3 py-3.5 font-medium">Créée le</th>
                      <th scope="col" className="px-3 py-3.5 font-medium">Statut</th>
                      <th scope="col" className="px-5 py-3.5 text-right font-medium">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {rows.map((o) => (
                      <tr key={o.id} className="group transition-colors hover:bg-surface-2">
                        <td className="px-5 py-3.5">
                          <Link href={`/admin/organisations/${o.id}`} className="font-semibold text-text hover:text-green-ink">
                            {o.nom}
                          </Link>
                          <p className="text-xs text-muted">{o.type}</p>
                        </td>
                        <td className="px-3 py-3.5 text-muted">{o.plan ?? "—"}</td>
                        <td className="tabular px-3 py-3.5 text-right text-text">{formatNumber(o.bornes)}</td>
                        <td className="tabular px-3 py-3.5 text-right text-text">{formatNumber(o.membres)}</td>
                        <td className="px-3 py-3.5 text-muted">{formatDate(o.dateCreation, { day: "numeric", month: "short", year: "numeric" })}</td>
                        <td className="px-3 py-3.5">
                          <StatusPill tone={o.statut === "active" ? "success" : "danger"}>{o.statut === "active" ? "Active" : "Suspendue"}</StatusPill>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant={o.statut === "active" ? "ghost" : "secondary"} size="sm" onClick={() => setTarget(o)}>
                              {o.statut === "active" ? "Suspendre" : "Réactiver"}
                            </Button>
                            <Link
                              href={`/admin/organisations/${o.id}`}
                              aria-label={`Voir ${o.nom}`}
                              className="grid size-8 place-items-center rounded-lg text-subtle hover:bg-surface-3 hover:text-green-ink"
                            >
                              <ArrowRight className="size-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="divide-y divide-line md:hidden">
                {rows.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 p-4">
                    <Link href={`/admin/organisations/${o.id}`} className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text">{o.nom}</p>
                      <p className="truncate text-xs text-muted">
                        {o.type} · {o.plan ?? "—"} · {o.bornes} borne(s)
                      </p>
                    </Link>
                    <StatusPill tone={o.statut === "active" ? "success" : "danger"}>{o.statut === "active" ? "Active" : "Suspendue"}</StatusPill>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </Reveal>
      {target && <SuspendDialog organization={target} onClose={() => setTarget(null)} />}
    </>
  );
}
>>>>>>> 939f032 (First Commit)
