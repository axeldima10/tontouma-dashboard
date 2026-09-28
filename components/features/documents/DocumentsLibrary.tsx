"use client";

<<<<<<< HEAD
import { ClipboardType, ExternalLink, FileText, FileUp, Link2, Pencil, Power, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { useReadOnly } from "@/components/states/ReadOnly";
import { EmptyState } from "@/components/states/States";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ActionMenu, type MenuItem } from "@/components/ui/Menu";
import { UsageMeter } from "@/components/ui/Metrics";
import { Select } from "@/components/ui/Select";
import { ActivePill } from "@/components/ui/StatusPill";
import { MobileCard, MobileList, SearchField, Table, Td, Th, Toolbar } from "@/components/ui/Table";
import { Segmented } from "@/components/ui/Tabs";
import { deleteDocument, setDocumentActive } from "@/lib/actions/documents";
import type { KnowledgeDocument } from "@/lib/api/contract";
import { cn } from "@/lib/cn";
import { formatBytes, formatDate } from "@/lib/format";
import { useAction } from "@/lib/hooks/useAction";
import { EditDocumentDialog, TextDocumentDialog, UploadDialog } from "./DocumentDialogs";

type DocumentsLibraryProps = {
  basePath: string;
  documents: KnowledgeDocument[];
  /** Quota du plan (maxAiDocuments), si l'abonnement est connu. */
  limit: number | null;
  /** Démarches citées par `sourceProcedureId`, pour afficher un lien. */
  procedures: Record<string, { title: string; serviceId: string }>;
};

type StatusFilter = "all" | "active" | "inactive";
const ALL = "__all__";

function kindOf(doc: KnowledgeDocument): "PDF" | "Texte" | "Fichier" {
  const url = doc.fileUrl?.toLowerCase() ?? "";
  if (url.endsWith(".pdf") || url.includes(".pdf?")) return "PDF";
  if (url.endsWith(".txt") || url.includes(".txt?")) return "Texte";
  return "Fichier";
}

export function DocumentsLibrary({ basePath, documents, limit, procedures }: DocumentsLibraryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { readOnly } = useReadOnly();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [category, setCategory] = useState(ALL);
  const [dialog, setDialog] = useState<{ kind: "upload" | "text"; key: number } | null>(() =>
    searchParams.get("nouveau") === "fichier" && !readOnly ? { kind: "upload", key: Date.now() } : null,
  );
  const [editing, setEditing] = useState<KnowledgeDocument | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "delete" | "toggle"; doc: KnowledgeDocument } | null>(null);
  const { run, pending } = useAction();

  const categories = useMemo(() => [...new Set(documents.map((d) => d.category).filter((c): c is string => Boolean(c)))].sort(), [documents]);
  const visible = documents.filter(
    (d) =>
      (status === "all" || (status === "active" ? d.active : !d.active)) &&
      (category === ALL || d.category === category) &&
      (!query || `${d.title} ${d.source ?? ""} ${d.category ?? ""}`.toLowerCase().includes(query.toLowerCase())),
  );
  const atLimit = limit !== null && documents.length >= limit;
  const activeCount = documents.filter((d) => d.active).length;

  const closeDialog = () => {
    setDialog(null);
    if (searchParams.get("nouveau")) router.replace(`${basePath}/documents`);
  };

  const onConfirm = async () => {
    if (!confirm) return;
    const { doc } = confirm;
    const result =
      confirm.kind === "delete"
        ? await run(() => deleteDocument(doc.id), { success: "Document supprimé", successDescription: "L’assistant ne l’utilisera plus d’ici quelques minutes." })
        : await run(() => setDocumentActive(doc.id, !doc.active), {
            success: doc.active ? "Document désactivé" : "Document activé",
            successDescription: doc.active ? "L’assistant ne l’utilisera plus d’ici quelques minutes." : "L’assistant l’utilisera d’ici quelques minutes.",
          });
    if (result.ok) setConfirm(null);
  };

  const menuFor = (doc: KnowledgeDocument): MenuItem[] => [
    ...(doc.fileUrl ? [{ label: "Ouvrir le fichier", icon: <ExternalLink />, onSelect: () => window.open(doc.fileUrl!, "_blank", "noopener") }] : []),
    ...(!readOnly
      ? ([
          { label: "Modifier", icon: <Pencil />, onSelect: () => setEditing(doc) },
          { label: doc.active ? "Désactiver" : "Activer", icon: <Power />, onSelect: () => setConfirm({ kind: "toggle", doc }) },
          "separator",
          { label: "Supprimer", icon: <Trash2 />, tone: "danger", onSelect: () => setConfirm({ kind: "delete", doc }) },
        ] satisfies MenuItem[])
      : []),
  ];

  const createActions = !readOnly && (
    <>
      <Button variant="secondary" icon={<ClipboardType />} onClick={() => setDialog({ kind: "text", key: Date.now() })} disabled={atLimit}>
        Coller un texte
      </Button>
      <Button icon={<FileUp />} onClick={() => setDialog({ kind: "upload", key: Date.now() })} disabled={atLimit} title={atLimit ? "Limite du plan atteinte" : undefined}>
        Téléverser un PDF
      </Button>
    </>
  );
