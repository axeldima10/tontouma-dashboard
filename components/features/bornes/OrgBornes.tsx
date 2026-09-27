"use client";

import { Info, MapPin, MonitorSmartphone, Play } from "lucide-react";
import { useState } from "react";
import { StaggerItem, Stagger } from "@/components/motion/Motion";
import { PageHeader } from "@/components/shell/PageHeader";
import { useReadOnly } from "@/components/states/ReadOnly";
import { EmptyState } from "@/components/states/States";
import { SegmentBar, UsageMeter } from "@/components/ui/Metrics";
import { BornePill } from "@/components/ui/StatusPill";
import { setBorneStatus } from "@/lib/actions/content";
import type { Borne } from "@/lib/api/contract";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";
import { BorneStatusSelect } from "./BorneStatusSelect";
import { BorneTestDialog } from "./BorneTestDialog";
import { Button } from "@/components/ui/Button";

type OrgBornesProps = { bornes: Borne[]; limit: number | null; now: string };

/** Parc de bornes de l'organisation : état et statut. L'installation est gérée par l'équipe Tontouma. */
export function OrgBornes({ bornes, limit, now }: OrgBornesProps) {
  const { readOnly } = useReadOnly();
  const [testing, setTesting] = useState<Borne | null>(null);
  const count = (status: Borne["status"]) => bornes.filter((b) => b.status === status).length;

  return (
    <>
      <PageHeader kicker="Gestion" title="Bornes" description="Les bornes physiques où les citoyens interrogent l’assistant, et leur état." />

      <div className="mb-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="glass rounded-[26px] p-5">
          <p className="mb-4 text-sm font-semibold text-foreground">État du parc</p>
          <SegmentBar
            segments={[
              { label: "En service", value: count("ACTIVE"), className: "bg-brand" },
              { label: "Maintenance", value: count("MAINTENANCE"), className: "bg-[#f5a122]" },
              { label: "Hors service", value: count("HORS_SERVICE"), className: "bg-destructive" },
            ]}
          />
        </div>
        <div className="glass flex flex-col justify-center rounded-[26px] p-5">
          <UsageMeter label="Bornes du plan" used={bornes.length} limit={limit} icon={<MonitorSmartphone />} />
          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            L’installation d’une nouvelle borne se fait avec l’équipe Tontouma.
          </p>
        </div>
      </div>

      {bornes.length === 0 ? (
        <EmptyState
          size="page"
          icon={<MonitorSmartphone />}
          title="Aucune borne installée"
          description="Contactez l’équipe Tontouma pour installer une borne dans vos locaux : elle apparaîtra ici automatiquement."
        />
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {bornes.map((borne) => (
            <StaggerItem key={borne.id}>
              <article className="surface relative overflow-hidden p-5">
                <div className="flex items-start gap-4">
                  {/* Silhouette de borne */}
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        "grid h-16 w-12 place-items-center rounded-[14px] border-2 bg-gradient-to-b from-card to-accent",
                        borne.status === "ACTIVE" ? "border-brand/40" : borne.status === "MAINTENANCE" ? "border-[#f5a122]/50" : "border-destructive/40",
                      )}
                    >
                      <span className={cn("h-7 w-7 rounded-md", borne.status === "ACTIVE" ? "animate-pulse bg-brand/25" : "bg-foreground/10")} />
                    </div>
                    <div className="mx-auto h-3 w-2 bg-foreground/15" />
                    <div className="mx-auto h-1.5 w-8 rounded-full bg-foreground/15" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="tabular truncate text-[15px] font-semibold tracking-tight text-foreground">{borne.identifier}</p>
                    <p className="mt-1 flex items-center gap-1.5 truncate text-[13px] text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" aria-hidden />
                      {borne.location ?? "Emplacement non précisé"}
                    </p>
                    {borne.departmentName && <p className="mt-0.5 truncate text-xs text-subtle">{borne.departmentName}</p>}
                    <div className="mt-3">
                      <BornePill status={borne.status} />
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
                  <Button variant="ghost" size="sm" icon={<Play />} onClick={() => setTesting(borne)} title={`Mise à jour ${formatRelative(borne.updatedAt, new Date(now))}`}>
                    Tester
                  </Button>
                  <BorneStatusSelect borne={borne} disabled={readOnly} onChangeStatus={setBorneStatus} />
                </div>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      )}
      {testing && <BorneTestDialog key={testing.id} borne={testing} onClose={() => setTesting(null)} />}
    </>
  );
}
