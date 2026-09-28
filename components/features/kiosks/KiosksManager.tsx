"use client";

import { KeyRound, MapPin, MonitorSmartphone, Pencil, Plus, QrCode, Trash2 } from "lucide-react";
import { useState } from "react";
import { Field, Select, TextInput } from "@/components/forms/Fields";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/states";
import { useReadOnly } from "@/components/states/ReadOnly";
import { CopyButton, IconButton, UsageMeter } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { StatusPill, type Tone } from "@/components/ui/StatusPill";
import { createBorne, createQRCode, deleteBorne, deleteQRCode, setQRCodeActive, updateBorne } from "@/lib/actions/management";
import type { Borne, BorneStatus, Procedure, QRCode, QRCodeType, ServiceOffering } from "@/lib/data/types";
import { useAction } from "@/lib/hooks/useAction";
import { Reveal } from "@/lib/motion/Reveal";
import { QRCodeCard } from "./QRCodeCard";

const STATUS: Record<BorneStatus, { tone: Tone; label: string }> = {
  active: { tone: "success", label: "Active" },
  inactive: { tone: "neutral", label: "Inactive" },
  maintenance: { tone: "warning", label: "Maintenance" },
};

/** Le code complet n'est montré qu'une fois, à la création. */
const maskCode = (code: string) => `${code.slice(0, 3)}•••${code.slice(-2)}`;

type KiosksManagerProps = {
  bornes: Borne[];
  limit: number;
  qrcodes: QRCode[];
  services: Pick<ServiceOffering, "id" | "nom">[];
  procedures: Pick<Procedure, "id" | "title">[];
};

