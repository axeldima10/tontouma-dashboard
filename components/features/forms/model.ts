import { AlignLeft, AtSign, Calendar, CircleDot, Hash, Phone, SquareCheck, SquareChevronDown, Type, type LucideIcon } from "lucide-react";
import { CHOICE_TYPES, type FieldType, type Form, type FormRequest } from "@/lib/api/contract";
import { newItem, type ListItem } from "@/components/ui/OrderedList";

/** Métadonnées d'affichage des 9 types de champ du backend. */
export const FIELD_TYPE_META: Record<FieldType, { label: string; hint: string; Icon: LucideIcon }> = {
  TEXT: { label: "Texte court", hint: "Nom, référence…", Icon: Type },
  TEXTAREA: { label: "Texte long", hint: "Motif, précisions…", Icon: AlignLeft },
  NUMBER: { label: "Nombre", hint: "Quantité, âge…", Icon: Hash },
  DATE: { label: "Date", hint: "Date de naissance…", Icon: Calendar },
  EMAIL: { label: "Email", hint: "Adresse de contact", Icon: AtSign },
  PHONE: { label: "Téléphone", hint: "Numéro de contact", Icon: Phone },
  SELECT: { label: "Liste déroulante", hint: "Un choix parmi plusieurs", Icon: SquareChevronDown },
  RADIO: { label: "Choix unique", hint: "Boutons radio", Icon: CircleDot },
  CHECKBOX: { label: "Cases à cocher", hint: "Plusieurs choix possibles", Icon: SquareCheck },
};

export const isChoice = (type: FieldType) => CHOICE_TYPES.includes(type);

export type FieldState = {
  key: string;
  name: string;
  /** Le nom technique suit le libellé tant que l'utilisateur ne l'a pas modifié lui-même. */
  nameEdited: boolean;
  label: string;
  fieldType: FieldType;
  placeholder: string;
  required: boolean;
  defaultValue: string;
  helpText: string;
  validationRegex: string;
  validationMessage: string;
  options: ListItem[];
};

export type SectionState = { key: string; title: string; description: string; fields: FieldState[] };

export type FormState = { name: string; description: string; sections: SectionState[] };

let seq = 0;
const key = (prefix: string) => `${prefix}-${++seq}-${Math.random().toString(36).slice(2, 7)}`;

/** « Date de naissance » → « date_de_naissance » (minuscules, chiffres, _). */
export function slugify(label: string): string {
  const slug = label
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 90);
  if (!slug) return "champ";
  return /^[a-z]/.test(slug) ? slug : `champ_${slug}`;
}

export function newField(fieldType: FieldType, taken: string[]): FieldState {
  const meta = FIELD_TYPE_META[fieldType];
  let name = slugify(meta.label);
  for (let i = 2; taken.includes(name); i++) name = `${slugify(meta.label)}_${i}`;
  return {
    key: key("field"),
    name,
    nameEdited: false,
    label: meta.label,
    fieldType,
    placeholder: "",
    required: false,
    defaultValue: "",
    helpText: "",
    validationRegex: "",
    validationMessage: "",
    options: isChoice(fieldType) ? [newItem("Option 1"), newItem("Option 2")] : [],
  };
}

export function newSection(index: number): SectionState {
  return { key: key("section"), title: index === 0 ? "Informations du demandeur" : `Section ${index + 1}`, description: "", fields: [] };
}

export function toFormState(form: Form | null, procedureTitle: string): FormState {
  if (!form) return { name: `Demande — ${procedureTitle}`, description: "", sections: [newSection(0)] };
  const byOrder = <T extends { displayOrder: number }>(items: T[]) => [...items].sort((a, b) => a.displayOrder - b.displayOrder);
  return {
    name: form.name,
    description: form.description ?? "",
    sections: byOrder(form.sections).map((section) => ({
      key: key("section"),
      title: section.title,
      description: section.description ?? "",
      fields: byOrder(section.fields).map((field) => ({
        key: key("field"),
        name: field.name,
        nameEdited: true,
        label: field.label,
        fieldType: field.fieldType,
        placeholder: field.placeholder ?? "",
        required: field.required,
        defaultValue: field.defaultValue ?? "",
        helpText: field.helpText ?? "",
        validationRegex: field.validationRegex ?? "",
        validationMessage: field.validationMessage ?? "",
        options: byOrder(field.options).map((o) => newItem(o.label)),
      })),
    })),
  };
}

const opt = (value: string) => value.trim() || null;

export function toFormRequest(state: FormState): FormRequest {
  return {
    name: state.name.trim(),
    description: opt(state.description),
    sections: state.sections.map((section, sectionIndex) => ({
      title: section.title.trim(),
      description: opt(section.description),
      displayOrder: sectionIndex,
      fields: section.fields.map((field, fieldIndex) => ({
        name: field.name.trim(),
        label: field.label.trim(),
        fieldType: field.fieldType,
        placeholder: opt(field.placeholder),
        required: field.required,
        displayOrder: fieldIndex,
        defaultValue: opt(field.defaultValue),
        helpText: opt(field.helpText),
        validationRegex: opt(field.validationRegex),
        validationMessage: opt(field.validationMessage),
        options: isChoice(field.fieldType)
          ? field.options
              .map((o) => o.value.trim())
              .filter(Boolean)
              .map((label, displayOrder) => ({ label, displayOrder }))
          : [],
      })),
    })),
  };
}

/** Problèmes bloquants, détectés avant l'envoi (le backend revalide). */
export function formProblems(request: FormRequest): string[] {
  const problems: string[] = [];
  if (!request.name) problems.push("Le formulaire a besoin d’un nom.");
  if (request.sections.length === 0) problems.push("Ajoutez au moins une section.");
  const names = request.sections.flatMap((s) => s.fields.map((f) => f.name));
  const duplicate = names.find((n, i) => names.indexOf(n) !== i);
  if (duplicate) problems.push(`Deux champs portent le même nom technique : « ${duplicate} ».`);
  request.sections.forEach((section, i) => {
    if (!section.title) problems.push(`La section ${i + 1} n’a pas de titre.`);
    section.fields.forEach((field) => {
      if (!field.label) problems.push(`Un champ de « ${section.title || `Section ${i + 1}`} » n’a pas de libellé.`);
      if (!/^[a-z][a-z0-9_]*$/.test(field.name)) problems.push(`Nom technique invalide : « ${field.name || "vide"} ».`);
      if (isChoice(field.fieldType) && field.options.length === 0) problems.push(`« ${field.label} » a besoin d’au moins une option.`);
      if (field.validationRegex) {
        try {
          new RegExp(field.validationRegex);
        } catch {
          problems.push(`Expression régulière invalide pour « ${field.label} ».`);
        }
      }
    });
  });
  return problems;
}
