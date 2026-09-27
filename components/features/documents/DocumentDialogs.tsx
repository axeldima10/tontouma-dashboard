"use client";

import { AlertTriangle, ClipboardType, FileText, FileUp, RefreshCw, UploadCloud, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { createTextDocument, updateDocument } from "@/lib/actions/documents";
import type { ActionError } from "@/lib/actions/result";
import { DOCUMENT_ACCEPT, DOCUMENT_MAX_BYTES, useDocumentUpload } from "@/lib/api/client";
import type { KnowledgeDocument } from "@/lib/api/contract";
import { cn } from "@/lib/cn";
import { formatBytes } from "@/lib/format";
import { useAction } from "@/lib/hooks/useAction";

export const CATEGORY_SUGGESTIONS = ["Règlement", "Guide", "FAQ", "Formulaire", "Tarifs", "Procédure interne"];

function CategoryInput({ id, value, onChange, ...aria }: { id: string; value: string; onChange: (v: string) => void; "aria-describedby"?: string }) {
  const listId = useId();
  return (
    <>
      <Input id={id} list={listId} value={value} onChange={(e) => onChange(e.target.value)} maxLength={100} placeholder="Règlement, Guide, FAQ…" {...aria} />
      <datalist id={listId}>
        {CATEGORY_SUGGESTIONS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </>
  );
}

const SUCCESS_DESCRIPTION = "Indexé par l’assistant : il l’utilisera pour compléter ses réponses d’ici quelques minutes.";

/* ------------------------------ Téléversement ------------------------------ */

type UploadDialogProps = { open: boolean; onOpenChange: (open: boolean) => void };

/** Téléversement d'un PDF : contrôle du format et de la taille AVANT l'envoi, erreur d'indexation avec « Réessayer ». */
export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const upload = useDocumentUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<ActionError | null>(null);

  const pick = (candidate: File | undefined) => {
    setFailure(null);
    if (!candidate) return;
    if (candidate.type !== DOCUMENT_ACCEPT && !candidate.name.toLowerCase().endsWith(".pdf")) {
      setFileError("Seuls les fichiers PDF sont acceptés.");
      return;
    }
    if (candidate.size > DOCUMENT_MAX_BYTES) {
      setFileError(`Fichier trop volumineux (${formatBytes(candidate.size)}). Maximum : ${formatBytes(DOCUMENT_MAX_BYTES)}.`);
      return;
    }
    setFileError(null);
    setFile(candidate);
    if (!title) setTitle(candidate.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim());
  };

  const submit = async () => {
    setSubmitted(true);
    if (!file || !title.trim()) return;
    setPending(true);
    setFailure(null);
    const result = await upload(file, { title: title.trim(), category: category.trim() || null, source: source.trim() || null });
    setPending(false);
    if (result.ok) {
      toast.success("Document ajouté", { description: SUCCESS_DESCRIPTION });
      onOpenChange(false);
    } else setFailure(result.error);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
      dismissible={false}
      size="md"
      icon={<FileUp />}
      title="Téléverser un document"
      description="Règlement, guide ou FAQ : un complément aux démarches structurées, jamais un remplacement."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>
            Annuler
          </Button>
          <Button icon={failure?.retryable ? <RefreshCw /> : <UploadCloud />} loading={pending} onClick={submit}>
            {failure?.retryable ? "Réessayer" : "Téléverser"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files[0]);
          }}
          className={cn(
            "relative rounded-[22px] border-2 border-dashed transition-colors",
            dragging ? "border-brand bg-brand-soft" : fileError ? "border-destructive/50 bg-destructive-soft" : "border-border-strong bg-card/60",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {file ? (
              <motion.div key="file" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 p-4">
                <span className="grid size-12 place-items-center rounded-2xl bg-destructive-soft text-destructive">
                  <FileText className="size-6" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)} · PDF</p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setFile(null);
                    setFailure(null);
                  }}
                  className="grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  aria-label="Retirer le fichier"
                >
                  <X className="size-4" />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="drop"
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 px-6 py-9 text-center"
              >
                <motion.span animate={{ y: dragging ? -6 : 0 }} className="glass-strong grid size-14 place-items-center rounded-[20px] text-foreground">
                  <UploadCloud className="size-6" aria-hidden />
                </motion.span>
                <span className="mt-2 text-sm font-semibold text-foreground">Glissez un PDF ici ou cliquez pour choisir</span>
                <span className="text-xs text-muted-foreground">PDF uniquement · {formatBytes(DOCUMENT_MAX_BYTES)} maximum</span>
              </motion.button>
            )}
          </AnimatePresence>
          <input ref={inputRef} type="file" accept={DOCUMENT_ACCEPT} className="sr-only" tabIndex={-1} onChange={(e) => pick(e.target.files?.[0] ?? undefined)} />
        </div>
        {(fileError || (submitted && !file)) && <p className="text-xs font-medium text-destructive">{fileError ?? "Choisissez un fichier PDF."}</p>}

        <Field label="Titre" required error={submitted && !title.trim() ? "Le titre est obligatoire." : null}>
          {(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={500} placeholder="Guide du citoyen 2026" />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Catégorie">{(p) => <CategoryInput {...p} value={category} onChange={setCategory} />}</Field>
          <Field label="Source" hint="Qui a produit ce document.">
            {(p) => <Input {...p} value={source} onChange={(e) => setSource(e.target.value)} maxLength={500} placeholder="Mairie, ministère…" />}
          </Field>
        </div>

        <AnimatePresence>
          {failure && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 rounded-[18px] bg-destructive-soft px-4 py-3 text-sm"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
              <div>
                <p className="font-semibold text-destructive">{failure.kind === "upstream" ? "Indexation échouée" : failure.title}</p>
                <p className="mt-0.5 text-[13px] text-foreground/80">
                  {failure.message}
                  {failure.retryable && " Le fichier est conservé : vous pouvez réessayer."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Dialog>
  );
}

/* ------------------------------- Texte collé ------------------------------- */

export function TextDocumentDialog({ open, onOpenChange }: UploadDialogProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("FAQ");
  const [source, setSource] = useState("");
  const [content, setContent] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { run, pending } = useAction();

  const submit = async () => {
    setSubmitted(true);
    if (!title.trim() || !content.trim()) return;
    const input = { title: title.trim(), content: content.trim(), category: category.trim() || null, source: source.trim() || null };
    const result = await run(() => createTextDocument(input), { success: "Texte ajouté", successDescription: SUCCESS_DESCRIPTION, retry: () => void submit() });
    if (result.ok) onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      dismissible={false}
      size="lg"
      icon={<ClipboardType />}
      title="Coller un texte"
      description="Pour une FAQ ou un extrait de règlement sans fichier. Les faits structurés (coût, délai, pièces) vont dans les démarches."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button loading={pending} onClick={submit}>
            Ajouter le texte
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Titre" required error={submitted && !title.trim() ? "Le titre est obligatoire." : null}>
          {(p) => <Input {...p} autoFocus value={title} onChange={(e) => setTitle(e.target.value)} maxLength={500} placeholder="Questions fréquentes — état civil" />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Catégorie">{(p) => <CategoryInput {...p} value={category} onChange={setCategory} />}</Field>
          <Field label="Source">{(p) => <Input {...p} value={source} onChange={(e) => setSource(e.target.value)} maxLength={500} />}</Field>
        </div>
        <Field
          label="Texte"
          required
          error={submitted && !content.trim() ? "Le texte est vide." : null}
          hint={`${new Intl.NumberFormat("fr-FR").format(content.length)} caractères`}
        >
          {(p) => <Textarea {...p} rows={10} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Q : Puis-je demander un extrait pour un proche ?&#10;R : Oui, avec une procuration signée…" />}
        </Field>
      </div>
    </Dialog>
  );
}

/* --------------------------------- Édition --------------------------------- */

export function EditDocumentDialog({ document, onOpenChange }: { document: KnowledgeDocument; onOpenChange: (open: boolean) => void }) {
  const [title, setTitle] = useState(document.title);
  const [category, setCategory] = useState(document.category ?? "");
  const [source, setSource] = useState(document.source ?? "");
  const { run, pending } = useAction();

  const submit = async () => {
    if (!title.trim()) return;
    const result = await run(() => updateDocument(document.id, { title: title.trim(), category: category.trim() || null, source: source.trim() || null }), {
      success: "Document mis à jour",
    });
    if (result.ok) onOpenChange(false);
  };

  return (
    <Dialog
      open
      onOpenChange={onOpenChange}
      icon={<FileText />}
      title="Modifier le document"
      description="Le contenu du fichier ne change pas ; seules ses informations sont modifiées."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button loading={pending} onClick={submit} disabled={!title.trim()}>
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Titre" required error={!title.trim() ? "Le titre est obligatoire." : null}>
          {(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={500} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Catégorie">{(p) => <CategoryInput {...p} value={category} onChange={setCategory} />}</Field>
          <Field label="Source">{(p) => <Input {...p} value={source} onChange={(e) => setSource(e.target.value)} maxLength={500} />}</Field>
        </div>
      </div>
    </Dialog>
  );
}
