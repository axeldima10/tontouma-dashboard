"use client";

import { useState } from "react";
import { Field, Select, TextArea, TextInput } from "@/components/forms/Fields";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { createDepartement, createService, updateDepartement } from "@/lib/actions/content";
import type { Departement, ServiceOffering } from "@/lib/data/types";
import { useAction } from "@/lib/hooks/useAction";

type DepartementDialogProps = {
  open: boolean;
  onClose: () => void;
  departement: Departement | null;
};

export function DepartementDialog({ open, onClose, departement }: DepartementDialogProps) {
  const { run, pending } = useAction();
  const [nom, setNom] = useState(departement?.nom ?? "");
  const [description, setDescription] = useState(departement?.description ?? "");

  const submit = async () => {
    const input = { nom, description: description || null };
    const result = await run(() => (departement ? updateDepartement(departement.id, input) : createDepartement(input)), {
      success: departement ? "Département mis à jour" : "Département créé",
    });
    if (result.ok) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={departement ? "Modifier le département" : "Nouveau département"}
      description="Un département regroupe plusieurs services (ex. État civil, Urbanisme)."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button onClick={submit} loading={pending} disabled={!nom.trim()}>
            {departement ? "Enregistrer" : "Créer le département"}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Field label="Nom" required>
          {(p) => <TextInput {...p} value={nom} onChange={(e) => setNom(e.target.value)} autoFocus maxLength={120} />}
        </Field>
        <Field label="Description" hint="Facultatif.">
          {(p) => <TextArea {...p} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />}
        </Field>
      </form>
    </Dialog>
  );
}

type NewServiceDialogProps = {
  open: boolean;
  onClose: () => void;
  departements: Departement[];
  defaultDepartementId: string | null;
  onCreated: (service: ServiceOffering) => void;
};

/** Création rapide : le reste (horaires, orientation…) se complète sur la fiche du service. */
export function NewServiceDialog({ open, onClose, departements, defaultDepartementId, onCreated }: NewServiceDialogProps) {
  const { run, pending } = useAction();
  const [nom, setNom] = useState("");
  const [departementId, setDepartementId] = useState(defaultDepartementId ?? "");
  const [localisation, setLocalisation] = useState("");

  const submit = async () => {
    const result = await run(
      () =>
        createService({
          nom,
          departement_id: departementId || null,
          description: null,
          localisation: localisation || null,
          telephone: null,
          email: null,
          horaires: null,
          description_orientation: null,
        }),
      { success: "Service créé en brouillon", successDescription: "Complétez sa fiche puis publiez-le." },
    );
    if (result.ok) onCreated(result.data);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Nouveau service"
      description="Un guichet ou bureau que les citoyens peuvent consulter."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button onClick={submit} loading={pending} disabled={!nom.trim()}>
            Créer et compléter
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Field label="Nom du service" required>
          {(p) => (
            <TextInput {...p} value={nom} onChange={(e) => setNom(e.target.value)} autoFocus placeholder="Bureau des naissances" />
          )}
        </Field>
        <Field label="Département">
          {(p) => (
            <Select {...p} value={departementId} onChange={(e) => setDepartementId(e.target.value)}>
              <option value="">Sans département</option>
              {departements.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nom}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Localisation" hint="Où se trouve le guichet (étage, bâtiment, numéro).">
          {(p) => (
            <TextInput
              {...p}
              value={localisation}
              onChange={(e) => setLocalisation(e.target.value)}
              placeholder="Rez-de-chaussée, guichet 3"
            />
          )}
        </Field>
      </form>
    </Dialog>
  );
}
