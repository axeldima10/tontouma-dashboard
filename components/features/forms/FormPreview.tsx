"use client";

import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { useId, useState } from "react";
import { controlClass } from "@/components/ui/Input";
import type { FormRequest } from "@/lib/api/contract";
import { cn } from "@/lib/cn";

type PreviewField = FormRequest["sections"][number]["fields"][number];

/** Rendu citoyen d'un formulaire : champs interactifs, validation locale au clic sur « Vérifier ». */
export function FormPreview({ form, compact }: { form: FormRequest; compact?: boolean }) {
  const [values, setValues] = useState<Record<string, string | string[]>>({});
  const [checked, setChecked] = useState(false);

  const errorOf = (field: PreviewField): string | null => {
    if (!checked) return null;
    const value = values[field.name] ?? field.defaultValue ?? "";
    const empty = Array.isArray(value) ? value.length === 0 : !value.trim();
    if (field.required && empty) return "Ce champ est obligatoire.";
    if (!empty && typeof value === "string" && field.validationRegex) {
      try {
        if (!new RegExp(field.validationRegex).test(value)) return field.validationMessage || "Format invalide.";
      } catch {
        return null;
      }
    }
    return null;
  };

  const sections = form.sections.filter((s) => s.fields.length > 0 || s.title);

  return (
    <div className={cn("space-y-5", compact && "text-[13px]")}>
      <header>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">{form.name || "Formulaire sans nom"}</h3>
        {form.description && <p className="mt-1 text-sm text-muted-foreground">{form.description}</p>}
      </header>
      {sections.length === 0 && <p className="hatch rounded-2xl px-4 py-8 text-center text-sm text-muted-foreground">Ajoutez une section et des champs pour voir l’aperçu.</p>}
      {sections.map((section, i) => (
        <motion.fieldset key={i} layout className="space-y-4 rounded-[20px] bg-card p-4 shadow-[var(--card-shadow)]">
          <legend className="sr-only">{section.title}</legend>
          <div>
            <p className="text-sm font-semibold text-foreground">
              <span className="tabular mr-2 text-muted-foreground">{i + 1}.</span>
              {section.title || "Section sans titre"}
            </p>
            {section.description && <p className="mt-0.5 text-xs text-muted-foreground">{section.description}</p>}
          </div>
          {section.fields.length === 0 && <p className="text-xs text-subtle">Aucun champ dans cette section.</p>}
          {section.fields.map((field) => (
            <PreviewInput
              key={field.name + field.displayOrder}
              field={field}
              value={values[field.name]}
              error={errorOf(field)}
              onChange={(v) => setValues((current) => ({ ...current, [field.name]: v }))}
            />
          ))}
        </motion.fieldset>
      ))}
      {sections.length > 0 && (
        <button
          type="button"
          onClick={() => setChecked(true)}
          className="h-11 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground transition active:scale-[0.98]"
        >
          Vérifier le formulaire
        </button>
      )}
    </div>
  );
}

function PreviewInput({
  field,
  value,
  error,
  onChange,
}: {
  field: PreviewField;
  value: string | string[] | undefined;
  error: string | null;
  onChange: (value: string | string[]) => void;
}) {
  const id = useId();
  const text = typeof value === "string" ? value : (field.defaultValue ?? "");
  const list = Array.isArray(value) ? value : field.defaultValue ? [field.defaultValue] : [];
  const common = { id, "aria-invalid": error ? true : undefined, placeholder: field.placeholder ?? undefined };
  const label = (
    <span className="text-[13px] font-semibold text-foreground">
      {field.label || "Champ sans libellé"}
      {field.required && <span className="ml-0.5 text-destructive">*</span>}
    </span>
  );

  let control;
  switch (field.fieldType) {
    case "TEXTAREA":
      control = <textarea {...common} rows={3} value={text} onChange={(e) => onChange(e.target.value)} className={cn(controlClass, "py-2.5")} />;
      break;
    case "SELECT":
      control = (
        <div className="relative">
          <select {...common} value={text} onChange={(e) => onChange(e.target.value)} className={cn(controlClass, "h-11 appearance-none pr-10")}>
            <option value="">{field.placeholder || "Choisir…"}</option>
            {field.options.map((o) => (
              <option key={o.displayOrder} value={o.label}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-subtle" aria-hidden />
        </div>
      );
      break;
    case "RADIO":
    case "CHECKBOX": {
      const multiple = field.fieldType === "CHECKBOX";
      control = (
        <div role={multiple ? "group" : "radiogroup"} aria-labelledby={`${id}-label`} className="space-y-1.5">
          {field.options.map((o) => {
            const on = multiple ? list.includes(o.label) : text === o.label;
            return (
              <label key={o.displayOrder} className={cn("flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition", on ? "border-brand bg-brand-soft" : "border-input bg-card hover:border-border-strong")}>
                <input
                  type={multiple ? "checkbox" : "radio"}
                  name={field.name}
                  checked={on}
                  onChange={() => onChange(multiple ? (on ? list.filter((l) => l !== o.label) : [...list, o.label]) : o.label)}
                  className="size-4 accent-[var(--brand)]"
                />
                {o.label}
              </label>
            );
          })}
        </div>
      );
      break;
    }
    default: {
      const type = { TEXT: "text", NUMBER: "number", DATE: "date", EMAIL: "email", PHONE: "tel" }[field.fieldType] ?? "text";
      control = <input {...common} type={type} value={text} onChange={(e) => onChange(e.target.value)} className={cn(controlClass, "h-11")} />;
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {field.fieldType === "RADIO" || field.fieldType === "CHECKBOX" ? <span id={`${id}-label`}>{label}</span> : <label htmlFor={id}>{label}</label>}
      {control}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : field.helpText ? <p className="text-xs text-muted-foreground">{field.helpText}</p> : null}
    </div>
  );
}
