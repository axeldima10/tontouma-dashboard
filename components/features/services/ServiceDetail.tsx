"use client";

import { ArrowRight, Clock, Coins, Eye, EyeOff, Navigation, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DocumentsPanel, type DocumentRow } from "@/components/features/documents/DocumentsPanel";
import { Field, FormFieldset, Select, TextArea, TextInput } from "@/components/forms/Fields";
import { EmptyState } from "@/components/states";
import { useReadOnly } from "@/components/states/ReadOnly";
import { BackLink, PublicationBadge } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteService, setServiceStatus, updateService } from "@/lib/actions/content";
import type { Departement, Procedure, ServiceInput, ServiceOffering } from "@/lib/data/types";
import { formatNumber, formatXOF } from "@/lib/format";
import { useAction } from "@/lib/hooks/useAction";
import { useUnsavedChanges } from "@/lib/hooks/useUnsavedChanges";
import { Reveal } from "@/lib/motion/Reveal";

type ServiceDetailProps = {
  basePath: string;
  service: ServiceOffering;
  departements: Departement[];
  procedures: Procedure[];
  documents: DocumentRow[];
};

const toInput = (s: ServiceOffering): ServiceInput => ({
  departement_id: s.departement_id,
  nom: s.nom,
  description: s.description,
  localisation: s.localisation,
  telephone: s.telephone,
  email: s.email,
  horaires: s.horaires,
  description_orientation: s.description_orientation,
});

