"use client";

<<<<<<< HEAD
import { Check, FileText, MonitorSmartphone, Pencil, Plus, Power, Receipt, Trash2, Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/states/States";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input, IntegerInput, Textarea } from "@/components/ui/Input";
import { ActionMenu } from "@/components/ui/Menu";
import { newItem, OrderedList, type ListItem } from "@/components/ui/OrderedList";
import { ActivePill } from "@/components/ui/StatusPill";
import { Segmented } from "@/components/ui/Tabs";
import { deletePlan, savePlan, setPlanActive } from "@/lib/actions/platform";
import { BILLING_PERIODS, type BillingPeriod, type Plan } from "@/lib/api/contract";
import { cn } from "@/lib/cn";
import { BILLING_PERIOD_LABELS, BILLING_PERIOD_NAMES, formatXOF } from "@/lib/format";
import { useAction } from "@/lib/hooks/useAction";

type PlansManagerProps = { plans: Plan[]; usage: Record<string, number> };

type Confirm = { kind: "delete" | "toggle"; plan: Plan } | null;

export function PlansManager({ plans, usage }: PlansManagerProps) {
  const [editing, setEditing] = useState<{ key: number; plan: Plan | null } | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [showArchived, setShowArchived] = useState<"active" | "all">("active");
  const { run, pending } = useAction();

  const visible = plans.filter((p) => showArchived === "all" || p.active).sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0));
  const archived = plans.filter((p) => !p.active).length;

  const onConfirm = async () => {
    if (!confirm) return;
    const { plan } = confirm;
    const result =
      confirm.kind === "delete"
        ? await run(() => deletePlan(plan.id), { success: "Plan supprimé" })
        : await run(() => setPlanActive(plan.id, !plan.active), { success: plan.active ? "Plan archivé" : "Plan réactivé" });
    if (result.ok) setConfirm(null);
  };

  return (
    <>
      <PageHeader
        kicker="Plateforme"
        title="Plans d’abonnement"
        description="Tarifs en FCFA et limites appliquées par le backend (administrateurs, bornes, documents)."
        actions={
          <Button icon={<Plus />} onClick={() => setEditing({ key: Date.now(), plan: null })}>
            Nouveau plan
          </Button>
        }
      />

      {archived > 0 && (
        <div className="mb-5">
          <Segmented
            aria-label="Plans affichés"
            value={showArchived}
            onValueChange={setShowArchived}
            options={[
              { value: "active", label: "Proposés", count: plans.length - archived },
              { value: "all", label: "Tous", count: plans.length },
            ]}
          />
        </div>
      )}

      {plans.length === 0 ? (
        <EmptyState
          size="page"
          icon={<Receipt />}
          title="Aucun plan"
          description="Créez un premier plan : prix en FCFA, période et limites."
          action={
            <Button icon={<Plus />} onClick={() => setEditing({ key: Date.now(), plan: null })}>
              Nouveau plan
            </Button>
          }
        />
      ) : (
        <motion.ul layout className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {visible.map((plan, index) => {
              const featured = plan.active && index === Math.floor(visible.filter((p) => p.active).length / 2);
              const count = usage[plan.id] ?? 0;
              return (
                <motion.li
                  key={plan.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: index * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -4 }}
                  className={cn(
                    "relative flex flex-col overflow-hidden rounded-[30px] p-6 sm:p-7",
                    featured ? "bg-primary text-primary-foreground shadow-[0_28px_56px_-28px_var(--primary)]" : "glass",
                    !plan.active && "opacity-70",
                  )}
                >
                  {featured && <span aria-hidden className="absolute -top-20 -right-16 size-56 rounded-full bg-[radial-gradient(closest-side,var(--brand),transparent)] opacity-50" />}
                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <p className={cn("text-xs font-semibold tracking-[0.12em] uppercase", featured ? "opacity-70" : "text-muted-foreground")}>
                        {BILLING_PERIOD_NAMES[plan.billingPeriod]}
                      </p>
                      <h2 className="mt-1 text-2xl font-semibold tracking-tight">{plan.name}</h2>
                    </div>
                    <div className="flex items-center gap-1">
                      {!plan.active && <ActivePill active={false} off="Archivé" />}
                      <ActionMenu
                        label={`Actions pour ${plan.name}`}
                        trigger={
                          <button
                            type="button"
                            aria-label={`Actions pour ${plan.name}`}
                            className={cn("grid size-9 place-items-center rounded-full transition", featured ? "hover:bg-white/10" : "text-muted-foreground hover:bg-accent")}
                          >
                            <Pencil className="size-4" aria-hidden />
                          </button>
                        }
                        items={[
                          { label: "Modifier", icon: <Pencil />, onSelect: () => setEditing({ key: Date.now(), plan }) },
                          { label: plan.active ? "Archiver" : "Réactiver", icon: <Power />, onSelect: () => setConfirm({ kind: "toggle", plan }) },
                          "separator",
                          { label: "Supprimer", icon: <Trash2 />, tone: "danger", onSelect: () => setConfirm({ kind: "delete", plan }) },
                        ]}
                      />
                    </div>
                  </div>
                  <p className="tabular relative mt-6 text-[40px] leading-none font-light tracking-[-0.03em]">
                    {formatXOF(plan.amount ?? 0)}
                    <span className={cn("ml-1.5 text-base", featured ? "opacity-70" : "text-muted-foreground")}>/ {BILLING_PERIOD_LABELS[plan.billingPeriod]}</span>
                  </p>
                  {plan.description && <p className={cn("relative mt-3 text-sm leading-relaxed", featured ? "opacity-80" : "text-muted-foreground")}>{plan.description}</p>}

                  <dl className={cn("relative mt-6 grid grid-cols-3 gap-2 rounded-[18px] p-3 text-center", featured ? "bg-white/10" : "bg-card/70 shadow-[var(--card-shadow)]")}>
                    {[
                      { Icon: Users, value: plan.maxAdmins, label: "admins" },
                      { Icon: MonitorSmartphone, value: plan.maxBornes, label: "bornes" },
                      { Icon: FileText, value: plan.maxAiDocuments, label: "docs" },
                    ].map(({ Icon, value, label }) => (
                      <div key={label}>
                        <dt className="sr-only">{label}</dt>
                        <Icon className={cn("mx-auto size-4", featured ? "opacity-70" : "text-muted-foreground")} aria-hidden />
                        <dd className="tabular mt-1 text-lg font-semibold">{value ?? "∞"}</dd>
                        <p className={cn("text-[11px]", featured ? "opacity-70" : "text-muted-foreground")}>{label}</p>
                      </div>
                    ))}
                  </dl>

                  {plan.features.length > 0 && (
                    <ul className="relative mt-6 space-y-2.5 text-sm">
                      {[...plan.features]
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((feature) => (
                          <li key={feature.id} className="flex items-start gap-2.5">
                            <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", featured ? "bg-brand text-on-brand" : "bg-brand-soft text-brand-ink")}>
                              <Check className="size-3" aria-hidden />
                            </span>
                            {feature.label}
                          </li>
                        ))}
                    </ul>
                  )}

                  <p className={cn("relative mt-auto pt-6 text-xs", featured ? "opacity-70" : "text-muted-foreground")}>
                    {count === 0 ? "Aucune organisation" : `${count} organisation${count > 1 ? "s" : ""} sur ce plan`}
                  </p>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      )}

      {editing && <PlanDialog key={editing.key} plan={editing.plan} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        loading={pending}
        onConfirm={onConfirm}
        tone={confirm?.kind === "delete" ? "danger" : "neutral"}
        title={
          confirm?.kind === "delete" ? `Supprimer le plan ${confirm.plan.name} ?` : confirm?.plan.active ? `Archiver le plan ${confirm.plan.name} ?` : `Réactiver le plan ${confirm?.plan.name ?? ""} ?`
        }
        description={
          confirm?.kind === "delete"
            ? (usage[confirm.plan.id] ?? 0) > 0
              ? "Ce plan est encore utilisé : changez d’abord le plan de ces organisations, sinon la suppression sera refusée."
              : "Ce plan sera définitivement supprimé."
            : confirm?.plan.active
              ? "Il ne sera plus proposé aux nouvelles organisations. Les organisations qui l’utilisent le conservent."
              : "Il sera de nouveau proposé aux organisations."
        }
        confirmLabel={confirm?.kind === "delete" ? "Supprimer" : confirm?.plan.active ? "Archiver" : "Réactiver"}
      />
    </>
  );
}

function PlanDialog({ plan, onClose }: { plan: Plan | null; onClose: () => void }) {
  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [amount, setAmount] = useState<number | null>(plan?.amount ?? null);
  const [period, setPeriod] = useState<BillingPeriod>(plan?.billingPeriod ?? "MOIS");
  const [maxAdmins, setMaxAdmins] = useState<number | null>(plan?.maxAdmins ?? 3);
  const [maxBornes, setMaxBornes] = useState<number | null>(plan?.maxBornes ?? 1);
  const [maxDocs, setMaxDocs] = useState<number | null>(plan?.maxAiDocuments ?? 50);
  const [features, setFeatures] = useState<ListItem[]>(() => [...(plan?.features ?? [])].sort((a, b) => a.displayOrder - b.displayOrder).map((f) => newItem(f.label)));
  const [submitted, setSubmitted] = useState(false);
  const { run, pending } = useAction();

  const errors = { name: name.trim() ? null : "Le nom est obligatoire.", amount: amount === null ? "Le prix est obligatoire (0 pour gratuit)." : null };

  const submit = async () => {
    setSubmitted(true);
    if (errors.name || errors.amount || amount === null) return;
    const result = await run(
      () =>
        savePlan(plan?.id ?? null, {
          name: name.trim(),
          description: description.trim() || null,
          amount,
          currency: "XOF",
          billingPeriod: period,
          maxAdmins,
          maxBornes,
          maxAiDocuments: maxDocs,
          features: features
            .map((f) => f.value.trim())
            .filter(Boolean)
            .map((label, displayOrder) => ({ label, displayOrder })),
        }),
      { success: plan ? "Plan mis à jour" : "Plan créé" },
    );
=======
import { CheckCircle2, CreditCard, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { EditableList, newItem, type ListItem } from "@/components/features/procedures/EditableList";
import { Field, IntegerInput, Select, Switch, TextArea, TextInput } from "@/components/forms/Fields";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/states";
import { IconButton } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { StatusPill } from "@/components/ui/StatusPill";
import { deletePlanAbonnement, savePlanAbonnement } from "@/lib/actions/platform";
import type { PlanAbonnement, PlanInput } from "@/lib/data/types";
import { formatNumber, formatXOF } from "@/lib/format";
import { useAction } from "@/lib/hooks/useAction";
import { Reveal } from "@/lib/motion/Reveal";

const PERIOD = { mensuel: "mois", trimestriel: "trimestre", annuel: "an" } as const;

function PlanDialog({ plan, onClose }: { plan: PlanAbonnement | null; onClose: () => void }) {
  const { run, pending } = useAction();
  const [form, setForm] = useState<Omit<PlanInput, "fonctionnalites"> & { fonctionnalites: ListItem[] }>(() => ({
    nom: plan?.nom ?? "",
    description: plan?.description ?? "",
    prix: plan?.prix ?? 0,
    devise: "XOF",
    periode: plan?.periode ?? "annuel",
    limiteUtilisateurs: plan?.limiteUtilisateurs ?? 5,
    limiteBornes: plan?.limiteBornes ?? 1,
    limiteStockage: plan?.limiteStockage ?? null,
    fonctionnalites: (plan?.fonctionnalites ?? []).map((f) => newItem(f)),
    statut: plan?.statut ?? "actif",
  }));
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    const input: PlanInput = { ...form, fonctionnalites: form.fonctionnalites.map((f) => f.value.trim()).filter(Boolean) };
    const result = await run(() => savePlanAbonnement(plan?.id ?? null, input), { success: plan ? "Plan mis à jour" : "Plan créé" });
>>>>>>> 939f032 (First Commit)
    if (result.ok) onClose();
  };

  return (
    <Dialog
      open
<<<<<<< HEAD
      onOpenChange={(open) => !open && onClose()}
      dismissible={false}
      size="lg"
      icon={<Receipt />}
      title={plan ? `Modifier ${plan.name}` : "Nouveau plan"}
      description="Montants entiers en FCFA. Une limite vide signifie « illimité »."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button loading={pending} onClick={submit}>
=======
      onClose={onClose}
      title={plan ? `Modifier « ${plan.nom} »` : "Nouveau plan d’abonnement"}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button onClick={submit} loading={pending} disabled={!form.nom.trim()}>
>>>>>>> 939f032 (First Commit)
            {plan ? "Enregistrer" : "Créer le plan"}
          </Button>
        </>
      }
    >
<<<<<<< HEAD
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" required error={submitted ? errors.name : null}>
            {(p) => <Input {...p} autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Standard" />}
          </Field>
          <Field label="Prix" required error={submitted ? errors.amount : null} hint={amount !== null ? `${formatXOF(amount)} / ${BILLING_PERIOD_LABELS[period]}` : undefined}>
            {(p) => <IntegerInput {...p} value={amount} onValueChange={setAmount} suffix="FCFA" placeholder="75000" />}
          </Field>
        </div>
        <div>
          <p className="mb-2 text-[13px] font-semibold text-foreground">Période de facturation</p>
          <Segmented aria-label="Période de facturation" value={period} onValueChange={setPeriod} options={BILLING_PERIODS.map((p) => ({ value: p, label: BILLING_PERIOD_NAMES[p] }))} />
        </div>
        <Field label="Description">{(p) => <Textarea {...p} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />}</Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Administrateurs max.">{(p) => <IntegerInput {...p} value={maxAdmins} onValueChange={setMaxAdmins} placeholder="∞" />}</Field>
          <Field label="Bornes max.">{(p) => <IntegerInput {...p} value={maxBornes} onValueChange={setMaxBornes} placeholder="∞" />}</Field>
          <Field label="Documents IA max.">{(p) => <IntegerInput {...p} value={maxDocs} onValueChange={setMaxDocs} placeholder="∞" />}</Field>
        </div>
        <div>
          <p className="mb-2 text-[13px] font-semibold text-foreground">Avantages affichés</p>
          <OrderedList items={features} onChange={setFeatures} placeholder="Assistant texte et voix…" addLabel="Ajouter un avantage" itemLabel="Avantage" numbered={false} />
=======
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" required>
          {(p) => <TextInput {...p} value={form.nom} onChange={(e) => set("nom", e.target.value)} autoFocus />}
        </Field>
        <Field label="Période">
          {(p) => (
            <Select {...p} value={form.periode} onChange={(e) => set("periode", e.target.value as PlanInput["periode"])}>
              <option value="mensuel">Mensuel</option>
              <option value="trimestriel">Trimestriel</option>
              <option value="annuel">Annuel</option>
            </Select>
          )}
        </Field>
        <Field label="Prix" hint={formatXOF(form.prix)}>
          {(p) => <IntegerInput {...p} value={form.prix} onValueChange={(v) => set("prix", v ?? 0)} suffix="FCFA" />}
        </Field>
        <Field label="Utilisateurs maximum">
          {(p) => <IntegerInput {...p} value={form.limiteUtilisateurs} onValueChange={(v) => set("limiteUtilisateurs", v ?? 1)} />}
        </Field>
        <Field label="Bornes maximum">
          {(p) => <IntegerInput {...p} value={form.limiteBornes} onValueChange={(v) => set("limiteBornes", v ?? 0)} />}
        </Field>
        <Field label="Stockage" hint="Vide = illimité.">
          {(p) => <IntegerInput {...p} value={form.limiteStockage} onValueChange={(v) => set("limiteStockage", v)} suffix="Go" />}
        </Field>
        <Field label="Description" className="sm:col-span-2">
          {(p) => <TextArea {...p} rows={2} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />}
        </Field>
        <div className="sm:col-span-2">
          <p className="mb-2 text-[13px] font-medium text-text">Fonctionnalités</p>
          <EditableList
            items={form.fonctionnalites}
            onChange={(items) => set("fonctionnalites", items)}
            placeholder="Assistant texte et voix"
            addLabel="Ajouter une fonctionnalité"
            itemLabel="Fonctionnalité"
            maxLength={120}
          />
        </div>
        <div className="sm:col-span-2">
          <Switch
            checked={form.statut === "actif"}
            onChange={(on) => set("statut", on ? "actif" : "inactif")}
            label={form.statut === "actif" ? "Proposé aux organisations" : "Masqué (inactif)"}
          />
>>>>>>> 939f032 (First Commit)
        </div>
      </div>
    </Dialog>
  );
}
<<<<<<< HEAD
=======

export function PlansManager({ plans }: { plans: PlanAbonnement[] }) {
  const [editing, setEditing] = useState<{ plan: PlanAbonnement | null } | null>(null);
  const [toDelete, setToDelete] = useState<PlanAbonnement | null>(null);
  const { run, pending } = useAction();

  return (
    <>
      <PageHeader
        title="Plans d’abonnement"
        description="Tarifs en FCFA et limites appliquées par le backend."
        actions={
          <Button magnetic icon={<Plus className="size-4" />} onClick={() => setEditing({ plan: null })}>
            Nouveau plan
          </Button>
        }
      />
      {plans.length === 0 ? (
        <EmptyState
          size="page"
          icon={<CreditCard />}
          title="Aucun plan"
          description="Créez un premier plan pour pouvoir abonner des organisations."
          action={<Button icon={<Plus className="size-4" />} onClick={() => setEditing({ plan: null })}>Créer un plan</Button>}
        />
      ) : (
        <Reveal className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.id} className="surface flex flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-xl font-semibold text-text">{plan.nom}</p>
                <StatusPill tone={plan.statut === "actif" ? "success" : "neutral"}>{plan.statut === "actif" ? "Actif" : "Inactif"}</StatusPill>
              </div>
              {plan.description && <p className="mt-1 text-sm text-muted">{plan.description}</p>}
              <p className="font-display tabular mt-5 text-[30px] leading-none font-semibold text-text">
                {formatXOF(plan.prix)}
                <span className="ml-1 text-sm font-medium text-muted">/ {PERIOD[plan.periode]}</span>
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                {[
                  ["Utilisateurs", formatNumber(plan.limiteUtilisateurs)],
                  ["Bornes", formatNumber(plan.limiteBornes)],
                  ["Stockage", plan.limiteStockage === null ? "∞" : `${plan.limiteStockage} Go`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-surface-2 px-2 py-2.5">
                    <p className="tabular text-base font-semibold text-text">{value}</p>
                    <p className="text-[11px] text-muted">{label}</p>
                  </div>
                ))}
              </div>
              <ul className="mt-5 flex-1 space-y-1.5">
                {plan.fonctionnalites.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-text">
                    <CheckCircle2 className="size-4 shrink-0 text-green-ink" aria-hidden /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex justify-end gap-1 border-t border-line pt-3">
                <IconButton label={`Modifier ${plan.nom}`} onClick={() => setEditing({ plan })}>
                  <Pencil />
                </IconButton>
                <IconButton label={`Supprimer ${plan.nom}`} tone="danger" onClick={() => setToDelete(plan)}>
                  <Trash2 />
                </IconButton>
              </div>
            </article>
          ))}
        </Reveal>
      )}
      {editing && <PlanDialog plan={editing.plan} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={toDelete !== null}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          const result = await run(() => deletePlanAbonnement(toDelete.id), { success: "Plan supprimé" });
          if (result.ok) setToDelete(null);
        }}
        loading={pending}
        tone="danger"
        title={`Supprimer « ${toDelete?.nom ?? ""} » ?`}
        description="Impossible si des organisations l’utilisent encore : désactivez-le plutôt."
        confirmLabel="Supprimer"
      />
    </>
  );
}
>>>>>>> 939f032 (First Commit)
