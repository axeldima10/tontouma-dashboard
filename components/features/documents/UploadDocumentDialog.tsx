"use client";

import { useState } from "react";
import { FileDrop } from "@/components/forms/FileDrop";
import { Field, Select, TextArea, TextInput } from "@/components/forms/Fields";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { confirmDocument, requestDocumentUpload } from "@/lib/actions/assets";
import { uploadToSignedUrl } from "@/lib/upload";

export const DOCUMENT_TYPES = ["Règlement", "Guide", "FAQ", "Formulaire", "Autre"] as const;
const MAX_BYTES = 10 * 1024 * 1024;

export type DocumentScope =
  | { kind: "organisation" }
  | { kind: "service"; serviceId: string }
  | { kind: "procedure"; procedureId: string; serviceId: string };

type Option = { id: string; label: string };

type UploadDocumentDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Rattachement imposé (page service / démarche) ou choisi (page Documents). */
  scope: DocumentScope | null;
  services?: Option[];
  procedures?: (Option & { serviceId: string })[];
  onUploaded: () => void;
};

/**
 * Téléversement en trois temps : URL pré-signée demandée au dernier moment, envoi direct
 * du fichier, puis confirmation (le backend lance l'indexation en arrière-plan).
 */
export function UploadDocumentDialog({ open, onClose, scope, services = [], procedures = [], onUploaded }: UploadDocumentDialogProps) {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [titre, setTitre] = useState("");
  const [type, setType] = useState<string>("Guide");
  const [description, setDescription] = useState("");
  const [attach, setAttach] = useState(scope ? "" : "organisation");
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const target = (): { service_id: string | null; procedure_id: string | null } => {
    if (scope?.kind === "service") return { service_id: scope.serviceId, procedure_id: null };
    if (scope?.kind === "procedure") return { service_id: scope.serviceId, procedure_id: scope.procedureId };
    if (attach.startsWith("service:")) return { service_id: attach.slice(8), procedure_id: null };
    if (attach.startsWith("procedure:")) {
      const procedure = procedures.find((p) => p.id === attach.slice(10));
      return { service_id: procedure?.serviceId ?? null, procedure_id: attach.slice(10) };
    }
    return { service_id: null, procedure_id: null };
  };

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const ticket = await requestDocumentUpload({ fileName: file.name, contentType: file.type, sizeBytes: file.size });
      if (!ticket.ok) throw ticket.error;
      setProgress(0);
      await uploadToSignedUrl(ticket.data.uploadUrl, file, setProgress);
      const confirmed = await confirmDocument(ticket.data.key, {
        titre: titre || file.name.replace(/\.pdf$/i, ""),
        type,
        description: description || null,
        ...target(),
      });
      if (!confirmed.ok) throw confirmed.error;
      toast.show({
        tone: "success",
        title: "Document envoyé",
        description: "L’indexation démarre en arrière-plan. Vous pouvez continuer à travailler.",
      });
      onUploaded();
      onClose();
    } catch (error) {
      const e = error as { title?: string; message?: string };
      toast.show({ tone: "error", title: e.title ?? "Téléversement impossible", description: e.message ?? "Réessayez." });
      setProgress(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={busy ? () => undefined : onClose}
      title="Ajouter un document de référence"
      description="Règlements, guides, FAQ : des connaissances complémentaires. Les coûts, délais et pièces restent dans les champs des démarches."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          <Button onClick={submit} loading={busy} disabled={!file}>
            Envoyer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FileDrop
          accept={["application/pdf"]}
          formatsLabel="PDF uniquement"
          maxBytes={MAX_BYTES}
          file={file}
          onFile={(f) => {
            setFile(f);
            if (f && !titre) setTitre(f.name.replace(/\.pdf$/i, ""));
          }}
          disabled={busy}
          progress={progress}
        />
        <Field label="Titre">
          {(p) => <TextInput {...p} value={titre} onChange={(e) => setTitre(e.target.value)} disabled={busy} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type">
            {(p) => (
              <Select {...p} value={type} onChange={(e) => setType(e.target.value)} disabled={busy}>
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            )}
          </Field>
          {!scope && (
            <Field label="Rattacher à">
              {(p) => (
                <Select {...p} value={attach} onChange={(e) => setAttach(e.target.value)} disabled={busy}>
                  <option value="organisation">Toute l’organisation</option>
                  {services.length > 0 && (
                    <optgroup label="Un service">
                      {services.map((s) => (
                        <option key={s.id} value={`service:${s.id}`}>
                          {s.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {procedures.length > 0 && (
                    <optgroup label="Une démarche">
                      {procedures.map((p2) => (
                        <option key={p2.id} value={`procedure:${p2.id}`}>
                          {p2.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </Select>
              )}
            </Field>
          )}
        </div>
        <Field label="Description" hint="Facultatif — aide l’équipe à s’y retrouver.">
          {(p) => <TextArea {...p} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} disabled={busy} />}
        </Field>
      </div>
    </Dialog>
  );
}