export function ServiceDetail({ basePath, service, departements, procedures, documents }: ServiceDetailProps) {
  const router = useRouter();
  const { readOnly } = useReadOnly();
  const [initial, setInitial] = useState(() => toInput(service));
  const [form, setForm] = useState(initial);
  const [confirm, setConfirm] = useState<"publish" | "unpublish" | "delete" | null>(null);
  const save = useAction();
  const status = useAction();

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useUnsavedChanges(dirty);
  const published = service.statut_publication === "publie";
  const set = <K extends keyof ServiceInput>(key: K, value: ServiceInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const text = (key: keyof ServiceInput) => (form[key] as string | null) ?? "";

  const onSave = async () => {
    const result = await save.run(() => updateService(service.id, form), {
      success: "Service enregistré",
      successDescription: published ? "Les citoyens verront la mise à jour d’ici quelques minutes." : "Toujours en brouillon : publiez-le quand il est prêt.",
    });
    if (result.ok) {
      setInitial(toInput(result.data));
      setForm(toInput(result.data));
    }
  };

  const onConfirm = async () => {
    if (confirm === "delete") {
      const result = await status.run(() => deleteService(service.id), { success: "Service supprimé" });
      if (result.ok) router.push(`${basePath}/services`);
      return;
    }
    const next = confirm === "publish" ? "publie" : "brouillon";
    const result = await status.run(() => setServiceStatus(service.id, next), {
      success: next === "publie" ? "Service publié" : "Service dépublié",
      successDescription:
        next === "publie"
          ? "L’assistant utilisera ce service d’ici quelques minutes."
          : "Les citoyens ne le verront plus d’ici quelques minutes.",
    });
    if (result.ok) setConfirm(null);
  };

  return (
    <>
      <BackLink href={`${basePath}/services`}>Services & démarches</BackLink>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[26px] leading-tight font-semibold text-text sm:text-[30px]">{service.nom}</h1>
            <PublicationBadge published={published} />
          </div>
          <p className="mt-1.5 text-sm text-muted">
            {departements.find((d) => d.id === service.departement_id)?.nom ?? "Sans département"}
          </p>
        </div>
        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" icon={<Trash2 className="size-4" />} onClick={() => setConfirm("delete")}>
              Supprimer
            </Button>
            {published ? (
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
            )}
            <Button magnetic icon={<Save className="size-4" />} onClick={onSave} loading={save.pending} disabled={!dirty}>
              Enregistrer
            </Button>
          </div>
        )}
      </header>

      <Reveal className="grid gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader title="Fiche du service" description="Ces informations sont lues par l’assistant pour orienter les citoyens." />
          <FormFieldset disabled={readOnly}>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (dirty) void onSave();
              }}
            >
              <Field label="Nom" required className="sm:col-span-2">
                {(p) => <TextInput {...p} value={form.nom} onChange={(e) => set("nom", e.target.value)} maxLength={160} />}
              </Field>
              <Field label="Département">
                {(p) => (
                  <Select {...p} value={form.departement_id ?? ""} onChange={(e) => set("departement_id", e.target.value || null)}>
                    <option value="">Sans département</option>
                    {departements.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nom}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Localisation">
                {(p) => <TextInput {...p} value={text("localisation")} onChange={(e) => set("localisation", e.target.value)} placeholder="Rez-de-chaussée, guichet 3" />}
              </Field>
              <Field label="Description" className="sm:col-span-2">
                {(p) => <TextArea {...p} rows={3} value={text("description")} onChange={(e) => set("description", e.target.value)} />}
              </Field>
              <Field label="Téléphone">
                {(p) => <TextInput {...p} type="tel" value={text("telephone")} onChange={(e) => set("telephone", e.target.value)} placeholder="+221 33 000 00 00" />}
              </Field>
              <Field label="Email">
                {(p) => <TextInput {...p} type="email" value={text("email")} onChange={(e) => set("email", e.target.value)} />}
              </Field>
              <Field label="Horaires d’ouverture" className="sm:col-span-2">
                {(p) => <TextInput {...p} value={text("horaires")} onChange={(e) => set("horaires", e.target.value)} placeholder="Lundi–vendredi, 8 h – 15 h 30" />}
              </Field>
              <Field
                label="Indication d’orientation"
                className="sm:col-span-2"
                hint="Lue à voix haute par l’assistant : « Couloir central, première porte à droite ». Placez aussi le service sur un plan."
              >
                {(p) => (
                  <div className="relative">
                    <Navigation className="pointer-events-none absolute top-3 left-3.5 size-4 text-green-ink" aria-hidden />
                    <TextArea
                      {...p}
                      rows={2}
                      className="pl-10"
                      value={text("description_orientation")}
                      onChange={(e) => set("description_orientation", e.target.value)}
                      maxLength={500}
                    />
                  </div>
                )}
              </Field>
            </form>
          </FormFieldset>
        </Card>

        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader
              title="Démarches"
              description={`${procedures.filter((p) => p.active).length} publiée(s) sur ${procedures.length}`}
              action={
                !readOnly && (
                  <Button size="sm" icon={<Plus className="size-3.5" />} href={`${basePath}/services/${service.id}/demarches/nouvelle`}>
                    Nouvelle
                  </Button>
                )
              }
            />
            {procedures.length === 0 ? (
              <EmptyState
                icon={<Plus />}
                title="Aucune démarche"
                description="Ajoutez la première démarche de ce service : coût, délai, conditions et pièces requises."
              />
            ) : (
              <ul className="space-y-2">
                {procedures.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`${basePath}/services/${service.id}/demarches/${p.id}`}
                      className="group flex items-center gap-3 rounded-2xl border border-line px-4 py-3 transition-colors hover:border-green/40 hover:bg-surface-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-text">{p.title}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted">
                          <span className="inline-flex items-center gap-1">
                            <Coins className="size-3" aria-hidden />
                            {p.cost === null ? "Coût non renseigné" : p.cost === 0 ? "Gratuit" : formatXOF(p.cost)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3" aria-hidden />
                            {p.processingDays === null ? "Délai non renseigné" : `${formatNumber(p.processingDays)} j`}
                          </span>
                        </p>
                      </div>
                      <PublicationBadge published={p.active} />
                      <ArrowRight className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-1 group-hover:text-green-ink" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <DocumentsPanel
            documents={documents}
            scope={{ kind: "service", serviceId: service.id }}
            emptyHint="Un guide ou une FAQ propre à ce service enrichit les réponses de l’assistant."
          />
        </div>
      </Reveal>

      <ConfirmDialog
        open={confirm !== null}
        onCancel={() => setConfirm(null)}
        onConfirm={onConfirm}
        loading={status.pending}
        tone={confirm === "delete" || confirm === "unpublish" ? "danger" : "primary"}
        title={
          confirm === "publish"
            ? `Publier « ${service.nom} » ?`
            : confirm === "unpublish"
              ? `Dépublier « ${service.nom} » ?`
              : `Supprimer « ${service.nom} » ?`
        }
        description={
          confirm === "publish"
            ? "Les citoyens et l’assistant pourront consulter ce service. Seules ses démarches publiées seront visibles."
            : confirm === "unpublish"
              ? "Les citoyens ne verront plus ce service ni ses démarches. Vous pourrez le republier à tout moment."
              : published
                ? "Ce service est publié : les citoyens ne le verront plus. Il doit d’abord être vidé de ses démarches."
                : "Le service doit d’abord être vidé de ses démarches. Cette action est définitive."
        }
        confirmLabel={confirm === "publish" ? "Publier" : confirm === "unpublish" ? "Dépublier" : "Supprimer"}
      />
    </>
  );
}
