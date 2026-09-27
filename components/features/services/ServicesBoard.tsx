"use client";

import { ArrowUpRight, Clock, Eye, EyeOff, FileText, FolderPlus, Layers, MapPin, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { useReadOnly } from "@/components/states/ReadOnly";
import { EmptyState } from "@/components/states/States";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ActionMenu } from "@/components/ui/Menu";
import { ActivePill, PublicationPill } from "@/components/ui/StatusPill";
import { SearchField, Toolbar } from "@/components/ui/Table";
import { Segmented } from "@/components/ui/Tabs";
import { deleteDepartment, deleteService, setDepartmentActive, setServiceActive } from "@/lib/actions/content";
import type { Department, Service } from "@/lib/api/contract";
import { cn } from "@/lib/cn";
import { summarizeOpeningHours } from "@/lib/format";
import { useAction } from "@/lib/hooks/useAction";
import { DepartmentDialog, ServiceDialog } from "./Dialogs";

type ProcedureStat = { serviceId: string; active: boolean };

type ServicesBoardProps = {
  basePath: string;
  departments: Department[];
  services: Service[];
  procedures: ProcedureStat[];
};

type Filter = "all" | "published" | "draft";

type Confirm =
  | { kind: "publish" | "unpublish" | "delete"; service: Service }
  | { kind: "department-delete" | "department-toggle"; department: Department }
  | null;