function BorneDialog({ borne, onClose, onCreated }: { borne: Borne | null; onClose: () => void; onCreated: (b: Borne) => void }) {
  const { run, pending } = useAction();
  const [nom, setNom] = useState(borne?.nom ?? "");
  const [localisation, setLocalisation] = useState(borne?.localisation ?? "");
  const [statut, setStatut] = useState<BorneStatus>(borne?.statut ?? "active");

  const submit = async () => {
    const input = { nom, localisation: localisation || null };
    const result = borne
      ? await run(() => updateBorne(borne.id, { ...input, statut }), { success: "Borne mise à jour" })
      : await run(() => createBorne(input));
    if (result.ok) {
      if (!borne) onCreated(result.data);
      else onClose();
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={borne ? "Modifier la borne" : "Nouvelle borne"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button onClick={submit} loading={pending} disabled={!nom.trim()}>
            {borne ? "Enregistrer" : "Créer la borne"}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Field label="Nom" required>
          {(p) => <TextInput {...p} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Borne du hall" autoFocus />}
        </Field>
        <Field label="Emplacement">
          {(p) => <TextInput {...p} value={localisation} onChange={(e) => setLocalisation(e.target.value)} placeholder="Hall d’entrée" />}
        </Field>
        {borne && (
          <Field label="Statut">
            {(p) => (
              <Select {...p} value={statut} onChange={(e) => setStatut(e.target.value as BorneStatus)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </Select>
            )}
          </Field>
        )}
      </form>
    </Dialog>
  );
}

function QRDialog({ onClose, services, procedures }: { onClose: () => void } & Pick<KiosksManagerProps, "services" | "procedures">) {
  const { run, pending } = useAction();
  const [type, setType] = useState<QRCodeType>("organisation");
  const [cible, setCible] = useState("");
  const options = type === "service" ? services.map((s) => ({ id: s.id, label: s.nom })) : procedures.map((p) => ({ id: p.id, label: p.title }));

  return (
    <Dialog
      open
      onClose={onClose}
      title="Nouveau QR code"
      description="À imprimer et afficher : les citoyens le scannent pour ouvrir l’assistant directement sur le bon sujet."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button
            loading={pending}
            disabled={type !== "organisation" && !cible}
            onClick={async () => {
              const result = await run(() => createQRCode({ type, cible_id: type === "organisation" ? null : cible }), {
                success: "QR code créé",
              });
              if (result.ok) onClose();
            }}
          >
            Générer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Le QR code ouvre…">
          {(p) => (
            <Select
              {...p}
              value={type}
              onChange={(e) => {
                setType(e.target.value as QRCodeType);
                setCible("");
              }}
            >
              <option value="organisation">L’accueil de l’organisation</option>
              <option value="service">Un service</option>
              <option value="demarche">Une démarche</option>
            </Select>
          )}
        </Field>
        {type !== "organisation" && (
          <Field label={type === "service" ? "Service" : "Démarche"} required>
            {(p) => (
              <Select {...p} value={cible} onChange={(e) => setCible(e.target.value)}>
                <option value="">Choisir…</option>
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
      </div>
    </Dialog>
  );
}

export function KiosksManager({ bornes, limit, qrcodes, services, procedures }: KiosksManagerProps) {
  const { readOnly } = useReadOnly();
  const [dialog, setDialog] = useState<{ borne: Borne | null } | null>(null);
  const [revealed, setRevealed] = useState<Borne | null>(null);
  const [toDelete, setToDelete] = useState<Borne | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrToDelete, setQrToDelete] = useState<QRCode | null>(null);
  const del = useAction();
  const qr = useAction();
  const atLimit = bornes.length >= limit;

  const targetLabel = (q: QRCode) =>
    q.type === "organisation"
      ? "Accueil de l’organisation"
      : q.type === "service"
        ? `Service : ${services.find((s) => s.id === q.cible_id)?.nom ?? "—"}`
        : `Démarche : ${procedures.find((p) => p.id === q.cible_id)?.title ?? "—"}`;

  return (
    <>
      <PageHeader
        title="Bornes & QR codes"
        description="Les bornes physiques de vos locaux et les QR codes à imprimer pour ouvrir l’assistant."
        actions={
          !readOnly && (
            <Button
              magnetic
              icon={<Plus className="size-4" />}
              onClick={() => setDialog({ borne: null })}
              disabled={atLimit}
              title={atLimit ? "Limite de bornes du plan atteinte" : undefined}
            >
              Nouvelle borne
            </Button>
          )
        }
      />

      <Reveal className="space-y-5">
        <Card>
          <div className="grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <UsageMeter label="Bornes utilisées" used={bornes.length} limit={limit} />
            <p className="text-[13px] text-muted">
              {atLimit
                ? "Limite du plan atteinte : pour ajouter une borne, passez à un plan supérieur ou supprimez une borne existante."
                : `Vous pouvez encore ajouter ${limit - bornes.length} borne(s) avec votre plan actuel.`}
            </p>
          </div>
        </Card>

        {bornes.length === 0 ? (
          <EmptyState
            size="page"
            icon={<MonitorSmartphone />}
            title="Aucune borne"
            description="Créez une borne : un code unique vous sera donné pour l’activer sur l’appareil installé dans vos locaux."
            action={!readOnly && <Button icon={<Plus className="size-4" />} onClick={() => setDialog({ borne: null })}>Créer une borne</Button>}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {bornes.map((borne) => (
              <article key={borne.id} className="surface flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-violet-soft text-violet">
                    <MonitorSmartphone className="size-5" aria-hidden />
                  </span>
                  <StatusPill tone={STATUS[borne.statut].tone} pulse={borne.statut === "active"}>
                    {STATUS[borne.statut].label}
                  </StatusPill>
                </div>
                <p className="font-display mt-4 text-base font-semibold text-text">{borne.nom}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                  <MapPin className="size-3" aria-hidden />
                  {borne.localisation ?? "Emplacement non renseigné"}
                </p>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                    <KeyRound className="size-3.5" aria-hidden />
                    <span className="tabular font-mono">{maskCode(borne.codeUnique)}</span>
                    {borne.versionLogicielle && <span>· v{borne.versionLogicielle}</span>}
                  </span>
                  {!readOnly && (
                    <div className="flex">
                      <IconButton label={`Modifier ${borne.nom}`} onClick={() => setDialog({ borne })}>
                        <Pencil />
                      </IconButton>
                      <IconButton label={`Supprimer ${borne.nom}`} tone="danger" onClick={() => setToDelete(borne)}>
                        <Trash2 />
                      </IconButton>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <Card>
          <CardHeader
            title="QR codes"
            icon={<QrCode />}
            description="Téléchargez-les en PNG ou SVG pour l’impression (affiches, guichets, courriers)."
            action={
              !readOnly && (
                <Button variant="secondary" size="sm" icon={<Plus className="size-3.5" />} onClick={() => setQrOpen(true)}>
                  Nouveau QR code
                </Button>
              )
            }
          />
          {qrcodes.length === 0 ? (
            <EmptyState icon={<QrCode />} title="Aucun QR code" description="Générez un QR code vers l’accueil, un service ou une démarche." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {qrcodes.map((q) => (
                <QRCodeCard
                  key={q.id}
                  qr={q}
                  targetLabel={targetLabel(q)}
                  readOnly={readOnly}
                  onToggle={(actif) => qr.run(() => setQRCodeActive(q.id, actif), { success: actif ? "QR code activé" : "QR code désactivé" })}
                  onDelete={() => setQrToDelete(q)}
                />
              ))}
            </div>
          )}
        </Card>
      </Reveal>

      {dialog && (
        <BorneDialog
          borne={dialog.borne}
          onClose={() => setDialog(null)}
          onCreated={(b) => {
            setDialog(null);
            setRevealed(b);
          }}
        />
      )}

      <Dialog
        open={revealed !== null}
        onClose={() => setRevealed(null)}
        title="Borne créée"
        description="Saisissez ce code sur l’appareil lors de son installation. Il ne sera plus affiché en entier : copiez-le maintenant."
        footer={<Button onClick={() => setRevealed(null)}>J’ai noté le code</Button>}
      >
        {revealed && (
          <div className="flex flex-col items-center gap-4 py-2">
            <p className="font-display tabular rounded-2xl border-2 border-dashed border-green/40 bg-soft-green px-6 py-4 font-mono text-3xl font-semibold tracking-[0.12em] text-green-ink">
              {revealed.codeUnique}
            </p>
            <CopyButton value={revealed.codeUnique} label="Copier le code" />
          </div>
        )}
      </Dialog>

      {qrOpen && <QRDialog onClose={() => setQrOpen(false)} services={services} procedures={procedures} />}

      <ConfirmDialog
        open={toDelete !== null}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          const result = await del.run(() => deleteBorne(toDelete.id), { success: "Borne supprimée" });
          if (result.ok) setToDelete(null);
        }}
        loading={del.pending}
        tone="danger"
        title={`Supprimer « ${toDelete?.nom ?? ""} » ?`}
        description="L’appareil ne pourra plus se connecter et son point sera retiré des plans."
        confirmLabel="Supprimer"
      />
      <ConfirmDialog
        open={qrToDelete !== null}
        onCancel={() => setQrToDelete(null)}
        onConfirm={async () => {
          if (!qrToDelete) return;
          const result = await qr.run(() => deleteQRCode(qrToDelete.id), { success: "QR code supprimé" });
          if (result.ok) setQrToDelete(null);
        }}
        loading={qr.pending}
        tone="danger"
        title="Supprimer ce QR code ?"
        description="Les QR codes déjà imprimés ne fonctionneront plus. Pour une pause, désactivez-le plutôt."
        confirmLabel="Supprimer"
      />
    </>
  );
}
