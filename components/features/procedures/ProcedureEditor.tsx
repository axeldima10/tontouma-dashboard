"use client";

import { ClipboardList, Coins, ExternalLink, Eye, EyeOff, FileCheck2, FileText, ListChecks, MapPin, NotebookPen, Save, Timer, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { useReadOnly } from "@/components/states/ReadOnly";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field, Fieldset } from "@/components/ui/Field";
import { AffixInput, Input, IntegerInput, Textarea } from "@/components/ui/Input";
import { newItem, OrderedList, type ListItem } from "@/components/ui/OrderedList";
import { Select } from "@/components/ui/Select";
import { ActivePill, PublicationPill, StatusPill } from "@/components/ui/StatusPill";
import { deleteProcedure, saveProcedure, setProcedureActive } from "@/lib/actions/content";
import type { ActionResult } from "@/lib/actions/result";
import type { Form, KnowledgeDocument, Procedure, ProcedureRequest, Service } from "@/lib/api/contract";
import { FormBuilder } from "@/components/features/forms/FormBuilder";
import { Tabs } from "@/components/ui/Tabs";
import { formatBytes, formatDateTime, formatXOF } from "@/lib/format";
import { useAction, violationFor } from "@/lib/hooks/useAction";
import { useUnsavedChanges } from "@/lib/hooks/useUnsavedChanges";
import { AssistantPreview } from "./AssistantPreview";

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

/** Le backend stocke les conditions en un seul texte : une condition par ligne (affichage uniquement). */
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
  service: Service;
  services: Service[];
  documents: KnowledgeDocument[];
  /** Formulaire de la démarche (admin) et version reçue par les citoyens (public). */
  procedureForm?: Form | null;
  publicForm?: Form | null;
};

/**
 * Éditeur de démarche : champs structurés, conditions et pièces ordonnées, un seul « Enregistrer »
 * et une publication séparée, confirmée. Enregistrer ne publie jamais.
 */