=======
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { FilterChips, SearchInput } from "@/components/ui/Bits";
import type { IndexingStatus } from "@/lib/data/types";
import { Reveal } from "@/lib/motion/Reveal";
import { DocumentsPanel, type DocumentRow } from "./DocumentsPanel";

type Attach = "tous" | "organisation" | "service" | "procedure";

const attachmentOf = (d: DocumentRow): Exclude<Attach, "tous"> =>
  d.procedure_id ? "procedure" : d.service_id ? "service" : "organisation";
type StatusFilter = "tous" | IndexingStatus;

type DocumentsLibraryProps = {
  documents: DocumentRow[];
  services: { id: string; label: string }[];
  procedures: { id: string; label: string; serviceId: string }[];
};

export function DocumentsLibrary({ documents, services, procedures }: DocumentsLibraryProps) {
  const [attach, setAttach] = useState<Attach>("tous");
  const [status, setStatus] = useState<StatusFilter>("tous");
  const [query, setQuery] = useState("");

  const serviceName = useMemo(() => new Map(services.map((s) => [s.id, s.label])), [services]);
  const procedureName = useMemo(() => new Map(procedures.map((p) => [p.id, p.label])), [procedures]);

  // Liste mémorisée : le panneau réinitialise son suivi d'indexation quand la liste change d'identité.
  const filtered = useMemo(
    () =>
      documents.filter((d) => {
        if (attach !== "tous" && attachmentOf(d) !== attach) return false;
        if (status === "en_cours" && !(d.statutIndexation === "en_cours" || d.statutIndexation === "en_attente")) return false;
        if (status !== "tous" && status !== "en_cours" && d.statutIndexation !== status) return false;
        const q = query.trim().toLowerCase();
        return !q || d.titre.toLowerCase().includes(q) || d.fileName.toLowerCase().includes(q);
      }),
    [documents, attach, status, query],
  );

  const count = (fn: (d: DocumentRow) => boolean) => documents.filter(fn).length;
>>>>>>> 939f032 (First Commit)

  return (
    <>
      <PageHeader
<<<<<<< HEAD
        kicker="Contenu"
        title="Base de connaissances"
        description="Règlements, guides et FAQ qui complètent les démarches. L’assistant s’en sert pour répondre aux questions plus larges."
        actions={createActions}
      />

      {limit !== null && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass mb-5 rounded-[22px] px-5 py-4">
          <UsageMeter label="Documents du plan" used={documents.length} limit={limit} icon={<FileText />} />
        </motion.div>
      )}

      {documents.length === 0 ? (
        <EmptyState
          size="page"
          icon={<FileText />}
          title="Aucun document de référence"
          description="Ajoutez un règlement, un guide ou une FAQ au format PDF, ou collez un texte. Les faits précis (coût, délai, pièces) restent dans les démarches."
          action={createActions}
        />
      ) : (
        <>
          <Toolbar>
            <Segmented
              aria-label="Filtrer par statut"
              value={status}
              onValueChange={setStatus}
              options={[
                { value: "all", label: "Tous", count: documents.length },
                { value: "active", label: "Actifs", count: activeCount },
                { value: "inactive", label: "Inactifs", count: documents.length - activeCount },
              ]}
            />
            {categories.length > 0 && (
              <Select
                size="sm"
                aria-label="Filtrer par catégorie"
                value={category}
                onValueChange={setCategory}
                className="w-48"
                options={[{ value: ALL, label: "Toutes les catégories" }, ...categories.map((c) => ({ value: c, label: c }))]}
              />
            )}
            <SearchField value={query} onChange={setQuery} placeholder="Rechercher un document…" className="w-full sm:ml-auto sm:w-72" />
          </Toolbar>

          {visible.length === 0 ? (
            <EmptyState icon={<FileText />} title="Aucun document ne correspond" description="Modifiez la recherche ou les filtres." />
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>Document</Th>
                    <Th>Catégorie</Th>
                    <Th>Taille</Th>
                    <Th>Ajouté le</Th>
                    <Th>Statut</Th>
                    <Th className="w-12">
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((doc, index) => (
                    <motion.tr
                      key={doc.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index, 12) * 0.03 }}
                      className="transition-colors last:[&>td]:border-b-0 hover:bg-accent/60"
                    >
                      <Td>
                        <DocTitle doc={doc} basePath={basePath} procedure={doc.sourceProcedureId ? procedures[doc.sourceProcedureId] : undefined} />
                      </Td>
                      <Td className="text-muted-foreground">{doc.category ?? "—"}</Td>
                      <Td className="tabular text-muted-foreground">{formatBytes(doc.fileSizeBytes)}</Td>
                      <Td className="whitespace-nowrap text-muted-foreground">{formatDate(doc.createdAt, { day: "numeric", month: "short", year: "numeric" })}</Td>
                      <Td>
                        <ActivePill active={doc.active} />
                      </Td>
                      <Td>
                        <ActionMenu label={`Actions pour ${doc.title}`} items={menuFor(doc)} />
                      </Td>
                    </motion.tr>
                  ))}
                </tbody>
              </Table>
              <MobileList>
                {visible.map((doc) => (
                  <MobileCard key={doc.id}>
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <DocTitle doc={doc} basePath={basePath} procedure={doc.sourceProcedureId ? procedures[doc.sourceProcedureId] : undefined} />
                      </div>
                      <ActionMenu label={`Actions pour ${doc.title}`} items={menuFor(doc)} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <ActivePill active={doc.active} />
                      <span>{doc.category ?? "Sans catégorie"}</span>·<span>{formatBytes(doc.fileSizeBytes)}</span>
                    </div>
                  </MobileCard>
                ))}
              </MobileList>
            </>
          )}
        </>
      )}

      {dialog?.kind === "upload" && <UploadDialog key={dialog.key} open onOpenChange={(open) => !open && closeDialog()} />}
      {dialog?.kind === "text" && <TextDocumentDialog key={dialog.key} open onOpenChange={(open) => !open && closeDialog()} />}
      {editing && <EditDocumentDialog key={editing.id} document={editing} onOpenChange={(open) => !open && setEditing(null)} />}

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        loading={pending}
        onConfirm={onConfirm}
        tone={confirm?.kind === "delete" ? "danger" : "neutral"}
        title={
          confirm?.kind === "delete"
            ? `Supprimer « ${confirm.doc.title} » ?`
            : confirm?.doc.active
              ? `Désactiver « ${confirm.doc.title} » ?`
              : `Activer « ${confirm?.doc.title ?? ""} » ?`
        }
        description={
          confirm?.kind === "delete"
            ? "Le fichier et son indexation seront supprimés : l’assistant ne s’en servira plus. Cette action est définitive."
            : confirm?.doc.active
              ? "L’assistant cessera de s’en servir. Le document reste dans la liste et peut être réactivé."
              : "L’assistant s’en servira de nouveau pour compléter ses réponses."
        }
        confirmLabel={confirm?.kind === "delete" ? "Supprimer" : confirm?.doc.active ? "Désactiver" : "Activer"}
      />
    </>
  );
}

