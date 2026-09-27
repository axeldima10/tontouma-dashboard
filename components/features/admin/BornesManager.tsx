"use client";

import { MapPin, MonitorSmartphone, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { BorneStatusSelect } from "@/components/features/bornes/BorneStatusSelect";
import { BorneTestDialog } from "@/components/features/bornes/BorneTestDialog";
import { EmptyState } from "@/components/states/States";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { AffixInput, Input } from "@/components/ui/Input";
import { ActionMenu } from "@/components/ui/Menu";
import { Select } from "@/components/ui/Select";
import { BORNE_STATUS_LABEL, BornePill } from "@/components/ui/StatusPill";
import { MobileCard, MobileList, SearchField, Table, Td, Th, Toolbar } from "@/components/ui/Table";
import { Segmented } from "@/components/ui/Tabs";
import { deleteBorne, saveBorne, setAnyBorneStatus } from "@/lib/actions/platform";
import { BORNE_STATUSES, type Borne, type BorneStatus, type Organization } from "@/lib/api/contract";
import { formatDate } from "@/lib/format";
import { useAction } from "@/lib/hooks/useAction";

type BornesManagerProps = {
  bornes: Borne[];
  organizations: Pick<Organization, "id" | "name">[];
  /** Onglet d'une organisation : la borne y est rattachée d'office. */
  organizationId?: string;
};

type Filter = "all" | BorneStatus;

export function BornesManager({ bornes, organizations, organizationId }: BornesManagerProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<{ key: number; borne: Borne | null } | null>(null);
  const [deleting, setDeleting] = useState<Borne | null>(null);
  const [testing, setTesting] = useState<Borne | null>(null);
  const { run, pending } = useAction();

  const orgName = new Map(organizations.map((o) => [o.id, o.name]));
  const visible = bornes.filter(
    (b) =>
      (filter === "all" || b.status === filter) &&
      (!query || `${b.identifier} ${b.location ?? ""} ${orgName.get(b.organizationId ?? "") ?? ""}`.toLowerCase().includes(query.toLowerCase())),
  );
  const count = (status: BorneStatus) => bornes.filter((b) => b.status === status).length;
  const showOrg = !organizationId;

  const menu = (borne: Borne) => [
    { label: "Tester la borne", icon: <Play />, onSelect: () => setTesting(borne) },
    { label: "Modifier", icon: <Pencil />, onSelect: () => setEditing({ key: Date.now(), borne }) },
    "separator" as const,
    { label: "Supprimer", icon: <Trash2 />, tone: "danger" as const, onSelect: () => setDeleting(borne) },
  ];

  return (
    <>
      <Toolbar>
        <Segmented
          aria-label="Filtrer par statut"
          value={filter}
          onValueChange={setFilter}
          options={[
            { value: "all", label: "Toutes", count: bornes.length },
            { value: "ACTIVE", label: "En service", count: count("ACTIVE") },
            { value: "MAINTENANCE", label: "Maintenance", count: count("MAINTENANCE") },
            { value: "HORS_SERVICE", label: "Hors service", count: count("HORS_SERVICE") },
          ]}
        />
        <SearchField value={query} onChange={setQuery} placeholder="Identifiant, lieu…" className="w-full sm:ml-auto sm:w-64" />
        <Button icon={<Plus />} onClick={() => setEditing({ key: Date.now(), borne: null })} disabled={organizations.length === 0}>
          Nouvelle borne
        </Button>
      </Toolbar>

      {bornes.length === 0 ? (
        <EmptyState
          icon={<MonitorSmartphone />}
          title="Aucune borne"
          description="Enregistrez une borne installée : son identifiant, son emplacement et son statut."
          action={
            <Button icon={<Plus />} onClick={() => setEditing({ key: Date.now(), borne: null })} disabled={organizations.length === 0}>
              Nouvelle borne
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState icon={<MonitorSmartphone />} title="Aucune borne ne correspond" description="Modifiez la recherche ou le filtre." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Borne</Th>
                {showOrg && <Th>Organisation</Th>}
                <Th>Emplacement</Th>
                <Th>Installée le</Th>
                <Th>Statut</Th>
                <Th className="w-12">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((borne, index) => (
                <motion.tr
                  key={borne.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 12) * 0.03 }}
                  className="transition-colors last:[&>td]:border-b-0 hover:bg-accent/60"
                >
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-xl bg-accent">
                        <MonitorSmartphone className="size-4 text-muted-foreground" aria-hidden />
                      </span>
                      <span className="tabular font-semibold">{borne.identifier}</span>
                    </div>
                  </Td>
                  {showOrg && (
                    <Td>
                      {borne.organizationId ? (
                        <Link href={`/admin/organisations/${borne.organizationId}`} className="text-muted-foreground hover:text-foreground hover:underline">
                          {orgName.get(borne.organizationId) ?? "—"}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </Td>
                  )}
                  <Td className="max-w-64 truncate text-muted-foreground">{borne.location ?? "—"}</Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{formatDate(borne.createdAt, { day: "numeric", month: "short", year: "numeric" })}</Td>
                  <Td>
                    <BorneStatusSelect borne={borne} onChangeStatus={setAnyBorneStatus} />
                  </Td>
                  <Td>
                    <ActionMenu label={`Actions pour ${borne.identifier}`} items={menu(borne)} />
                  </Td>
                </motion.tr>
              ))}
            </tbody>
          </Table>
          <MobileList>
            {visible.map((borne) => (
              <MobileCard key={borne.id}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="tabular font-semibold text-foreground">{borne.identifier}</p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="size-3" aria-hidden /> {borne.location ?? "—"}
                      {showOrg && ` · ${orgName.get(borne.organizationId ?? "") ?? ""}`}
                    </p>
                  </div>
                  <ActionMenu label={`Actions pour ${borne.identifier}`} items={menu(borne)} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <BornePill status={borne.status} />
                  <BorneStatusSelect borne={borne} onChangeStatus={setAnyBorneStatus} />
                </div>
              </MobileCard>
            ))}
          </MobileList>
        </>
      )}

      {editing && (
        <BorneDialog key={editing.key} borne={editing.borne} organizations={organizations} organizationId={organizationId} onClose={() => setEditing(null)} />
      )}

      {testing && <BorneTestDialog key={testing.id} borne={testing} onClose={() => setTesting(null)} />}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        loading={pending}
        tone="danger"
        title={`Supprimer ${deleting?.identifier ?? "la borne"} ?`}
        description="La borne disparaîtra du parc de l’organisation. Si elle est encore allumée, elle ne pourra plus servir les citoyens."
        confirmLabel="Supprimer"
        onConfirm={async () => {
          if (!deleting) return;
          const result = await run(() => deleteBorne(deleting.id), { success: "Borne supprimée" });
          if (result.ok) setDeleting(null);
        }}
      />
    </>
  );
}

type BorneDialogProps = {
  borne: Borne | null;
  organizations: Pick<Organization, "id" | "name">[];
  organizationId?: string;
  onClose: () => void;
};

function BorneDialog({ borne, organizations, organizationId, onClose }: BorneDialogProps) {
  const [orgId, setOrgId] = useState(borne?.organizationId ?? organizationId ?? organizations[0]?.id ?? "");
  const [identifier, setIdentifier] = useState(borne?.identifier ?? "");
  const [location, setLocation] = useState(borne?.location ?? "");
  const [status, setStatus] = useState<BorneStatus>(borne?.status ?? "ACTIVE");
  const [submitted, setSubmitted] = useState(false);
  const { run, pending } = useAction();

  const submit = async () => {
    setSubmitted(true);
    if (!identifier.trim() || !orgId) return;
    const result = await run(
      () =>
        saveBorne(borne?.id ?? null, {
          organizationId: orgId,
          // Les départements d'une autre organisation ne sont pas listables ici : on conserve la valeur existante.
          departmentId: borne?.departmentId ?? null,
          identifier: identifier.trim(),
          location: location.trim() || null,
          status,
        }),
      { success: borne ? "Borne mise à jour" : "Borne enregistrée" },
    );
    if (result.ok) onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      dismissible={false}
      icon={<MonitorSmartphone />}
      title={borne ? `Modifier ${borne.identifier}` : "Nouvelle borne"}
      description="La limite de bornes du plan de l’organisation s’applique."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button loading={pending} onClick={submit}>
            {borne ? "Enregistrer" : "Enregistrer la borne"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {!organizationId && (
          <Field label="Organisation" required error={submitted && !orgId ? "Choisissez une organisation." : null}>
            {(p) => <Select {...p} value={orgId} onValueChange={setOrgId} placeholder="Choisir" options={organizations.map((o) => ({ value: o.id, label: o.name }))} />}
          </Field>
        )}
        <Field label="Identifiant" required error={submitted && !identifier.trim() ? "L’identifiant est obligatoire." : null} hint="Tel qu’affiché sur la borne, ex. BORNE-DKP-003.">
          {(p) => <Input {...p} className="tabular uppercase" value={identifier} onChange={(e) => setIdentifier(e.target.value.toUpperCase())} maxLength={100} placeholder="BORNE-DKP-003" />}
        </Field>
        <Field label="Emplacement">
          {(p) => <AffixInput {...p} prefix={<MapPin />} value={location} onChange={(e) => setLocation(e.target.value)} maxLength={500} placeholder="Hall d’accueil" />}
        </Field>
        <Field label="Statut">
          {(p) => (
            <Select {...p} value={status} onValueChange={(v) => setStatus(v as BorneStatus)} options={BORNE_STATUSES.map((s) => ({ value: s, label: BORNE_STATUS_LABEL[s] }))} />
          )}
        </Field>
      </div>
    </Dialog>
  );
}