export function ProcedureEditor({ basePath, procedure, service, services, documents, procedureForm = null, publicForm = null }: ProcedureEditorProps) {
  const router = useRouter();
  const { readOnly } = useReadOnly();
  const [initial, setInitial] = useState(() => toForm(procedure, service.id, service.location));
  const [form, setForm] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [lastSave, setLastSave] = useState<ActionResult<unknown> | null>(null);
  const [confirm, setConfirm] = useState<"publish" | "unpublish" | "delete" | null>(null);
  const [tab, setTab] = useState<"contenu" | "formulaire">("contenu");
  const save = useAction();
  const status = useAction();

  const request = useMemo(() => toRequest(form), [form]);
  const dirty = JSON.stringify(request) !== JSON.stringify(toRequest(initial));
  useUnsavedChanges(dirty);

  const published = procedure?.active ?? false;
  const isNew = procedure === null;
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const errors = {
    title: !request.title ? "Le titre est obligatoire." : violationFor(lastSave, "title"),
    description: !request.description ? "La description est obligatoire." : violationFor(lastSave, "description"),
    conditions: !request.conditions ? "Ajoutez au moins une condition." : violationFor(lastSave, "conditions"),
  };
  const invalid = !request.title || !request.description || !request.conditions;
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
    setLastSave(result);
    if (!result.ok) return;
    const saved = toForm(result.data, result.data.serviceId, null);
    setInitial(saved);
    setForm(saved);
    setSubmitted(false);
    if (isNew || result.data.serviceId !== service.id) router.replace(`${basePath}/services/${result.data.serviceId}/demarches/${result.data.id}`);
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
      successDescription: active ? "L’assistant utilisera ce contenu d’ici quelques minutes." : "Les citoyens ne la verront plus d’ici quelques minutes.",
    });
    if (result.ok) setConfirm(null);
  };

  const actions = (compact: boolean) =>
    !readOnly && (
      <>
        {!isNew &&
          (compact ? (
            <Button variant="destructive-ghost" size="icon-sm" aria-label="Supprimer la démarche" className="mr-auto" onClick={() => setConfirm("delete")}>
              <Trash2 />
            </Button>
          ) : (
            <Button variant="destructive-ghost" icon={<Trash2 />} onClick={() => setConfirm("delete")}>
              Supprimer
            </Button>
          ))}
        {!isNew &&
          (published ? (
            <Button variant="secondary" size={compact ? "sm" : "md"} icon={<EyeOff />} onClick={() => setConfirm("unpublish")}>
              Dépublier
            </Button>
          ) : (
            <Button
              variant="brand"
              size={compact ? "sm" : "md"}
              icon={<Eye />}
              onClick={() => setConfirm("publish")}
              disabled={dirty}
              title={dirty ? "Enregistrez d’abord vos modifications" : undefined}
            >
              Publier
            </Button>
          ))}
        <Button size={compact ? "sm" : "md"} icon={<Save />} onClick={onSave} loading={save.pending} disabled={!dirty && !isNew}>
          {isNew ? "Créer le brouillon" : "Enregistrer"}
        </Button>
      </>
    );

  const contentPanel = (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
          <Fieldset disabled={readOnly} className="space-y-5">
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void onSave();
              }}
            >
              <Card>
                <CardHeader icon={<NotebookPen />} title="Informations générales" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Titre de la démarche" required error={show(errors.title)} className="sm:col-span-2">
                    {(p) => <Input {...p} value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={255} placeholder="Extrait d’acte de naissance" />}
                  </Field>
                  <Field label="Service" required className="sm:col-span-2">
                    {(p) => (
                      <Select {...p} value={form.serviceId} onValueChange={(v) => set("serviceId", v)} disabled={readOnly} options={services.map((s) => ({ value: s.id, label: s.name, description: s.departmentName }))} />
                    )}
                  </Field>
                  <Field label="Description" required error={show(errors.description)} className="sm:col-span-2" hint="À quoi sert la démarche, en une ou deux phrases simples.">
                    {(p) => <Textarea {...p} rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />}
                  </Field>
                </div>
              </Card>

              <Card>
                <CardHeader icon={<Coins />} title="Coût, délai et lieu" description="Des champs structurés : l’assistant les annonce tels quels aux citoyens." />
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Coût" hint={form.cost === null ? "Laissez vide si inconnu." : form.cost === 0 ? "Gratuit" : formatXOF(form.cost)}>
                    {(p) => <IntegerInput {...p} value={form.cost} onValueChange={(v) => set("cost", v)} suffix="FCFA" placeholder="0" />}
                  </Field>
                  <Field label="Délai de traitement" hint={form.processingDays === 0 ? "Immédiat" : undefined}>
                    {(p) => <IntegerInput {...p} value={form.processingDays} onValueChange={(v) => set("processingDays", v)} suffix="jours" />}
                  </Field>
                  <Field label="Lieu">
                    {(p) => <AffixInput {...p} prefix={<MapPin />} value={form.place} onChange={(e) => set("place", e.target.value)} maxLength={500} placeholder="Guichet 3" />}
                  </Field>
                </div>
              </Card>

              <Card>
                <CardHeader
                  icon={<ListChecks />}
                  title="Conditions"
                  description="Dans l’ordre où le citoyen doit les vérifier. Glissez pour réordonner, Entrée pour ajouter la suivante."
                />
                <OrderedList
                  items={form.conditions}
                  onChange={(items) => set("conditions", items)}
                  placeholder="Être majeur…"
                  addLabel="Ajouter une condition"
                  itemLabel="Condition"
                  disabled={readOnly}
                  maxLength={500}
                />
                {show(errors.conditions) && <p className="mt-2 text-xs font-medium text-destructive">{errors.conditions}</p>}
              </Card>

              <Card>
                <CardHeader icon={<FileCheck2 />} title="Pièces requises" description="Ce que le citoyen doit apporter, dans l’ordre d’importance." />
                <OrderedList
                  items={form.requiredDocuments}
                  onChange={(items) => set("requiredDocuments", items)}
                  placeholder="Pièce d’identité…"
                  addLabel="Ajouter une pièce"
                  itemLabel="Pièce"
                  disabled={readOnly}
                  numbered={false}
                />
              </Card>

              <Card>
                <CardHeader icon={<Timer />} title="Informations complémentaires" />
                <Field label="Précisions" hint="Facultatif : cas particuliers, conseils, rendez-vous…">
                  {(p) => <Textarea {...p} rows={3} value={form.additionalInfo} onChange={(e) => set("additionalInfo", e.target.value)} />}
                </Field>
              </Card>
            </form>

            {documents.length > 0 && (
              <Card>
                <CardHeader icon={<FileText />} title="Documents de référence liés" description="Issus de la base de connaissances, rattachés à cette démarche." />
                <ul className="divide-y divide-border">
                  {documents.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-3 py-3">
                      <span className="grid size-9 place-items-center rounded-xl bg-info-soft text-info">
                        <FileText className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.category ?? "Document"} · {formatBytes(doc.fileSizeBytes)}
                        </p>
                      </div>
                      <ActivePill active={doc.active} />
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-accent" aria-label={`Ouvrir ${doc.title}`}>
                          <ExternalLink className="size-4" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </Fieldset>

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
        </div>
  );

  return (
    <div className="pb-24 lg:pb-0">
      <PageHeader
        back={{ href: `${basePath}/services/${service.id}`, label: service.name }}
        kicker="Démarche"
        title={isNew ? "Nouvelle démarche" : form.title || "Sans titre"}
        badges={
          <>
            {!isNew && <PublicationPill active={published} />}
            {dirty && <StatusPill tone="info">Non enregistré</StatusPill>}
          </>
        }
        description={procedure ? `Modifiée le ${formatDateTime(procedure.updatedAt)}` : "Enregistrée en brouillon : rien n’est visible des citoyens avant publication."}
        actions={tab === "contenu" && <div className="hidden flex-wrap gap-2 lg:flex">{actions(false)}</div>}
      />

      {procedure ? (
        <Tabs
          aria-label="Sections de la démarche"
          value={tab}
          onValueChange={setTab}
          tabs={[
            { value: "contenu", label: <><NotebookPen /> Contenu</>, content: contentPanel },
            {
              value: "formulaire",
              label: (
                <>
                  <ClipboardList /> Formulaire {procedureForm?.active && <span className="size-1.5 rounded-full bg-brand" aria-label="publié" />}
                </>
              ),
              content: <FormBuilder procedureId={procedure.id} procedureTitle={procedure.title} procedurePublished={published} form={procedureForm} publicForm={publicForm} />,
            },
          ]}
        />
      ) : (
        contentPanel
      )}

      {/* Barre d'actions collante sur tablette et mobile */}
      {!readOnly && tab === "contenu" && <div className="glass fixed inset-x-3 bottom-3 z-30 flex items-center justify-end gap-2 rounded-full p-2 md:left-[108px] lg:hidden">{actions(true)}</div>}

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        onConfirm={onConfirm}
        loading={status.pending}
        tone={confirm === "publish" ? "publish" : confirm === "delete" ? "danger" : "neutral"}
        title={confirm === "publish" ? "Publier cette démarche ?" : confirm === "unpublish" ? "Dépublier cette démarche ?" : "Supprimer cette démarche ?"}
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
