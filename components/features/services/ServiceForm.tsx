"use client";

import { Clock, MapPin, Phone } from "lucide-react";
import type { Department, OpeningHours, Service, ServiceRequest } from "@/lib/api/contract";
import { Field } from "@/components/ui/Field";
import { AffixInput, Input, Textarea } from "@/components/ui/Input";
import { OpeningHoursEditor } from "@/components/ui/OpeningHoursEditor";
import { Select } from "@/components/ui/Select";

export type ServiceFormState = {
  departmentId: string;
  name: string;
  description: string;
  location: string;
  phone: string;
  openingHours: OpeningHours[];
};

export function toServiceForm(service: Service | null, departments: Department[], defaultDepartmentId?: string): ServiceFormState {
  return {
    departmentId: service?.departmentId ?? defaultDepartmentId ?? departments[0]?.id ?? "",
    name: service?.name ?? "",
    description: service?.description ?? "",
    location: service?.location ?? "",
    phone: service?.phone ?? "",
    openingHours: service?.openingHours ?? [],
  };
}

export function toServiceRequest(form: ServiceFormState): ServiceRequest {
  return {
    departmentId: form.departmentId,
    name: form.name.trim(),
    description: form.description.trim() || null,
    location: form.location.trim() || null,
    phone: form.phone.trim() || null,
    openingHours: form.openingHours.map((r) => ({ ...r, opensAt: r.opensAt.slice(0, 5), closesAt: r.closesAt.slice(0, 5) })),
  };
}

export function serviceErrors(form: ServiceFormState) {
  return {
    name: form.name.trim() ? null : "Le nom est obligatoire.",
    departmentId: form.departmentId ? null : "Choisissez un département.",
    openingHours: form.openingHours.every((r) => r.opensAt < r.closesAt) ? null : "Une plage ferme avant d’ouvrir.",
  };
}

type ServiceFieldsProps = {
  form: ServiceFormState;
  onChange: (form: ServiceFormState) => void;
  departments: Department[];
  errors: ReturnType<typeof serviceErrors>;
  showErrors: boolean;
  disabled?: boolean;
  /** Mise en page compacte (modale) ou large (page de détail). */
  layout?: "dialog" | "page";
};

/** Champs structurés d'un service : l'assistant lit le lieu, le téléphone et les horaires tels quels. */
export function ServiceFields({ form, onChange, departments, errors, showErrors, disabled, layout = "dialog" }: ServiceFieldsProps) {
  const set = <K extends keyof ServiceFormState>(key: K, value: ServiceFormState[K]) => onChange({ ...form, [key]: value });
  const show = (error: string | null) => (showErrors ? error : null);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom du service" required error={show(errors.name)}>
          {(p) => <Input {...p} value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={255} placeholder="Bureau des naissances" disabled={disabled} />}
        </Field>
        <Field label="Département" required error={show(errors.departmentId)}>
          {(p) => (
            <Select
              {...p}
              value={form.departmentId}
              onValueChange={(v) => set("departmentId", v)}
              disabled={disabled}
              placeholder="Choisir un département"
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
          )}
        </Field>
        <Field label="Description" className="sm:col-span-2" hint="Ce que fait ce service, en une ou deux phrases simples.">
          {(p) => <Textarea {...p} rows={layout === "page" ? 3 : 2} value={form.description} onChange={(e) => set("description", e.target.value)} disabled={disabled} />}
        </Field>
        <Field label="Localisation" hint="L’assistant l’indique aux citoyens sur place.">
          {(p) => (
            <AffixInput {...p} prefix={<MapPin />} value={form.location} onChange={(e) => set("location", e.target.value)} maxLength={500} placeholder="Rez-de-chaussée, guichet 2" disabled={disabled} />
          )}
        </Field>
        <Field label="Téléphone">
          {(p) => (
            <AffixInput {...p} prefix={<Phone />} type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} maxLength={20} placeholder="+221 33 800 00 00" disabled={disabled} />
          )}
        </Field>
      </div>
      <div>
        <p className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-foreground">
          <Clock className="size-4 text-muted-foreground" aria-hidden /> Horaires d’ouverture
        </p>
        <OpeningHoursEditor value={form.openingHours} onChange={(v) => set("openingHours", v)} disabled={disabled} />
        {show(errors.openingHours) && <p className="mt-2 text-xs font-medium text-destructive">{errors.openingHours}</p>}
      </div>
    </div>
  );
}
