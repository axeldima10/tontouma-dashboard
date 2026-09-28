"use client";

import { FileUp, X } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";
import { cn } from "@/lib/cn";
import { formatBytes } from "@/lib/upload";

type FileDropProps = {
  accept: string[];
  /** Libellé humain des formats (« PDF », « PNG, JPG, SVG »). */
  formatsLabel: string;
  maxBytes: number;
  file: File | null;
  onFile: (file: File | null) => void;
  disabled?: boolean;
  /** Progression 0–1 pendant l'envoi. */
  progress?: number | null;
};

/** Zone de dépôt : formats et taille maximale affichés avant l'envoi, vérifiés à la sélection. */
export function FileDrop({ accept, formatsLabel, maxBytes, file, onFile, disabled, progress }: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hintId = useId();

  const pick = (candidate: File | undefined) => {
    if (!candidate) return;
    if (!accept.includes(candidate.type)) {
      setError(`Format non accepté. Formats acceptés : ${formatsLabel}.`);
      return;
    }
    if (candidate.size > maxBytes) {
      setError(`Fichier trop lourd (${formatBytes(candidate.size)}). Maximum : ${formatBytes(maxBytes)}.`);
      return;
    }
    setError(null);
    onFile(candidate);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    if (!disabled) pick(event.dataTransfer.files[0]);
  };

  return (
    <div>
      {file ? (
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-2 p-3.5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-soft-green text-green-ink">
              <FileUp className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text">{file.name}</p>
              <p className="text-xs text-muted">
                {formatBytes(file.size)}
                {progress != null && ` · ${Math.round(progress * 100)} %`}
              </p>
            </div>
            {progress == null && !disabled && (
              <button
                type="button"
                onClick={() => onFile(null)}
                aria-label="Retirer le fichier"
                className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-3 hover:text-text"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          {progress != null && (
            <span className="absolute inset-x-0 bottom-0 h-1 bg-surface-3">
              <span
                className="block h-full origin-left bg-green transition-transform duration-200"
                style={{ transform: `scaleX(${progress})` }}
              />
            </span>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          aria-describedby={hintId}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
          className={cn(
            "flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
            over ? "border-green bg-soft-green" : "border-line-strong bg-surface-2 hover:border-green/50",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <span className="grid size-11 place-items-center rounded-2xl bg-panel text-green-ink shadow-sm ring-1 ring-line">
            <FileUp className="size-5" aria-hidden />
          </span>
          <span className="text-sm font-medium text-text">Glissez un fichier ici ou cliquez pour choisir</span>
          <span id={hintId} className="text-xs text-muted">
            {formatsLabel} · {formatBytes(maxBytes)} maximum
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          pick(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
