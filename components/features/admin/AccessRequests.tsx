"use client";

import { Check, Inbox, Mail, Phone, X } from "lucide-react";
import { useState } from "react";
import { Field, TextArea } from "@/components/forms/Fields";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/states";
import { FilterChips } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { StatusPill, type Tone } from "@/components/ui/StatusPill";
import { decideDemande } from "@/lib/actions/platform";
import type { DemandeAcces } from "@/lib/data/types";
import { formatRelative } from "@/lib/format";
import { useAction } from "@/lib/hooks/useAction";
import { Reveal } from "@/lib/motion/Reveal";

const STATUS: Record<DemandeAcces["statut"], { tone: Tone; label: string }> = {
  en_attente: { tone: "violet", label: "En attente" },
  approuvee: { tone: "success", label: "Approuvée" },
  rejetee: { tone: "neutral", label: "Refusée" },
};

export function AccessRequests({ demandes, now }: { demandes: DemandeAcces[]; now: string }) {
  const [filter, setFilter] = useState<DemandeAcces["statut"]>("en_attente");
  const [approve, setApprove] = useState<DemandeAcces | null>(null);
  const [reject, setReject] = useState<DemandeAcces | null>(null);
  const [motif, setMotif] = useState("");
  const { run, pending } = useAction();
  const rows = demandes.filter((d) => d.statut === filter);
  const count = (s: DemandeAcces["statut"]) => demandes.filter((d) => d.statut === s).length;

  return (
    <>
      <PageHeader title="Demandes d’accès" description="Organisations qui souhaitent rejoindre Tontouma Bot." />
      <Reveal className="space-y-4">
        <FilterChips
          label="Statut des demandes"
          value={filter}
          onChange={setFilter}
          chips={[
            { value: "en_attente", label: "En attente", count: count("en_attente") },
            { value: "approuvee", label: "Approuvées", count: count("approuvee") },
            { value: "rejetee", label: "Refusées", count: count("rejetee") },
          ]}
        />
        {rows.length === 0 ? (
          <EmptyState
            size="page"
            icon={<Inbox />}
            title={filter === "en_attente" ? "File d’attente vide" : "Aucune demande"}
            description={filter === "en_attente" ? "Toutes les demandes ont été traitées. Les nouvelles apparaîtront ici." : "Aucune demande avec ce statut."}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {rows.map((d) => (
              <article key={d.id} className="surface flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display truncate text-base font-semibold text-text">{d.nomOrganisation}</p>
                    <p className="text-xs text-muted">
                      {d.typeOrganisation ?? "Type non précisé"} · reçue {formatRelative(d.dateDemande, new Date(now))}
                    </p>
                  </div>
                  <StatusPill tone={STATUS[d.statut].tone}>{STATUS[d.statut].label}</StatusPill>
                </div>
                <ul className="mt-4 space-y-1.5 text-sm">
                  <li className="flex items-center gap-2 text-text">
                    <Mail className="size-4 text-muted" aria-hidden />
                    <a href={`mailto:${d.emailContact}`} className="hover:text-green-ink hover:underline">
                      {d.emailContact}
                    </a>
                  </li>
                  {d.telephoneContact && (
                    <li className="flex items-center gap-2 text-text">
                      <Phone className="size-4 text-muted" aria-hidden /> {d.telephoneContact}
                    </li>
                  )}
                </ul>
                {d.message && <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2.5 text-sm text-muted">« {d.message} »</p>}
                {d.statut === "en_attente" && (
                  <div className="mt-auto flex justify-end gap-2 pt-4">
                    <Button variant="secondary" size="sm" icon={<X className="size-3.5" />} onClick={() => setReject(d)}>
                      Refuser
                    </Button>
                    <Button size="sm" icon={<Check className="size-3.5" />} onClick={() => setApprove(d)}>
                      Approuver
                    </Button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </Reveal>

      <ConfirmDialog
        open={approve !== null}
        onCancel={() => setApprove(null)}
        onConfirm={async () => {
          if (!approve) return;
          const result = await run(() => decideDemande(approve.id, "approuvee", null), {
            success: "Demande approuvée",
            successDescription: `${approve.nomOrganisation} a été ajoutée aux organisations.`,
          });
          if (result.ok) setApprove(null);
        }}
        loading={pending}
        title={`Approuver « ${approve?.nomOrganisation ?? ""} » ?`}
        description="L’organisation est créée avec le plan d’entrée et son contact reçoit une invitation."
        confirmLabel="Approuver"
      />
      <Dialog
        open={reject !== null}
        onClose={() => setReject(null)}
        title={`Refuser « ${reject?.nomOrganisation ?? ""} » ?`}
        description="Le contact sera informé du refus et de son motif."
        footer={
          <>
            <Button variant="secondary" onClick={() => setReject(null)} disabled={pending}>
              Annuler
            </Button>
            <Button
              variant="danger"
              loading={pending}
              disabled={motif.trim().length < 3}
              onClick={async () => {
                if (!reject) return;
                const result = await run(() => decideDemande(reject.id, "rejetee", motif), { success: "Demande refusée" });
                if (result.ok) {
                  setReject(null);
                  setMotif("");
                }
              }}
            >
              Refuser
            </Button>
          </>
        }
      >
        <Field label="Motif du refus" required>
          {(p) => <TextArea {...p} rows={3} value={motif} onChange={(e) => setMotif(e.target.value)} autoFocus />}
        </Field>
      </Dialog>
    </>
  );
}