export function ServicesBoard({ basePath, departments, services, procedures }: ServicesBoardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { readOnly } = useReadOnly();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [serviceDialog, setServiceDialog] = useState<{ key: number; departmentId?: string } | null>(() =>
    searchParams.get("nouveau") === "service" && departments.length > 0 ? { key: Date.now() } : null,
  );
  const [departmentDialog, setDepartmentDialog] = useState<{ key: number; department: Department | null } | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const { run, pending } = useAction();

  const stats = useMemo(() => {
    const map = new Map<string, { total: number; published: number }>();
    for (const p of procedures) {
      const entry = map.get(p.serviceId) ?? { total: 0, published: 0 };
      entry.total += 1;
      if (p.active) entry.published += 1;
      map.set(p.serviceId, entry);
    }
    return map;
  }, [procedures]);

  const visible = services.filter(
    (s) =>
      (filter === "all" || (filter === "published" ? s.active : !s.active)) &&
      (!query || `${s.name} ${s.description ?? ""} ${s.location ?? ""}`.toLowerCase().includes(query.toLowerCase())),
  );
  const filtering = filter !== "all" || query !== "";
  const groups = departments
    .map((department) => ({ department, services: visible.filter((s) => s.departmentId === department.id) }))
    .filter((g) => !filtering || g.services.length > 0);
  const orphans = visible.filter((s) => !departments.some((d) => d.id === s.departmentId));

  const onConfirm = async () => {
    if (!confirm) return;
    let ok = false;
    if ("service" in confirm) {
      const { service } = confirm;
      if (confirm.kind === "delete") {
        ok = (await run(() => deleteService(service.id), { success: "Service supprimé" })).ok;
      } else {
        const active = confirm.kind === "publish";
        ok = (
          await run(() => setServiceActive(service.id, active), {
            success: active ? "Service publié" : "Service dépublié",
            successDescription: active ? "L’assistant utilisera ce contenu d’ici quelques minutes." : "Les citoyens ne le verront plus d’ici quelques minutes.",
          })
        ).ok;
      }
    } else {
      const { department } = confirm;
      if (confirm.kind === "department-delete") {
        ok = (await run(() => deleteDepartment(department.id), { success: "Département supprimé" })).ok;
      } else {
        const active = !department.active;
        ok = (await run(() => setDepartmentActive(department.id, active), { success: active ? "Département activé" : "Département désactivé" })).ok;
      }
    }
    if (ok) setConfirm(null);
  };

  const published = services.filter((s) => s.active).length;

  return (
    <>
      <PageHeader
        kicker="Contenu"
        title="Services & démarches"
        description="Chaque service publié, avec ses démarches, devient une réponse de l’assistant."
        actions={
          !readOnly && (
            <>
              <Button variant="secondary" icon={<FolderPlus />} onClick={() => setDepartmentDialog({ key: Date.now(), department: null })}>
                Département
              </Button>
              <Button icon={<Plus />} onClick={() => setServiceDialog({ key: Date.now() })} disabled={departments.length === 0} title={departments.length === 0 ? "Créez d’abord un département" : undefined}>
                Nouveau service
              </Button>
            </>
          )
        }
      />

      {departments.length === 0 ? (
        <EmptyState
          size="page"
          icon={<FolderPlus />}
          title="Commencez par un département"
          description="Les services sont rangés par département (État civil, Urbanisme…). Créez-en un, puis ajoutez-y vos services et leurs démarches."
          action={
            !readOnly && (
              <Button icon={<FolderPlus />} onClick={() => setDepartmentDialog({ key: Date.now(), department: null })}>
                Créer un département
              </Button>
            )
          }
        />
      ) : (
        <>
          <Toolbar>
            <Segmented
              aria-label="Filtrer par statut"
              value={filter}
              onValueChange={setFilter}
              options={[
                { value: "all", label: "Tous", count: services.length },
                { value: "published", label: "Publiés", count: published },
                { value: "draft", label: "Brouillons", count: services.length - published },
              ]}
            />
            <SearchField value={query} onChange={setQuery} placeholder="Rechercher un service…" className="w-full sm:ml-auto sm:w-72" />
          </Toolbar>

          {groups.length === 0 && orphans.length === 0 ? (
            <EmptyState icon={<Layers />} title="Aucun service ne correspond" description="Modifiez la recherche ou le filtre." />
          ) : (
            <div className="space-y-8">
              {groups.map(({ department, services: list }, groupIndex) => (
                <motion.section
                  key={department.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  aria-labelledby={`dep-${department.id}`}
                >
                  <header className="mb-3 flex items-center gap-3">
                    <h2 id={`dep-${department.id}`} className="text-lg font-semibold tracking-tight text-foreground">
                      {department.name}
                    </h2>
                    <span className="tabular rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-muted-foreground">{list.length}</span>
                    {!department.active && <ActivePill active={false} />}
                    <div className="h-px flex-1 bg-border" />
                    {!readOnly && (
                      <>
                        <Button variant="ghost" size="sm" icon={<Plus />} onClick={() => setServiceDialog({ key: Date.now(), departmentId: department.id })}>
                          <span className="max-sm:hidden">Service</span>
                        </Button>
                        <ActionMenu
                          label={`Actions du département ${department.name}`}
                          items={[
                            { label: "Renommer", icon: <Pencil />, onSelect: () => setDepartmentDialog({ key: Date.now(), department }) },
                            { label: department.active ? "Désactiver" : "Activer", icon: <Power />, onSelect: () => setConfirm({ kind: "department-toggle", department }) },
                            "separator",
                            { label: "Supprimer", icon: <Trash2 />, tone: "danger", onSelect: () => setConfirm({ kind: "department-delete", department }) },
                          ]}
                        />
                      </>
                    )}
                  </header>
                  {department.description && <p className="-mt-1 mb-4 text-sm text-muted-foreground">{department.description}</p>}

                  {list.length === 0 ? (
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => setServiceDialog({ key: Date.now(), departmentId: department.id })}
                      className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-dashed border-border-strong py-8 text-sm text-muted-foreground transition enabled:hover:border-brand enabled:hover:bg-brand-soft enabled:hover:text-brand-ink"
                    >
                      <Plus className="size-4" aria-hidden /> Ajouter le premier service de ce département
                    </button>
                  ) : (
                    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <AnimatePresence initial={false}>
                        {list.map((service) => (
                          <ServiceCard
                            key={service.id}
                            service={service}
                            href={`${basePath}/services/${service.id}`}
                            stat={stats.get(service.id) ?? { total: 0, published: 0 }}
                            readOnly={readOnly}
                            onAction={(kind) => setConfirm({ kind, service })}
                          />
                        ))}
                      </AnimatePresence>
                    </ul>
                  )}
                </motion.section>
              ))}
              {orphans.length > 0 && (
                <section>
                  <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">Sans département</h2>
                  <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {orphans.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        href={`${basePath}/services/${service.id}`}
                        stat={stats.get(service.id) ?? { total: 0, published: 0 }}
                        readOnly={readOnly}
                        onAction={(kind) => setConfirm({ kind, service })}
                      />
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </>
      )}

      {serviceDialog && (
        <ServiceDialog
          key={serviceDialog.key}
          open
          onOpenChange={(open) => {
            if (open) return;
            setServiceDialog(null);
            if (searchParams.get("nouveau")) router.replace(`${basePath}/services`);
          }}
          departments={departments}
          defaultDepartmentId={serviceDialog.departmentId}
          basePath={basePath}
        />
      )}
      {departmentDialog && (
        <DepartmentDialog key={departmentDialog.key} open onOpenChange={(open) => !open && setDepartmentDialog(null)} department={departmentDialog.department} />
      )}

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        loading={pending}
        onConfirm={onConfirm}
        {...confirmCopy(confirm, stats)}
      />
    </>
  );
}

function confirmCopy(confirm: Confirm, stats: Map<string, { total: number; published: number }>) {
  if (!confirm) return { title: "", description: "", confirmLabel: "" };
  switch (confirm.kind) {
    case "publish":
      return {
        tone: "publish" as const,
        title: `Publier « ${confirm.service.name} » ?`,
        description: "Les citoyens et l’assistant verront ce service, son lieu, son téléphone et ses horaires tels qu’enregistrés. Seules ses démarches publiées seront expliquées.",
        confirmLabel: "Publier",
      };
    case "unpublish":
      return {
        tone: "neutral" as const,
        title: `Dépublier « ${confirm.service.name} » ?`,
        description: "Les citoyens ne verront plus ce service ni ses démarches. Vous pourrez le republier à tout moment.",
        confirmLabel: "Dépublier",
      };
    case "delete": {
      const count = stats.get(confirm.service.id)?.total ?? 0;
      return {
        tone: "danger" as const,
        title: `Supprimer « ${confirm.service.name} » ?`,
        description:
          count > 0
            ? `Ce service contient encore ${count} démarche${count > 1 ? "s" : ""}. Supprimez-les d’abord : le service refusera la suppression.`
            : confirm.service.active
              ? "Ce service est publié : les citoyens ne le verront plus. Cette action est définitive."
              : "Ce brouillon sera définitivement supprimé.",
        confirmLabel: "Supprimer",
      };
    }
    case "department-delete":
      return {
        tone: "danger" as const,
        title: `Supprimer « ${confirm.department.name} » ?`,
        description: "Seul un département vide peut être supprimé. Cette action est définitive.",
        confirmLabel: "Supprimer",
      };
    case "department-toggle":
      return {
        tone: "neutral" as const,
        title: confirm.department.active ? `Désactiver « ${confirm.department.name} » ?` : `Activer « ${confirm.department.name} » ?`,
        description: confirm.department.active
          ? "Le département sera marqué inactif. Vous pourrez le réactiver à tout moment."
          : "Le département sera de nouveau actif.",
        confirmLabel: confirm.department.active ? "Désactiver" : "Activer",
      };
  }
}

type ServiceCardProps = {
  service: Service;
  href: string;
  stat: { total: number; published: number };
  readOnly: boolean;
  onAction: (kind: "publish" | "unpublish" | "delete") => void;
};

function ServiceCard({ service, href, stat, readOnly, onAction }: ServiceCardProps) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="group surface relative flex flex-col p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn("grid size-11 place-items-center rounded-2xl", service.active ? "bg-brand-soft text-brand-ink" : "bg-accent text-muted-foreground")}>
          <Layers className="size-5" aria-hidden />
        </span>
        <div className="relative z-10 flex items-center gap-1">
          <PublicationPill active={service.active} />
          {!readOnly && (
            <ActionMenu
              label={`Actions pour ${service.name}`}
              items={[
                service.active
                  ? { label: "Dépublier", icon: <EyeOff />, onSelect: () => onAction("unpublish") }
                  : { label: "Publier", icon: <Eye />, onSelect: () => onAction("publish") },
                "separator",
                { label: "Supprimer", icon: <Trash2 />, tone: "danger", onSelect: () => onAction("delete") },
              ]}
            />
          )}
        </div>
      </div>
      <Link href={href} className="mt-4 block after:absolute after:inset-0 after:rounded-[22px] after:content-['']">
        <h3 className="flex items-center gap-1.5 text-[15px] font-semibold tracking-tight text-foreground">
          {service.name}
          <ArrowUpRight className="size-4 text-subtle opacity-0 transition group-hover:opacity-100" aria-hidden />
        </h3>
      </Link>
      {service.description && <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{service.description}</p>}
      <dl className="mt-4 space-y-1.5 text-xs text-muted-foreground">
        {service.location && (
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <dt className="sr-only">Lieu</dt>
            <dd className="truncate">{service.location}</dd>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Horaires</dt>
          <dd className="truncate">{summarizeOpeningHours(service.openingHours)}</dd>
        </div>
      </dl>
      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <FileText className="size-3.5" aria-hidden />
            <b className="tabular font-semibold text-foreground">{stat.total}</b> démarche{stat.total > 1 ? "s" : ""}
          </span>
          <span className="tabular text-muted-foreground">
            <b className="font-semibold text-brand-ink">{stat.published}</b> publiée{stat.published > 1 ? "s" : ""}
          </span>
        </div>
        {stat.total > 0 && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/[0.07]">
            <motion.div
              className="h-full rounded-full bg-brand"
              initial={{ width: 0 }}
              animate={{ width: `${(stat.published / stat.total) * 100}%` }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            />
          </div>
        )}
      </div>
    </motion.li>
  );
}