function DocTitle({ doc, basePath, procedure }: { doc: KnowledgeDocument; basePath: string; procedure?: { title: string; serviceId: string } }) {
  const kind = kindOf(doc);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl text-[10px] font-bold tracking-wide",
          kind === "PDF" ? "bg-destructive-soft text-destructive" : "bg-info-soft text-info",
        )}
      >
        {kind === "Fichier" ? <FileText className="size-4" aria-hidden /> : kind === "PDF" ? "PDF" : "TXT"}
      </span>
      <div className="min-w-0">
        <p className={cn("truncate font-semibold", doc.active ? "text-foreground" : "text-muted-foreground")}>{doc.title}</p>
        <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          {procedure ? (
            <Link href={`${basePath}/services/${procedure.serviceId}/demarches/${doc.sourceProcedureId}`} className="inline-flex items-center gap-1 hover:text-foreground hover:underline">
              <Link2 className="size-3" aria-hidden /> {procedure.title}
            </Link>
          ) : (
            (doc.source ?? "Source non précisée")
          )}
        </p>
      </div>
    </div>
  );
}
=======
        title="Documents"
        description="Connaissances complémentaires de l’assistant : règlements, guides, FAQ. Chaque document est rattaché à l’organisation, un service ou une démarche."
      />
      <Reveal className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterChips
            label="Rattachement"
            value={attach}
            onChange={setAttach}
            chips={[
              { value: "tous", label: "Tous", count: documents.length },
              { value: "organisation", label: "Organisation", count: count((d) => attachmentOf(d) === "organisation") },
              { value: "service", label: "Services", count: count((d) => attachmentOf(d) === "service") },
              { value: "procedure", label: "Démarches", count: count((d) => attachmentOf(d) === "procedure") },
            ]}
          />
          <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un document…" label="Rechercher un document" />
        </div>
        <FilterChips
          label="Statut d’indexation"
          value={status}
          onChange={setStatus}
          chips={[
            { value: "tous", label: "Tous statuts" },
            { value: "indexe", label: "Indexés", count: count((d) => d.statutIndexation === "indexe") },
            { value: "en_cours", label: "En cours", count: count((d) => d.statutIndexation === "en_cours" || d.statutIndexation === "en_attente") },
            { value: "erreur", label: "En erreur", count: count((d) => d.statutIndexation === "erreur") },
          ]}
        />
        <DocumentsPanel
          documents={filtered}
          scope={null}
          services={services}
          procedures={procedures}
          title={filtered.length === documents.length ? "Tous les documents" : `${filtered.length} document(s) filtré(s)`}
          emptyHint={
            documents.length === 0
              ? "Ajoutez un premier document : règlement intérieur, guide ou FAQ."
              : "Aucun document ne correspond à ces filtres."
          }
          describeAttachment={(d) =>
            d.procedure_id
              ? `Démarche : ${procedureName.get(d.procedure_id) ?? "—"}`
              : d.service_id
                ? `Service : ${serviceName.get(d.service_id) ?? "—"}`
                : "Toute l’organisation"
          }
        />
      </Reveal>
    </>
  );
}
>>>>>>> 939f032 (First Commit)
