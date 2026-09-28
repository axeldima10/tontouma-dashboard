"use client";

import { Eye, EyeOff, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DocumentsPanel, type DocumentRow } from "@/components/features/documents/DocumentsPanel";
import { Field, FormFieldset, IntegerInput, Select, TextArea, TextInput } from "@/components/forms/Fields";
import { useReadOnly } from "@/components/states/ReadOnly";
import { BackLink, PublicationBadge } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteProcedure, saveProcedure, setProcedureActive } from "@/lib/actions/content";
import { cn } from "@/lib/cn";
import type { Procedure, ProcedureRequest, ServiceOffering } from "@/lib/data/types";
import { formatDateTime, formatXOF } from "@/lib/format";
import { useAction } from "@/lib/hooks/useAction";
import { useUnsavedChanges } from "@/lib/hooks/useUnsavedChanges";
import { Reveal } from "@/lib/motion/Reveal";
import { AssistantPreview } from "./AssistantPreview";
import { EditableList, newItem, type ListItem } from "./EditableList";

type FormState = {
  serviceId: string;
  title: string;
  description: string;
  conditions: ListItem[];
  cost: number | null;
  processingDays: number | null;
  place: string;
  additionalInfo: string;
  requiredDocuments: ListItem[];
};

/** Le backend stocke les conditions en un seul texte : une condition par ligne. */
function toForm(p: Procedure | null, serviceId: string, defaultPlace: string | null): FormState {
  return {
    serviceId: p?.serviceId ?? serviceId,
    title: p?.title ?? "",
    description: p?.description ?? "",
    conditions: (p?.conditions ?? "")
      .split(/\r?\n/)
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => newItem(c)),
    cost: p?.cost ?? null,
    processingDays: p?.processingDays ?? null,
    place: p?.place ?? defaultPlace ?? "",
    additionalInfo: p?.additionalInfo ?? "",
    requiredDocuments: (p?.requiredDocuments ?? [])
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((d) => newItem(d.label)),
  };
}

function toRequest(form: FormState): ProcedureRequest {
  return {
    serviceId: form.serviceId,
    title: form.title.trim(),
    description: form.description.trim(),
    conditions: form.conditions.map((c) => c.value.trim()).filter(Boolean).join("\n"),
    cost: form.cost,
    costCurrency: "XOF",
    place: form.place.trim() || null,
    additionalInfo: form.additionalInfo.trim() || null,
    processingDays: form.processingDays,
    requiredDocuments: form.requiredDocuments
      .map((d) => d.value.trim())
      .filter(Boolean)
      .map((label, displayOrder) => ({ label, displayOrder })),
  };
}

type ProcedureEditorProps = {
  basePath: string;
  procedure: Procedure | null;
  service: ServiceOffering;
  services: ServiceOffering[];
  documents: DocumentRow[];
};

