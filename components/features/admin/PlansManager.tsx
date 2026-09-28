"use client";

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
    if (result.ok) onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={plan ? `Modifier « ${plan.nom} »` : "Nouveau plan d’abonnement"}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button onClick={submit} loading={pending} disabled={!form.nom.trim()}>
            {plan ? "Enregistrer" : "Créer le plan"}
          </Button>
        </>
      }
    >
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
        </div>
      </div>
    </Dialog>
  );
}

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
