"use client";

import { ArrowRight, FolderPlus, Layers, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SortableList } from "@/components/forms/SortableList";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/states";
import { useReadOnly } from "@/components/states/ReadOnly";
import { IconButton, PublicationBadge } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteDepartement, reorderDepartements, reorderServices } from "@/lib/actions/content";
import type { Departement, Procedure, ServiceOffering } from "@/lib/data/types";
import { useAction } from "@/lib/hooks/useAction";
import { Reveal } from "@/lib/motion/Reveal";
import { DepartementDialog, NewServiceDialog } from "./ServiceDialog";

type ServicesBoardProps = {
  basePath: string;
  departements: Departement[];
  services: ServiceOffering[];
  procedures: Pick<Procedure, "id" | "serviceId" | "active">[];
};

type Group = { departement: Departement | null; services: ServiceOffering[] };

export function ServicesBoard({ basePath, departements: initialDeps, services: initialServices, procedures }: ServicesBoardProps) {
  const router = useRouter();
  const { readOnly } = useReadOnly();
  const { run } = useAction();
  // Ordre local optimiste pour l'animation ; l'API reste la source (rafraîchie après chaque action).
  const [departements, setDepartements] = useState(initialDeps);
  const [services, setServices] = useState(initialServices);
  const [syncedFrom, setSyncedFrom] = useState({ initialDeps, initialServices });
  if (syncedFrom.initialDeps !== initialDeps || syncedFrom.initialServices !== initialServices) {
    setSyncedFrom({ initialDeps, initialServices });
    setDepartements(initialDeps);
    setServices(initialServices);
  }

  const [depDialog, setDepDialog] = useState<{ open: boolean; departement: Departement | null }>({ open: false, departement: null });
  const [serviceDialog, setServiceDialog] = useState<{ open: boolean; departementId: string | null }>({ open: false, departementId: null });
  const [toDelete, setToDelete] = useState<Departement | null>(null);
  const { run: runDelete, pending: deleting } = useAction();

  const counts = new Map<string, { total: number; published: number }>();
  procedures.forEach((p) => {
    const c = counts.get(p.serviceId) ?? { total: 0, published: 0 };
    c.total += 1;
    if (p.active) c.published += 1;
    counts.set(p.serviceId, c);
  });

  const groups: Group[] = [
    ...departements.map((d) => ({ departement: d, services: services.filter((s) => s.departement_id === d.id) })),
    { departement: null, services: services.filter((s) => !s.departement_id) },
  ].filter((g) => g.departement || g.services.length > 0);

  const reorderGroup = (group: Group, next: ServiceOffering[]) => {
    const others = services.filter((s) => (s.departement_id ?? null) !== (group.departement?.id ?? null));
    setServices([...others, ...next.map((s, i) => ({ ...s, ordre: i }))]);
    void run(() => reorderServices(next.map((s) => s.id)));
  };

  const empty = services.length === 0 && departements.length === 0;

  return (
    <>
      <PageHeader
        title="Services & démarches"
        description="Ce que l’assistant peut expliquer aux citoyens. Seul le contenu publié leur est visible."
        actions={
          !readOnly && (
            <>
              <Button variant="secondary" icon={<FolderPlus className="size-4" />} onClick={() => setDepDialog({ open: true, departement: null })}>
                Nouveau département
              </Button>
              <Button magnetic icon={<Plus className="size-4" />} onClick={() => setServiceDialog({ open: true, departementId: null })}>
                Nouveau service
              </Button>
            </>
          )
        }
      />

      {empty ? (
        <EmptyState
          size="page"
          icon={<Layers />}
          title="Aucun service pour l’instant"
          description="Commencez par créer un service (un guichet ou un bureau), puis ajoutez-lui ses démarches : coût, délai, conditions et pièces requises."
          action={
            !readOnly && (
              <Button icon={<Plus className="size-4" />} onClick={() => setServiceDialog({ open: true, departementId: null })}>
                Créer mon premier service
              </Button>
            )
          }
        />
      ) : (
        <Reveal className="space-y-5">
          {departements.length > 1 && !readOnly && (
            <details className="surface group px-5 py-3 text-sm">
              <summary className="cursor-pointer font-medium text-muted marker:text-subtle hover:text-text">
                Réordonner les départements
              </summary>
              <div className="mt-3">
                <SortableList
                  items={departements}
                  getId={(d) => d.id}
                  getLabel={(d) => d.nom}
                  onReorder={(next) => {
                    setDepartements(next);
                    void run(() => reorderDepartements(next.map((d) => d.id)));
                  }}
                  renderItem={(d) => <p className="rounded-xl border border-line px-3 py-2.5 font-medium text-text">{d.nom}</p>}
                />
              </div>
            </details>
          )}

          {groups.map((group) => (
            <section key={group.departement?.id ?? "none"} className="surface p-4 sm:p-5">
              <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-[17px] font-semibold text-text">
                    {group.departement?.nom ?? "Sans département"}
                  </h2>
                  <p className="mt-0.5 text-[13px] text-muted">
                    {group.departement?.description ?? "Services rattachés directement à l’organisation."}
                  </p>
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Plus className="size-3.5" />}
                      onClick={() => setServiceDialog({ open: true, departementId: group.departement?.id ?? null })}
                    >
                      Service
                    </Button>
                    {group.departement && (
                      <>
                        <IconButton label={`Modifier ${group.departement.nom}`} onClick={() => setDepDialog({ open: true, departement: group.departement })}>
                          <Pencil />
                        </IconButton>
                        <IconButton label={`Supprimer ${group.departement.nom}`} tone="danger" onClick={() => setToDelete(group.departement)}>
                          <Trash2 />
                        </IconButton>
                      </>
                    )}
                  </div>
                )}
              </header>

              {group.services.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-sm text-muted">
                  Aucun service dans ce département.
                </p>
              ) : (
                <SortableList
                  items={group.services}
                  getId={(s) => s.id}
                  getLabel={(s) => s.nom}
                  disabled={readOnly}
                  onReorder={(next) => reorderGroup(group, next)}
                  renderItem={(service) => {
                    const c = counts.get(service.id) ?? { total: 0, published: 0 };
                    return (
                      <Link
                        href={`${basePath}/services/${service.id}`}
                        className="group flex min-w-0 items-center gap-4 rounded-2xl border border-line px-4 py-3 transition-colors hover:border-green/40 hover:bg-surface-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-text">{service.nom}</p>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
                            {service.localisation && (
                              <>
                                <MapPin className="size-3 shrink-0" aria-hidden />
                                <span className="truncate">{service.localisation}</span>
                                <span aria-hidden>·</span>
                              </>
                            )}
                            <span className="tabular shrink-0">
                              {c.published}/{c.total} démarche{c.total > 1 ? "s" : ""} publiée{c.published > 1 ? "s" : ""}
                            </span>
                          </p>
                        </div>
                        <PublicationBadge published={service.statut_publication === "publie"} />
                        <ArrowRight
                          className="hidden size-4 shrink-0 text-subtle transition-transform duration-300 group-hover:translate-x-1 group-hover:text-green-ink sm:block"
                          aria-hidden
                        />
                      </Link>
                    );
                  }}
                />
              )}
            </section>
          ))}
        </Reveal>
      )}

      {depDialog.open && (
        <DepartementDialog open onClose={() => setDepDialog({ open: false, departement: null })} departement={depDialog.departement} />
      )}
      {serviceDialog.open && (
        <NewServiceDialog
          open
          onClose={() => setServiceDialog({ open: false, departementId: null })}
          departements={departements}
          defaultDepartementId={serviceDialog.departementId}
          onCreated={(service) => router.push(`${basePath}/services/${service.id}`)}
        />
      )}
      <ConfirmDialog
        open={toDelete !== null}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          const result = await runDelete(() => deleteDepartement(toDelete.id), { success: "Département supprimé" });
          if (result.ok) setToDelete(null);
        }}
        loading={deleting}
        tone="danger"
        title={`Supprimer « ${toDelete?.nom ?? ""} » ?`}
        description="Le département doit être vide. Ses services ne sont pas supprimés automatiquement."
        confirmLabel="Supprimer"
      />
    </>
  );
}
