"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ClipboardList,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion, Reorder, useDragControls } from "motion/react";
import { DropdownMenu as M } from "radix-ui";
import { useMemo, useState } from "react";
import { useReadOnly } from "@/components/states/ReadOnly";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field, Fieldset } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { OrderedList } from "@/components/ui/OrderedList";
import { Select } from "@/components/ui/Select";
import { StatusPill } from "@/components/ui/StatusPill";
import { Switch } from "@/components/ui/Switch";
import { Segmented } from "@/components/ui/Tabs";
import { deleteForm, saveForm, setFormActive } from "@/lib/actions/forms";
import { FIELD_TYPES, type FieldType, type Form } from "@/lib/api/contract";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { useAction } from "@/lib/hooks/useAction";
import { useUnsavedChanges } from "@/lib/hooks/useUnsavedChanges";
import { FormPreview } from "./FormPreview";
import {
  FIELD_TYPE_META,
  formProblems,
  isChoice,
  newField,
  newSection,
  slugify,
  toFormRequest,
  toFormState,
  type FieldState,
  type FormState,
  type SectionState,
} from "./model";

type FormBuilderProps = {
  procedureId: string;
  procedureTitle: string;
  procedurePublished: boolean;
  form: Form | null;
  /** Version reçue par les citoyens (`GET /public/procedures/{id}/form`), null si non publiée. */
  publicForm: Form | null;
};

/**
 * Constructeur du formulaire d'une démarche : sections → champs → options, tout réordonnable.
 * « Enregistrer » crée (POST) puis remplace (PUT) ; « Publier » est une action séparée, confirmée.
 */
