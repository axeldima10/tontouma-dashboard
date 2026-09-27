"use client";

import { AtSign, Hash, Link as LinkIcon, MapPin, Phone } from "lucide-react";
import { useId } from "react";
import { Field } from "@/components/ui/Field";
import { AffixInput, Input, Textarea } from "@/components/ui/Input";
import { OpeningHoursEditor } from "@/components/ui/OpeningHoursEditor";
import type { OpeningHours, Organization, OrganizationUpdateRequest } from "@/lib/api/contract";

export const ORGANIZATION_TYPES = ["Mairie", "Hôpital", "Agence", "Ministère", "Préfecture", "Université", "Établissement public"];

export type OrganizationFormState = {
  name: string;
  type: string;
  ninea: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  openingHours: OpeningHours[];
};

export function toOrganizationForm(org: Organization | null): OrganizationFormState {
  return {
    name: org?.name ?? "",
    type: org?.type ?? "",
    ninea: org?.ninea ?? "",
    address: org?.address ?? "",
    phone: org?.phone ?? "",
    email: org?.email ?? "",
    logoUrl: org?.logoUrl ?? "",
    openingHours: org?.openingHours ?? [],
  };
}

export function toOrganizationRequest(form: OrganizationFormState): OrganizationUpdateRequest {
  const opt = (v: string) => v.trim() || null;
  return {
    name: form.name.trim(),
    type: opt(form.type),
    ninea: opt(form.ninea),
    address: form.address.trim(),
    phone: opt(form.phone),
    email: opt(form.email),
    logoUrl: opt(form.logoUrl),
    openingHours: form.openingHours.map((r) => ({ ...r, opensAt: r.opensAt.slice(0, 5), closesAt: r.closesAt.slice(0, 5) })),
  };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function organizationErrors(form: OrganizationFormState) {
  return {
    name: form.name.trim() ? null : "Le nom est obligatoire.",
    address: form.address.trim() ? null : "L’adresse est obligatoire.",
    email: !form.email.trim() || EMAIL.test(form.email.trim()) ? null : "Adresse email invalide.",
    logoUrl: !form.logoUrl.trim() || /^https?:\/\//.test(form.logoUrl.trim()) ? null : "URL http(s) attendue.",
    openingHours: form.openingHours.every((r) => r.opensAt < r.closesAt) ? null : "Une plage ferme avant d’ouvrir.",
  };
}

type OrganizationFieldsProps = {
  form: OrganizationFormState;
  onChange: (form: OrganizationFormState) => void;
  showErrors: boolean;
  withHours?: boolean;
};

export function OrganizationFields({ form, onChange, showErrors, withHours = true }: OrganizationFieldsProps) {
  const typesId = useId();
  const errors = organizationErrors(form);
  const set = <K extends keyof OrganizationFormState>(key: K, value: OrganizationFormState[K]) => onChange({ ...form, [key]: value });
  const show = (e: string | null) => (showErrors ? e : null);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom de l’organisation" required error={show(errors.name)} className="sm:col-span-2">
          {(p) => <Input {...p} value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={255} placeholder="Mairie de Dakar-Plateau" />}
        </Field>
        <Field label="Type">
          {(p) => (
            <>
              <Input {...p} list={typesId} value={form.type} onChange={(e) => set("type", e.target.value)} maxLength={30} placeholder="Mairie" />
              <datalist id={typesId}>
                {ORGANIZATION_TYPES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </>
          )}
        </Field>
        <Field label="NINEA">{(p) => <AffixInput {...p} prefix={<Hash />} value={form.ninea} onChange={(e) => set("ninea", e.target.value)} maxLength={15} />}</Field>
        <Field label="Adresse" required error={show(errors.address)} className="sm:col-span-2">
          {(p) => (
            <div className="relative">
              <MapPin className="pointer-events-none absolute top-3.5 left-3.5 size-4 text-subtle" aria-hidden />
              <Textarea {...p} rows={2} className="min-h-0 pl-10" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
          )}
        </Field>
        <Field label="Téléphone">
          {(p) => <AffixInput {...p} prefix={<Phone />} type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} maxLength={20} />}
        </Field>
        <Field label="Email de contact" error={show(errors.email)}>
          {(p) => <AffixInput {...p} prefix={<AtSign />} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} maxLength={255} />}
        </Field>
        <Field label="URL du logo" error={show(errors.logoUrl)} className="sm:col-span-2">
          {(p) => <AffixInput {...p} prefix={<LinkIcon />} type="url" value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} maxLength={500} placeholder="https://…" />}
        </Field>
      </div>
      {withHours && (
        <div>
          <p className="mb-2 text-[13px] font-semibold text-foreground">Horaires d’ouverture</p>
          <OpeningHoursEditor value={form.openingHours} onChange={(v) => set("openingHours", v)} />
          {show(errors.openingHours) && <p className="mt-2 text-xs font-medium text-destructive">{errors.openingHours}</p>}
        </div>
      )}
    </div>
  );
}
