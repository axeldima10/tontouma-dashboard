"use client";

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

  return (
    <>
      <PageHeader
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