export function FormBuilder({ procedureId, procedureTitle, procedurePublished, form, publicForm }: FormBuilderProps) {
  const { readOnly } = useReadOnly();
  const [saved, setSaved] = useState<Form | null>(form);
  const [initial, setInitial] = useState<FormState | null>(() => (form ? toFormState(form, procedureTitle) : null));
  const [state, setState] = useState<FormState | null>(initial);
  const [openField, setOpenField] = useState<string | null>(null);
  const [preview, setPreview] = useState<"draft" | "public">("draft");
  const [confirm, setConfirm] = useState<"publish" | "unpublish" | "delete" | null>(null);
  const [showProblems, setShowProblems] = useState(false);
  const save = useAction();
  const status = useAction();

  const request = useMemo(() => (state ? toFormRequest(state) : null), [state]);
  const dirty = state !== null && (initial === null || JSON.stringify(request) !== JSON.stringify(toFormRequest(initial)));
  useUnsavedChanges(dirty);
  const problems = request ? formProblems(request) : [];
  const fieldCount = request?.sections.reduce((sum, s) => sum + s.fields.length, 0) ?? 0;

  /* ------------------------------- Mutations locales ------------------------------- */

  const updateSection = (key: string, patch: Partial<SectionState>) =>
    setState((s) => s && { ...s, sections: s.sections.map((sec) => (sec.key === key ? { ...sec, ...patch } : sec)) });
  const moveSection = (index: number, delta: number) =>
    setState((s) => {
      if (!s) return s;
      const target = index + delta;
      if (target < 0 || target >= s.sections.length) return s;
      const sections = [...s.sections];
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...s, sections };
    });
  const allNames = state?.sections.flatMap((s) => s.fields.map((f) => f.name)) ?? [];
  const addField = (sectionKey: string, type: FieldType) => {
    const field = newField(type, allNames);
    setState((s) => s && { ...s, sections: s.sections.map((sec) => (sec.key === sectionKey ? { ...sec, fields: [...sec.fields, field] } : sec)) });
    setOpenField(field.key);
  };
  const updateField = (sectionKey: string, fieldKey: string, patch: Partial<FieldState>) =>
    setState(
      (s) =>
        s && {
          ...s,
          sections: s.sections.map((sec) =>
            sec.key !== sectionKey
              ? sec
              : {
                  ...sec,
                  fields: sec.fields.map((f) => {
                    if (f.key !== fieldKey) return f;
                    const next = { ...f, ...patch };
                    // Le nom technique suit le libellé tant qu'il n'a pas été modifié à la main.
                    if (patch.label !== undefined && !f.nameEdited) next.name = slugify(patch.label);
                    if (patch.fieldType && isChoice(patch.fieldType) && next.options.length === 0) next.options = newField(patch.fieldType, []).options;
                    return next;
                  }),
                },
          ),
        },
    );
  const setFields = (sectionKey: string, fields: FieldState[]) => updateSection(sectionKey, { fields });
  const duplicateField = (sectionKey: string, field: FieldState) => {
    const fresh = newField(field.fieldType, allNames);
    const copy = { ...field, key: fresh.key, name: `${field.name}_copie`, nameEdited: true, label: `${field.label} (copie)` };
    setState(
      (s) =>
        s && {
          ...s,
          sections: s.sections.map((sec) => {
            if (sec.key !== sectionKey) return sec;
            const i = sec.fields.findIndex((f) => f.key === field.key);
            const fields = [...sec.fields];
            fields.splice(i + 1, 0, copy);
            return { ...sec, fields };
          }),
        },
    );
  };

  /* --------------------------------- Actions backend --------------------------------- */

  const onSave = async () => {
    if (!request) return;
    setShowProblems(true);
    if (problems.length > 0) return;
    const result = await save.run(() => saveForm(procedureId, saved !== null, request), {
      success: saved ? "Formulaire enregistré" : "Formulaire créé en brouillon",
      successDescription: saved?.active ? "Les citoyens verront la nouvelle version d’ici quelques minutes." : "Invisible des citoyens tant qu’il n’est pas publié.",
    });
    if (!result.ok) return;
    const next = toFormState(result.data, procedureTitle);
    setSaved(result.data);
    setInitial(next);
    setState(next);
    setShowProblems(false);
  };

  const onConfirm = async () => {
    if (confirm === "delete") {
      const result = await status.run(() => deleteForm(procedureId), { success: "Formulaire supprimé" });
      if (result.ok) {
        setSaved(null);
        setInitial(null);
        setState(null);
        setConfirm(null);
      }
      return;
    }
    const active = confirm === "publish";
    const result = await status.run(() => setFormActive(procedureId, active), {
      success: active ? "Formulaire publié" : "Formulaire dépublié",
      successDescription: active ? "Les citoyens pourront le remplir d’ici quelques minutes." : "Les citoyens ne le verront plus.",
    });
    if (result.ok) {
      setSaved(result.data);
      setConfirm(null);
    }
  };

  /* ------------------------------------ Rendu ------------------------------------ */

  if (!state || !request) {
    return (
      <div className="glass flex flex-col items-center rounded-[30px] px-6 py-14 text-center">
        <span className="glass-strong grid size-16 place-items-center rounded-[22px] text-brand-ink">
          <ClipboardList className="size-7" aria-hidden />
        </span>
        <h2 className="mt-5 text-lg font-semibold tracking-tight text-foreground">Aucun formulaire pour cette démarche</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Un formulaire permet au citoyen de préparer sa demande avant de venir : identité, informations utiles, choix du type de document…
        </p>
        {!readOnly && (
          <Button className="mt-6" icon={<Plus />} onClick={() => setState(toFormState(null, procedureTitle))}>
            Créer un formulaire
          </Button>
        )}
      </div>
    );
  }

  const publicPreview = publicForm && saved?.active ? toFormRequest(toFormState(publicForm, procedureTitle)) : null;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <Fieldset disabled={readOnly} className="space-y-5">
        {/* En-tête du formulaire */}
        <section className="surface p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={saved ? (saved.active ? "success" : "warning") : "neutral"}>{saved ? (saved.active ? "Publié" : "Brouillon") : "Non enregistré"}</StatusPill>
              {dirty && <StatusPill tone="info">Modifications non enregistrées</StatusPill>}
              <span className="text-xs text-muted-foreground">
                {state.sections.length} section{state.sections.length > 1 ? "s" : ""} · {fieldCount} champ{fieldCount > 1 ? "s" : ""}
                {saved && ` · modifié le ${formatDateTime(saved.updatedAt)}`}
              </span>
            </div>
            {!readOnly && (
              <div className="flex flex-wrap gap-2">
                {saved && (
                  <Button variant="destructive-ghost" size="sm" icon={<Trash2 />} onClick={() => setConfirm("delete")}>
                    Supprimer
                  </Button>
                )}
                {saved &&
                  (saved.active ? (
                    <Button variant="secondary" size="sm" icon={<EyeOff />} onClick={() => setConfirm("unpublish")}>
                      Dépublier
                    </Button>
                  ) : (
                    <Button variant="brand" size="sm" icon={<Eye />} disabled={dirty} title={dirty ? "Enregistrez d’abord vos modifications" : undefined} onClick={() => setConfirm("publish")}>
                      Publier
                    </Button>
                  ))}
                <Button size="sm" icon={<Save />} loading={save.pending} disabled={!dirty} onClick={onSave}>
                  {saved ? "Enregistrer" : "Créer le formulaire"}
                </Button>
              </div>
            )}
          </div>
          <div className="grid gap-4">
            <Field label="Nom du formulaire" required>
              {(p) => <Input {...p} value={state.name} maxLength={255} onChange={(e) => setState({ ...state, name: e.target.value })} />}
            </Field>
            <Field label="Description" hint="Affichée en haut du formulaire, pour expliquer à quoi il sert.">
              {(p) => <Textarea {...p} rows={2} value={state.description} onChange={(e) => setState({ ...state, description: e.target.value })} />}
            </Field>
          </div>
          {saved?.active && !procedurePublished && (
            <p className="mt-4 flex items-start gap-2 rounded-2xl bg-warning-soft px-3.5 py-2.5 text-xs text-warning">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Le formulaire est publié, mais la démarche est en brouillon : les citoyens ne le verront qu’une fois la démarche publiée.
            </p>
          )}
          <AnimatePresence>
            {showProblems && problems.length > 0 && (
              <motion.ul
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-1 overflow-hidden rounded-2xl bg-destructive-soft px-4 py-3 text-xs text-destructive"
              >
                {problems.map((problem) => (
                  <li key={problem}>• {problem}</li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </section>

        {/* Sections */}
        <AnimatePresence initial={false}>
          {state.sections.map((section, index) => (
            <motion.section
              key={section.key}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="surface p-5 sm:p-6"
            >
              <header className="mb-4 flex items-start gap-3">
                <span className="tabular grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">{index + 1}</span>
                <div className="grid min-w-0 flex-1 gap-2">
                  <Input value={section.title} aria-label={`Titre de la section ${index + 1}`} placeholder="Titre de la section" maxLength={255} className="h-10 font-semibold" onChange={(e) => updateSection(section.key, { title: e.target.value })} />
                  <Input value={section.description} aria-label={`Description de la section ${index + 1}`} placeholder="Description (facultatif)" className="h-9 text-[13px]" onChange={(e) => updateSection(section.key, { description: e.target.value })} />
                </div>
                {!readOnly && (
                  <div className="flex shrink-0 items-center">
                    <IconButton label="Monter la section" disabled={index === 0} onClick={() => moveSection(index, -1)}>
                      <ArrowUp />
                    </IconButton>
                    <IconButton label="Descendre la section" disabled={index === state.sections.length - 1} onClick={() => moveSection(index, 1)}>
                      <ArrowDown />
                    </IconButton>
                    <IconButton label="Supprimer la section" danger disabled={state.sections.length === 1} onClick={() => setState({ ...state, sections: state.sections.filter((s) => s.key !== section.key) })}>
                      <Trash2 />
                    </IconButton>
                  </div>
                )}
              </header>

              {section.fields.length === 0 ? (
                <p className="hatch mb-3 rounded-2xl px-4 py-6 text-center text-sm text-muted-foreground">Aucun champ : ajoutez-en un ci-dessous.</p>
              ) : (
                <Reorder.Group axis="y" values={section.fields} onReorder={(fields) => setFields(section.key, fields)} className="mb-3 space-y-2">
                  {section.fields.map((field, fieldIndex) => (
                    <FieldCard
                      key={field.key}
                      field={field}
                      index={fieldIndex}
                      count={section.fields.length}
                      open={openField === field.key}
                      readOnly={readOnly}
                      takenNames={allNames}
                      onToggle={() => setOpenField(openField === field.key ? null : field.key)}
                      onChange={(patch) => updateField(section.key, field.key, patch)}
                      onMove={(delta) => {
                        const target = fieldIndex + delta;
                        if (target < 0 || target >= section.fields.length) return;
                        const fields = [...section.fields];
                        [fields[fieldIndex], fields[target]] = [fields[target], fields[fieldIndex]];
                        setFields(section.key, fields);
                      }}
                      onDuplicate={() => duplicateField(section.key, field)}
                      onRemove={() => setFields(section.key, section.fields.filter((f) => f.key !== field.key))}
                    />
                  ))}
                </Reorder.Group>
              )}
              {!readOnly && <AddFieldMenu onAdd={(type) => addField(section.key, type)} />}
            </motion.section>
          ))}
        </AnimatePresence>

        {!readOnly && (
          <button
            type="button"
            onClick={() => setState({ ...state, sections: [...state.sections, newSection(state.sections.length)] })}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[22px] border border-dashed border-border-strong text-sm font-medium text-muted-foreground transition hover:border-brand hover:bg-brand-soft hover:text-brand-ink"
          >
            <Plus className="size-4" aria-hidden /> Ajouter une section
          </button>
        )}
      </Fieldset>

      {/* Aperçu */}
      <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
        <section className="glass rounded-[28px] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">Aperçu</p>
            <Segmented
              aria-label="Version affichée"
              value={preview}
              onValueChange={setPreview}
              options={[
                { value: "draft", label: "En cours" },
                { value: "public", label: "Citoyens" },
              ]}
            />
          </div>
          <div className="scrollbar-thin max-h-[calc(100dvh-14rem)] overflow-y-auto pr-1">
            {preview === "draft" ? (
              <FormPreview form={request} compact />
            ) : publicPreview ? (
              <FormPreview form={publicPreview} compact />
            ) : (
              <p className="hatch rounded-2xl px-4 py-8 text-center text-sm text-muted-foreground">
                Les citoyens ne reçoivent aucun formulaire pour l’instant : {saved?.active ? "la démarche doit être publiée" : "publiez le formulaire (et la démarche)"} pour qu’il apparaisse ici.
              </p>
            )}
          </div>
        </section>
      </aside>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        loading={status.pending}
        onConfirm={onConfirm}
        tone={confirm === "publish" ? "publish" : confirm === "delete" ? "danger" : "neutral"}
        title={confirm === "publish" ? "Publier le formulaire ?" : confirm === "unpublish" ? "Dépublier le formulaire ?" : "Supprimer le formulaire ?"}
        description={
          confirm === "publish"
            ? "Les citoyens pourront le remplir depuis la borne et le mobile, tel qu’enregistré."
            : confirm === "unpublish"
              ? "Les citoyens ne verront plus ce formulaire. Vous pourrez le republier à tout moment."
              : saved?.active
                ? "Ce formulaire est publié : les citoyens ne le verront plus. Toutes ses sections et tous ses champs seront supprimés définitivement."
                : "Toutes les sections et tous les champs seront supprimés définitivement."
        }
        confirmLabel={confirm === "publish" ? "Publier" : confirm === "unpublish" ? "Dépublier" : "Supprimer"}
      />
    </div>
  );
}

/* ---------------------------------- Champ ---------------------------------- */

type FieldCardProps = {
  field: FieldState;
  index: number;
  count: number;
  open: boolean;
  readOnly: boolean;
  takenNames: string[];
  onToggle: () => void;
  onChange: (patch: Partial<FieldState>) => void;
  onMove: (delta: number) => void;
  onDuplicate: () => void;
  onRemove: () => void;
};

function FieldCard({ field, index, count, open, readOnly, takenNames, onToggle, onChange, onMove, onDuplicate, onRemove }: FieldCardProps) {
  const controls = useDragControls();
  const meta = FIELD_TYPE_META[field.fieldType];
  const duplicateName = takenNames.filter((n) => n === field.name).length > 1;

  return (
    <Reorder.Item
      value={field}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      whileDrag={{ scale: 1.015, boxShadow: "0 18px 40px -16px rgba(21,35,46,0.35)" }}
      className={cn("rounded-[18px] border bg-card transition-colors", open ? "border-brand/40 shadow-[var(--card-shadow)]" : "border-border")}
    >
      <div className="flex items-center gap-1.5 p-2">
        {!readOnly && (
          <button type="button" aria-hidden tabIndex={-1} onPointerDown={(e) => controls.start(e)} className="grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-full text-subtle hover:text-foreground active:cursor-grabbing">
            <GripVertical className="size-4" />
          </button>
        )}
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 text-left">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-foreground">
            <meta.Icon className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-foreground">
              {field.label || "Sans libellé"}
              {field.required && <span className="text-destructive">*</span>}
            </span>
            <span className={cn("block truncate font-mono text-[11px]", duplicateName ? "text-destructive" : "text-muted-foreground")}>
              {meta.label} · {field.name || "—"}
              {isChoice(field.fieldType) && ` · ${field.options.length} option${field.options.length > 1 ? "s" : ""}`}
            </span>
          </span>
          <ChevronDown className={cn("size-4 shrink-0 text-subtle transition-transform", open && "rotate-180")} aria-hidden />
        </button>
        {!readOnly && (
          <div className="flex shrink-0 items-center">
            <IconButton label="Monter le champ" className="max-sm:hidden" disabled={index === 0} onClick={() => onMove(-1)}>
              <ArrowUp />
            </IconButton>
            <IconButton label="Descendre le champ" className="max-sm:hidden" disabled={index === count - 1} onClick={() => onMove(1)}>
              <ArrowDown />
            </IconButton>
            <IconButton label="Dupliquer le champ" className="max-sm:hidden" onClick={onDuplicate}>
              <Copy />
            </IconButton>
            <IconButton label="Supprimer le champ" danger onClick={onRemove}>
              <Trash2 />
            </IconButton>
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2">
              <Field label="Libellé" required>
                {(p) => <Input {...p} value={field.label} maxLength={255} onChange={(e) => onChange({ label: e.target.value })} />}
              </Field>
              <Field label="Type">
                {(p) => (
                  <Select
                    {...p}
                    value={field.fieldType}
                    disabled={readOnly}
                    onValueChange={(v) => onChange({ fieldType: v as FieldType })}
                    options={FIELD_TYPES.map((t) => ({ value: t, label: FIELD_TYPE_META[t].label, description: FIELD_TYPE_META[t].hint }))}
                  />
                )}
              </Field>
              <Field label="Nom technique" error={duplicateName ? "Ce nom est déjà utilisé par un autre champ." : null} hint="Identifiant stable de la réponse (minuscules, chiffres, _).">
                {(p) => (
                  <Input
                    {...p}
                    className="font-mono text-[13px]"
                    value={field.name}
                    maxLength={100}
                    onChange={(e) => onChange({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"), nameEdited: true })}
                  />
                )}
              </Field>
              <Field label="Texte d’exemple">{(p) => <Input {...p} value={field.placeholder} maxLength={255} onChange={(e) => onChange({ placeholder: e.target.value })} />}</Field>
              <Field label="Aide" className="sm:col-span-2" hint="Affichée sous le champ.">
                {(p) => <Input {...p} value={field.helpText} onChange={(e) => onChange({ helpText: e.target.value })} />}
              </Field>
              <Field label="Valeur par défaut">{(p) => <Input {...p} value={field.defaultValue} maxLength={500} onChange={(e) => onChange({ defaultValue: e.target.value })} />}</Field>
              <label className="flex items-center justify-between gap-3 self-end rounded-[14px] border border-input bg-card px-3.5 py-2.5">
                <span className="text-sm font-medium text-foreground">Obligatoire</span>
                <Switch checked={field.required} disabled={readOnly} onCheckedChange={(required) => onChange({ required })} />
              </label>

              {isChoice(field.fieldType) && (
                <div className="sm:col-span-2">
                  <p className="mb-2 text-[13px] font-semibold text-foreground">Options</p>
                  <OrderedList items={field.options} onChange={(options) => onChange({ options })} placeholder="Libellé de l’option" addLabel="Ajouter une option" itemLabel="Option" disabled={readOnly} numbered={false} />
                </div>
              )}

              <details className="group sm:col-span-2">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground">
                  <Settings2 className="size-4" aria-hidden /> Validation avancée
                  <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <Field label="Expression régulière" hint="Ex. ^7[05678]\d{7}$ pour un mobile sénégalais.">
                    {(p) => <Input {...p} className="font-mono text-[13px]" value={field.validationRegex} maxLength={500} onChange={(e) => onChange({ validationRegex: e.target.value })} />}
                  </Field>
                  <Field label="Message si invalide">{(p) => <Input {...p} value={field.validationMessage} maxLength={255} onChange={(e) => onChange({ validationMessage: e.target.value })} />}</Field>
                </div>
              </details>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

function AddFieldMenu({ onAdd }: { onAdd: (type: FieldType) => void }) {
  return (
    <M.Root>
      <M.Trigger className="flex h-10 w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-border-strong text-sm font-medium text-muted-foreground transition hover:border-brand hover:bg-brand-soft hover:text-brand-ink data-[state=open]:border-brand data-[state=open]:text-brand-ink">
        <Plus className="size-4" aria-hidden /> Ajouter un champ
      </M.Trigger>
      <M.Portal>
        <M.Content
          sideOffset={8}
          className="glass-strong z-50 grid w-[min(520px,calc(100vw-2rem))] grid-cols-1 gap-1 rounded-[22px] p-2 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:grid-cols-3"
        >
          {FIELD_TYPES.map((type) => {
            const meta = FIELD_TYPE_META[type];
            return (
              <M.Item key={type} onSelect={() => onAdd(type)} className="flex cursor-pointer items-center gap-3 rounded-2xl p-2.5 outline-none select-none data-[highlighted]:bg-card data-[highlighted]:shadow-[var(--card-shadow)]">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent">
                  <meta.Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">{meta.label}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{meta.hint}</span>
                </span>
              </M.Item>
            );
          })}
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}

function IconButton({ label, onClick, disabled, danger, className, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-8 place-items-center rounded-full text-muted-foreground transition disabled:opacity-30 [&_svg]:size-4",
        danger ? "hover:bg-destructive-soft hover:text-destructive" : "hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}
