"use client";

import { ArrowRight, Clock, Eye, EyeOff, FileText, Plus, Save, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { useReadOnly } from "@/components/states/ReadOnly";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Fieldset } from "@/components/ui/Field";
import { PublicationPill, StatusPill } from "@/components/ui/StatusPill";
import { deleteService, saveService, setServiceActive } from "@/lib/actions/content";
import type { Department, Procedure, Service } from "@/lib/api/contract";
import { formatDateTime, formatXOF } from "@/lib/format";
import { useAction } from "@/lib/hooks/useAction";
import { useUnsavedChanges } from "@/lib/hooks/useUnsavedChanges";
import { ServiceFields, serviceErrors, toServiceForm, toServiceRequest } from "./ServiceForm";

type ServiceDetailProps = {
  basePath: string;
  service: Service;
  departments: Department[];
  procedures: Procedure[];
};

export function ServiceDetail({ basePath, service, departments, procedures }: ServiceDetailProps) {
  const router = useRouter();
  const { readOnly } = useReadOnly();
  const [initial, setInitial] = useState(() => toServiceForm(service, departments));
  const [form, setForm] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [confirm, setConfirm] = useState<"publish" | "unpublish" | "delete" | null>(null);
  const save = useAction();
  const status = useAction();

  const dirty = JSON.stringify(toServiceRequest(form)) !== JSON.stringify(toServiceRequest(initial));
  useUnsavedChanges(dirty);
  const errors = serviceErrors(form);

  const onSave = async () => {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    const result = await save.run(() => saveService(service.id, toServiceRequest(form)), {
      success: "Service enregistré",
      successDescription: service.active ? "L’assistant utilisera ces informations d’ici quelques minutes." : "Toujours en brouillon : invisible des citoyens.",
    });
    if (!result.ok) return;
    const next = toServiceForm(result.data, departments);
    setInitial(next);
    setForm(next);
    setSubmitted(false);
  };

  const onConfirm = async () => {
    if (confirm === "delete") {
      const result = await status.run(() => deleteService(service.id), { success: "Service supprimé" });
      if (result.ok) router.push(`${basePath}/services`);
      return;
    }
    const active = confirm === "publish";
    const result = await status.run(() => setServiceActive(service.id, active), {
      success: active ? "Service publié" : "Service dépublié",
      successDescription: active ? "L’assistant utilisera ce contenu d’ici quelques minutes." : "Les citoyens ne le verront plus d’ici quelques minutes.",
    });
    if (result.ok) setConfirm(null);
  };

  const publishedCount = procedures.filter((p) => p.active).length;

  return (
    <div className="pb-24 lg:pb-0">
      <PageHeader
        back={{ href: `${basePath}/services`, label: "Services & démarches" }}
        kicker={service.departmentName ?? "Service"}
        title={service.name}
        badges={
          <>
            <PublicationPill active={service.active} />
            {dirty && <StatusPill tone="info">Modifications non enregistrées</StatusPill>}
          </>
        }
        description={`Modifié le ${formatDateTime(service.updatedAt)}`}
        actions={
          !readOnly && (
            <div className="hidden flex-wrap gap-2 lg:flex">
              <Button variant="destructive-ghost" icon={<Trash2 />} onClick={() => setConfirm("delete")}>
                Supprimer
              </Button>
              {service.active ? (
                <Button variant="secondary" icon={<EyeOff />} onClick={() => setConfirm("unpublish")}>
                  Dépublier
                </Button>
              ) : (
                <Button variant="brand" icon={<Eye />} onClick={() => setConfirm("publish")} disabled={dirty} title={dirty ? "Enregistrez d’abord vos modifications" : undefined}>
                  Publier
                </Button>
              )}
              <Button icon={<Save />} loading={save.pending} disabled={!dirty} onClick={onSave}>
                Enregistrer
              </Button>
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader title="Informations du service" description="Des champs structurés : l’assistant les annonce tels quels aux citoyens." />
          <Fieldset disabled={readOnly}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void onSave();
              }}
            >
              <ServiceFields form={form} onChange={setForm} departments={departments} errors={errors} showErrors={submitted} disabled={readOnly} layout="page" />
            </form>
          </Fieldset>
        </Card>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <section className="glass rounded-[26px] p-5 sm:p-6">
            <header className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Démarches</h2>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  {procedures.length === 0 ? "Aucune démarche pour l’instant." : `${publishedCount} publiée${publishedCount > 1 ? "s" : ""} sur ${procedures.length}`}
                </p>
              </div>
              {!readOnly && (
                <Button size="sm" icon={<Plus />} href={`${basePath}/services/${service.id}/demarches/nouvelle`}>
                  Nouvelle
                </Button>
              )}
            </header>
            {procedures.length === 0 ? (
              <Link
                href={`${basePath}/services/${service.id}/demarches/nouvelle`}
                className="flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-border-strong bg-card/50 px-6 py-10 text-center text-sm text-muted-foreground transition hover:border-brand hover:text-brand-ink"
              >
                <FileText className="size-6" aria-hidden />
                Ajoutez la première démarche : coût, délai, conditions et pièces à fournir.
              </Link>
            ) : (
              <ul className="space-y-2">
                {procedures.map((procedure, index) => (
                  <motion.li key={procedure.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.04 }}>
                    <Link
                      href={`${basePath}/services/${service.id}/demarches/${procedure.id}`}
                      className="group flex items-center gap-3 rounded-[18px] bg-card px-4 py-3 shadow-[var(--card-shadow)] transition hover:-translate-y-0.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{procedure.title}</p>
                        <p className="mt-0.5 flex items-center gap-2 truncate text-xs text-muted-foreground">
                          <span className="tabular">{procedure.cost === null ? "Coût non précisé" : procedure.cost === 0 ? "Gratuit" : formatXOF(procedure.cost)}</span>
                          {procedure.processingDays !== null && (
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" aria-hidden />
                              {procedure.processingDays} j
                            </span>
                          )}
                        </p>
                      </div>
                      <PublicationPill active={procedure.active} />
                      <ArrowRight className="size-4 text-subtle transition group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden />
                    </Link>
                  </motion.li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {/* Barre d'actions collante sur tablette et mobile */}
      {!readOnly && (
        <div className="glass fixed inset-x-3 bottom-3 z-30 flex items-center justify-end gap-2 rounded-full p-2 md:left-[108px] lg:hidden">
          {service.active ? (
            <Button variant="secondary" size="sm" icon={<EyeOff />} onClick={() => setConfirm("unpublish")}>
              Dépublier
            </Button>
          ) : (
            <Button variant="brand" size="sm" icon={<Eye />} onClick={() => setConfirm("publish")} disabled={dirty}>
              Publier
            </Button>
          )}
          <Button size="sm" icon={<Save />} loading={save.pending} disabled={!dirty} onClick={onSave}>
            Enregistrer
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        loading={status.pending}
        onConfirm={onConfirm}
        tone={confirm === "publish" ? "publish" : confirm === "delete" ? "danger" : "neutral"}
        title={confirm === "publish" ? "Publier ce service ?" : confirm === "unpublish" ? "Dépublier ce service ?" : "Supprimer ce service ?"}
        description={
          confirm === "publish"
            ? "Les citoyens et l’assistant verront ce service, son lieu, son téléphone et ses horaires tels qu’enregistrés. Vérifiez-les : une erreur serait répétée aux citoyens."
            : confirm === "unpublish"
              ? "Les citoyens ne verront plus ce service ni ses démarches. Vous pourrez le republier à tout moment."
              : procedures.length > 0
                ? `Ce service contient encore ${procedures.length} démarche${procedures.length > 1 ? "s" : ""} : supprimez-les d’abord.`
                : service.active
                  ? "Ce service est publié : les citoyens ne le verront plus. Cette action est définitive."
                  : "Ce brouillon sera définitivement supprimé."
        }
        confirmLabel={confirm === "publish" ? "Publier" : confirm === "unpublish" ? "Dépublier" : "Supprimer"}
      />
    </div>
  );
}
