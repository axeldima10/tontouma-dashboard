"use client";

import { ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/states";
import { FilterChips, SearchInput } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import type { AdminOrganizationRow } from "@/lib/data/types";
import { formatDate, formatNumber } from "@/lib/format";
import { Reveal } from "@/lib/motion/Reveal";
import { SuspendDialog } from "./SuspendDialog";

type StatusFilter = "toutes" | "active" | "suspendue";

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export function OrganizationsTable({ organizations }: { organizations: AdminOrganizationRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("toutes");
  const [target, setTarget] = useState<AdminOrganizationRow | null>(null);

  const rows = useMemo(() => {
    const q = normalize(query.trim());
    return organizations.filter(
      (o) => (status === "toutes" || o.statut === status) && (!q || normalize(`${o.nom} ${o.type}`).includes(q)),
    );
  }, [organizations, query, status]);

  return (
    <>
      <PageHeader title="Organisations" description="Les structures clientes de Tontouma Bot." />
      <Reveal className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterChips
            label="Statut"
            value={status}
            onChange={setStatus}
            chips={[
              { value: "toutes", label: "Toutes", count: organizations.length },
              { value: "active", label: "Actives", count: organizations.filter((o) => o.statut === "active").length },
              { value: "suspendue", label: "Suspendues", count: organizations.filter((o) => o.statut === "suspendue").length },
            ]}
          />
          <SearchInput value={query} onChange={setQuery} placeholder="Rechercher une organisation…" label="Rechercher une organisation" />
        </div>

        <Card className="p-0 sm:p-0">
          {rows.length === 0 ? (
            <EmptyState
              icon={<Building2 />}
              title={organizations.length === 0 ? "Aucune organisation" : "Aucun résultat"}
              description={
                organizations.length === 0
                  ? "Les organisations apparaissent ici après approbation de leur demande d’accès."
                  : "Modifiez la recherche ou le filtre de statut."
              }
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-[11px] tracking-[0.1em] text-muted uppercase">
                      <th scope="col" className="px-5 py-3.5 font-medium">Organisation</th>
                      <th scope="col" className="px-3 py-3.5 font-medium">Plan</th>
                      <th scope="col" className="px-3 py-3.5 text-right font-medium">Bornes</th>
                      <th scope="col" className="px-3 py-3.5 text-right font-medium">Membres</th>
                      <th scope="col" className="px-3 py-3.5 font-medium">Créée le</th>
                      <th scope="col" className="px-3 py-3.5 font-medium">Statut</th>
                      <th scope="col" className="px-5 py-3.5 text-right font-medium">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {rows.map((o) => (
                      <tr key={o.id} className="group transition-colors hover:bg-surface-2">
                        <td className="px-5 py-3.5">
                          <Link href={`/admin/organisations/${o.id}`} className="font-semibold text-text hover:text-green-ink">
                            {o.nom}
                          </Link>
                          <p className="text-xs text-muted">{o.type}</p>
                        </td>
                        <td className="px-3 py-3.5 text-muted">{o.plan ?? "—"}</td>
                        <td className="tabular px-3 py-3.5 text-right text-text">{formatNumber(o.bornes)}</td>
                        <td className="tabular px-3 py-3.5 text-right text-text">{formatNumber(o.membres)}</td>
                        <td className="px-3 py-3.5 text-muted">{formatDate(o.dateCreation, { day: "numeric", month: "short", year: "numeric" })}</td>
                        <td className="px-3 py-3.5">
                          <StatusPill tone={o.statut === "active" ? "success" : "danger"}>{o.statut === "active" ? "Active" : "Suspendue"}</StatusPill>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant={o.statut === "active" ? "ghost" : "secondary"} size="sm" onClick={() => setTarget(o)}>
                              {o.statut === "active" ? "Suspendre" : "Réactiver"}
                            </Button>
                            <Link
                              href={`/admin/organisations/${o.id}`}
                              aria-label={`Voir ${o.nom}`}
                              className="grid size-8 place-items-center rounded-lg text-subtle hover:bg-surface-3 hover:text-green-ink"
                            >
                              <ArrowRight className="size-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="divide-y divide-line md:hidden">
                {rows.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 p-4">
                    <Link href={`/admin/organisations/${o.id}`} className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text">{o.nom}</p>
                      <p className="truncate text-xs text-muted">
                        {o.type} · {o.plan ?? "—"} · {o.bornes} borne(s)
                      </p>
                    </Link>
                    <StatusPill tone={o.statut === "active" ? "success" : "danger"}>{o.statut === "active" ? "Active" : "Suspendue"}</StatusPill>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </Reveal>
      {target && <SuspendDialog organization={target} onClose={() => setTarget(null)} />}
    </>
  );
}
