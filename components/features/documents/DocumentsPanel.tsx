"use client";

import { FileText, RotateCcw, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/states";
import { useReadOnly } from "@/components/states/ReadOnly";
import { IconButton } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteDocument, pollDocumentStatuses, retryDocument } from "@/lib/actions/assets";
import type { DocumentConnaissance, IndexingStatus as Status } from "@/lib/data/types";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { useAction } from "@/lib/hooks/useAction";
import { formatBytes } from "@/lib/upload";
import { IndexingStatus, isSettling } from "./IndexingStatus";
import { UploadDocumentDialog, type DocumentScope } from "./UploadDocumentDialog";

export type DocumentRow = DocumentConnaissance & { fileName: string; sizeBytes: number; createdAt: string };

const POLL_MS = 3000;

/** Sonde le statut d'indexation tant qu'un document est en attente ou en cours ; s'arrête ensuite. */
function useLiveStatuses(documents: DocumentRow[]) {
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  // Nouvelle liste du serveur (ajout, réessai…) : elle fait foi, on oublie les statuts sondés.
  const [source, setSource] = useState(documents);
  if (source !== documents) {
    setSource(documents);
    setStatuses({});
  }
  const merged = useMemo(
    () => documents.map((d) => ({ ...d, statutIndexation: statuses[d.id] ?? d.statutIndexation })),
    [documents, statuses],
  );
  const settling = merged.some((d) => isSettling(d.statutIndexation));

  useEffect(() => {
    if (!settling) return;
    let cancelled = false;
    const timer = window.setInterval(async () => {
      const result = await pollDocumentStatuses();
      if (cancelled || !result.ok) return;
      setStatuses(Object.fromEntries(result.data.map((d) => [d.id, d.statutIndexation])));
    }, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [settling]);

  return merged;
}

type DocumentsPanelProps = {
  documents: DocumentRow[];
  /** Rattachement imposé pour les ajouts depuis cet écran (null = choisi dans la fenêtre). */
  scope: DocumentScope | null;
  services?: { id: string; label: string }[];
  procedures?: { id: string; label: string; serviceId: string }[];
  /** Nom lisible du rattachement de chaque document (page Documents). */
  describeAttachment?: (doc: DocumentRow) => string;
  title?: string;
  emptyHint?: string;
  bare?: boolean;
};

export function DocumentsPanel({
  documents,
  scope,
  services,
  procedures,
  describeAttachment,
  title = "Documents de référence",
  emptyHint = "Ajoutez un règlement, un guide ou une FAQ pour enrichir les réponses de l’assistant.",
  bare,
}: DocumentsPanelProps) {
  const router = useRouter();
  const { readOnly } = useReadOnly();
  const rows = useLiveStatuses(documents);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toDelete, setToDelete] = useState<DocumentRow | null>(null);
  const { run, pending } = useAction();
  const { run: runRetry, pending: retrying } = useAction();

  return (
    <section className={cn(!bare && "surface p-5 sm:p-6")}>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[17px] font-semibold text-text">{title}</h2>
          <p className="mt-0.5 text-[13px] text-muted">PDF uniquement, 10 Mo maximum. Indexés automatiquement pour l’assistant.</p>
        </div>
        {!readOnly && (
          <Button variant="secondary" size="sm" icon={<Upload className="size-3.5" />} onClick={() => setUploadOpen(true)}>
            Ajouter
          </Button>
        )}
      </header>

      {rows.length === 0 ? (
        <EmptyState icon={<FileText />} title="Aucun document" description={emptyHint} />
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 sm:flex-nowrap">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-soft text-violet">
                <FileText className="size-[18px]" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                {doc.fichierUrl ? (
                  <a
                    href={doc.fichierUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sm font-semibold text-text hover:text-green-ink hover:underline"
                  >
                    {doc.titre}
                  </a>
                ) : (
                  <p className="truncate text-sm font-semibold text-text">{doc.titre}</p>
                )}
                <p className="truncate text-xs text-muted">
                  {doc.type} · {formatBytes(doc.sizeBytes)} · ajouté le {formatDate(doc.createdAt, { day: "numeric", month: "short" })}
                  {describeAttachment && <> · {describeAttachment(doc)}</>}
                </p>
                {doc.statutIndexation === "erreur" && (
                  <p className="mt-1 text-xs text-danger">
                    L’indexation a échoué : l’assistant n’utilise pas encore ce document.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <IndexingStatus status={doc.statutIndexation} />
                {doc.statutIndexation === "erreur" && !readOnly && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={retrying}
                    icon={<RotateCcw className="size-3.5" />}
                    onClick={() =>
                      runRetry(() => retryDocument(doc.id), {
                        success: "Nouvelle tentative d’indexation lancée",
                        onSuccess: () => router.refresh(),
                      })
                    }
                  >
                    Réessayer
                  </Button>
                )}
                {!readOnly && (
                  <IconButton label={`Supprimer ${doc.titre}`} tone="danger" onClick={() => setToDelete(doc)}>
                    <Trash2 />
                  </IconButton>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {uploadOpen && (
        <UploadDocumentDialog
          open
          onClose={() => setUploadOpen(false)}
          scope={scope}
          services={services}
          procedures={procedures}
          onUploaded={() => router.refresh()}
        />
      )}
      <ConfirmDialog
        open={toDelete !== null}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          const result = await run(() => deleteDocument(toDelete.id), { success: "Document supprimé" });
          if (result.ok) setToDelete(null);
        }}
        loading={pending}
        tone="danger"
        title={`Supprimer « ${toDelete?.titre ?? ""} » ?`}
        description="L’assistant n’utilisera plus ce document pour répondre aux citoyens."
        confirmLabel="Supprimer"
      />
    </section>
  );
}
