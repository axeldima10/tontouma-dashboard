"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { DocumentsPanel, type DocumentRow } from "@/components/features/documents/DocumentsPanel";
import { Field, FormFieldset, Select, TextArea, TextInput } from "@/components/forms/Fields";
import { PageHeader } from "@/components/shell/PageHeader";
import { useReadOnly } from "@/components/states/ReadOnly";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { updateOrganization } from "@/lib/actions/management";
import type { Organization, OrganizationInput } from "@/lib/data/types";
import { useAction } from "@/lib/hooks/useAction";
import { useUnsavedChanges } from "@/lib/hooks/useUnsavedChanges";
import { Reveal } from "@/lib/motion/Reveal";

const TYPES = ["Mairie", "Ministère", "Hôpital", "Agence", "Direction", "Autre"];

const toInput = (o: Organization): OrganizationInput => ({
  nom: o.nom,
  type: o.type,
  description: o.description,
  adresse: o.adresse,
  telephone: o.telephone,
  email: o.email,
  siteWeb: o.siteWeb,
});

export function SettingsForm({ organization, documents }: { organization: Organization; documents: DocumentRow[] }) {
  const { readOnly } = useReadOnly();
  const [initial, setInitial] = useState(() => toInput(organization));
  const [form, setForm] = useState(initial);
  const save = useAction();
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useUnsavedChanges(dirty);

  const set = (key: keyof OrganizationInput, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const value = (key: keyof OrganizationInput) => form[key] ?? "";

  const onSave = async () => {
    const result = await save.run(() => updateOrganization(form), {
      success: "Informations enregistrées",
      successDescription: "L’assistant utilisera ces informations d’ici quelques minutes.",
    });
    if (result.ok) {
      setInitial(toInput(result.data));
      setForm(toInput(result.data));
    }
  };

  return (
    <>
      <PageHeader
        title="Paramètres"
        description="L’identité de votre organisation, telle que l’assistant la présente aux citoyens."
        actions={
          !readOnly && (
            <Button magnetic icon={<Save className="size-4" />} onClick={onSave} loading={save.pending} disabled={!dirty}>
              Enregistrer
            </Button>
          )
        }
      />
      <Reveal className="space-y-5">
        <Card>
          <CardHeader title="Informations de l’organisation" />
          <FormFieldset disabled={readOnly}>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (dirty) void onSave();
              }}
            >
              <Field label="Nom" required>
                {(p) => <TextInput {...p} value={value("nom")} onChange={(e) => set("nom", e.target.value)} />}
              </Field>
              <Field label="Type" required>
                {(p) => (
                  <Select {...p} value={value("type")} onChange={(e) => set("type", e.target.value)}>
                    {[...new Set([...TYPES, organization.type])].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Description" className="sm:col-span-2" hint="Une ou deux phrases : l’assistant s’en sert pour présenter l’organisation.">
                {(p) => <TextArea {...p} rows={3} value={value("description")} onChange={(e) => set("description", e.target.value)} />}
              </Field>
              <Field label="Adresse" className="sm:col-span-2">
                {(p) => <TextInput {...p} value={value("adresse")} onChange={(e) => set("adresse", e.target.value)} />}
              </Field>
              <Field label="Téléphone">
                {(p) => <TextInput {...p} type="tel" value={value("telephone")} onChange={(e) => set("telephone", e.target.value)} />}
              </Field>
              <Field label="Email">
                {(p) => <TextInput {...p} type="email" value={value("email")} onChange={(e) => set("email", e.target.value)} />}
              </Field>
              <Field label="Site web" className="sm:col-span-2">
                {(p) => <TextInput {...p} type="url" value={value("siteWeb")} onChange={(e) => set("siteWeb", e.target.value)} placeholder="https://" />}
              </Field>
            </form>
          </FormFieldset>
        </Card>

        <DocumentsPanel
          documents={documents}
          scope={{ kind: "organisation" }}
          title="Documents de l’organisation"
          emptyHint="Règlement intérieur, guide d’accueil… des connaissances valables pour toute l’organisation."
        />
      </Reveal>
    </>
  );
}