export function ProcedureEditor({ basePath, procedure, service, services, documents }: ProcedureEditorProps) {
  const router = useRouter();
  const { readOnly } = useReadOnly();
  const [initial, setInitial] = useState(() => toForm(procedure, service.id, service.localisation));
  const [form, setForm] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [confirm, setConfirm] = useState<"publish" | "unpublish" | "delete" | null>(null);
  const save = useAction();
  const status = useAction();

  const request = useMemo(() => toRequest(form), [form]);
  const dirty = JSON.stringify(request) !== JSON.stringify(toRequest(initial));
  useUnsavedChanges(dirty);

  const published = procedure?.active ?? false;
  const isNew = procedure === null;
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const errors = {
    title: !request.title ? "Le titre est obligatoire." : null,
    description: !request.description ? "La description est obligatoire." : null,
    conditions: !request.conditions ? "Ajoutez au moins une condition." : null,
  };
  const invalid = Object.values(errors).some(Boolean);
  const show = (error: string | null) => (submitted ? error : null);

  const onSave = async () => {
    setSubmitted(true);
    if (invalid) return;
    const result = await save.run(() => saveProcedure(procedure?.id ?? null, request), {
      success: isNew ? "Démarche créée en brouillon" : "Démarche enregistrée",
      successDescription: published
        ? "L’assistant utilisera la nouvelle version d’ici quelques minutes."
        : "Toujours en brouillon : invisible des citoyens tant qu’elle n’est pas publiée.",
    });
    if (!result.ok) return;
    const saved = toForm(result.data, result.data.serviceId, null);
    setInitial(saved);
    setForm(saved);
    setSubmitted(false);
    if (isNew || result.data.serviceId !== service.id)
      router.replace(`${basePath}/services/${result.data.serviceId}/demarches/${result.data.id}`);
  };

  const onConfirm = async () => {
    if (!procedure) return;
    if (confirm === "delete") {
      const result = await status.run(() => deleteProcedure(procedure.id), { success: "Démarche supprimée" });
      if (result.ok) router.push(`${basePath}/services/${service.id}`);
      return;
    }
    const active = confirm === "publish";
    const result = await status.run(() => setProcedureActive(procedure.id, active), {
      success: active ? "Démarche publiée" : "Démarche dépubliée",
      successDescription: active
        ? "L’assistant utilisera ce contenu d’ici quelques minutes."
        : "Les citoyens ne la verront plus d’ici quelques minutes.",
    });
    if (result.ok) setConfirm(null);
  };

  const actions = !readOnly && (
    <>
      {!isNew && (
        <Button variant="ghost" icon={<Trash2 className="size-4" />} onClick={() => setConfirm("delete")} className="max-sm:hidden">
          Supprimer
        </Button>
      )}
      {!isNew &&
        (published ? (
          <Button variant="secondary" icon={<EyeOff className="size-4" />} onClick={() => setConfirm("unpublish")}>
            Dépublier
          </Button>
        ) : (
          <Button
            variant="secondary"
            icon={<Eye className="size-4" />}
            onClick={() => setConfirm("publish")}
            disabled={dirty}
            title={dirty ? "Enregistrez d’abord vos modifications" : undefined}
          >
            Publier
          </Button>
        ))}
      <Button magnetic icon={<Save className="size-4" />} onClick={onSave} loading={save.pending} disabled={!dirty && !isNew}>
        {isNew ? "Créer le brouillon" : "Enregistrer"}
      </Button>
    </>
  );

  return (
    <div className="pb-20 lg:pb-0">
      <BackLink href={`${basePath}/services/${service.id}`}>{service.nom}</BackLink>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[26px] leading-tight font-semibold text-text sm:text-[30px]">
              {isNew ? "Nouvelle démarche" : form.title || "Sans titre"}
            </h1>
            {!isNew && <PublicationBadge published={published} />}
            {dirty && <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning">Non enregistré</span>}
          </div>
          {procedure && <p className="mt-1.5 text-sm text-muted">Modifiée le {formatDateTime(procedure.updatedAt)}</p>}
        </div>
        <div className="hidden flex-wrap gap-2 lg:flex">{actions}</div>
      </header>

      <Reveal className="grid gap-5 xl:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <FormFieldset disabled={readOnly} className="space-y-5">
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void onSave();
            }}
          >
            <Card>
              <CardHeader title="Informations générales" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Titre de la démarche" required error={show(errors.title)} className="sm:col-span-2">
                  {(p) => (
                    <TextInput {...p} value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={255} placeholder="Extrait d’acte de naissance" />
                  )}
                </Field>
                <Field label="Service" required className="sm:col-span-2">
                  {(p) => (
                    <Select {...p} value={form.serviceId} onChange={(e) => set("serviceId", e.target.value)}>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nom}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Description" required error={show(errors.description)} className="sm:col-span-2" hint="À quoi sert la démarche, en une ou deux phrases simples.">
                  {(p) => <TextArea {...p} rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />}
                </Field>
              </div>
            </Card>

            <Card>
              <CardHeader title="Coût, délai et lieu" description="Des champs structurés : l’assistant les annonce tels quels aux citoyens." />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Coût" hint={form.cost === null ? "Laissez vide si non connu." : form.cost === 0 ? "Gratuit" : formatXOF(form.cost)}>
                  {(p) => <IntegerInput {...p} value={form.cost} onValueChange={(v) => set("cost", v)} suffix="FCFA" placeholder="0" />}
                </Field>
                <Field label="Délai de traitement">
                  {(p) => <IntegerInput {...p} value={form.processingDays} onValueChange={(v) => set("processingDays", v)} suffix="jours" />}
                </Field>
                <Field label="Lieu">
                  {(p) => <TextInput {...p} value={form.place} onChange={(e) => set("place", e.target.value)} maxLength={500} placeholder="Guichet 3" />}
                </Field>
              </div>
            </Card>

            <Card>
              <CardHeader title="Conditions" description="Dans l’ordre où le citoyen doit les vérifier. Entrée pour ajouter la suivante." />
              <EditableList
                items={form.conditions}
                onChange={(items) => set("conditions", items)}
                placeholder="Être majeur…"
                addLabel="Ajouter une condition"
                itemLabel="Condition"
                disabled={readOnly}
                maxLength={500}
              />
              {show(errors.conditions) && <p className="mt-2 text-xs font-medium text-danger">{errors.conditions}</p>}
            </Card>

            <Card>
              <CardHeader title="Pièces requises" description="Ce que le citoyen doit apporter." />
              <EditableList
                items={form.requiredDocuments}
                onChange={(items) => set("requiredDocuments", items)}
                placeholder="Pièce d’identité…"
                addLabel="Ajouter une pièce"
                itemLabel="Pièce"
                disabled={readOnly}
              />
            </Card>

            <Card>
              <CardHeader title="Informations complémentaires" />
              <Field label="Précisions" hint="Facultatif : cas particuliers, conseils, rendez-vous…">
                {(p) => <TextArea {...p} rows={3} value={form.additionalInfo} onChange={(e) => set("additionalInfo", e.target.value)} />}
              </Field>
            </Card>
          </form>

          {procedure ? (
            <DocumentsPanel
              documents={documents}
              scope={{ kind: "procedure", procedureId: procedure.id, serviceId: procedure.serviceId }}
              emptyHint="Un règlement ou un guide propre à cette démarche complète les réponses de l’assistant."
            />
          ) : (
            <p className="surface px-5 py-4 text-sm text-muted">
              Enregistrez le brouillon pour pouvoir y joindre des documents de référence.
            </p>
          )}
        </FormFieldset>

        <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
          <AssistantPreview
            title={form.title}
            cost={form.cost}
            processingDays={form.processingDays}
            place={form.place}
            conditions={form.conditions.map((c) => c.value.trim()).filter(Boolean)}
            documents={form.requiredDocuments.map((d) => d.value.trim()).filter(Boolean)}
            published={published}
          />
        </aside>
      </Reveal>

      {/* Barre d'actions collante sur tablette et mobile. */}
      {!readOnly && (
        <div
          className={cn(
            "glass fixed inset-x-3 bottom-3 z-30 flex flex-wrap items-center justify-end gap-2 rounded-2xl p-2.5 lg:hidden",
            "md:left-[104px]",
          )}
        >
          {actions}
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        onCancel={() => setConfirm(null)}
        onConfirm={onConfirm}
        loading={status.pending}
        tone={confirm === "publish" ? "primary" : "danger"}
        title={
          confirm === "publish" ? "Publier cette démarche ?" : confirm === "unpublish" ? "Dépublier cette démarche ?" : "Supprimer cette démarche ?"
        }
        description={
          confirm === "publish"
            ? "Les citoyens et l’assistant verront le coût, le délai, les conditions et les pièces tels qu’enregistrés. Vérifiez-les : une erreur serait répétée aux citoyens."
            : confirm === "unpublish"
              ? "Les citoyens ne verront plus cette démarche. Vous pourrez la republier à tout moment."
              : published
                ? "Cette démarche est publiée : les citoyens ne la verront plus. Cette action est définitive."
                : "Ce brouillon sera définitivement supprimé."
        }
        confirmLabel={confirm === "publish" ? "Publier" : confirm === "unpublish" ? "Dépublier" : "Supprimer"}
      />
    </div>
  );
}
