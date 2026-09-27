"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Select";
import { BORNE_STATUS_LABEL } from "@/components/ui/StatusPill";
import type { ActionResult } from "@/lib/actions/result";
import { BORNE_STATUSES, type Borne, type BorneStatus } from "@/lib/api/contract";
import { useAction } from "@/lib/hooks/useAction";

type BorneStatusSelectProps = {
  borne: Borne;
  disabled?: boolean;
  onChangeStatus: (id: string, status: BorneStatus) => Promise<ActionResult<Borne>>;
};

const DESCRIPTIONS: Record<BorneStatus, string> = {
  ACTIVE: "La borne accueille de nouveau les citoyens.",
  MAINTENANCE: "La borne est signalée en maintenance : les citoyens sont invités à revenir plus tard.",
  HORS_SERVICE: "La borne est signalée hors service jusqu’à sa remise en marche.",
};

/** Changement de statut d'une borne, confirmé (il se voit sur place). */
export function BorneStatusSelect({ borne, disabled, onChangeStatus }: BorneStatusSelectProps) {
  const [target, setTarget] = useState<BorneStatus | null>(null);
  const { run, pending } = useAction();

  return (
    <>
      <Select
        size="sm"
        aria-label={`Statut de ${borne.identifier}`}
        value={borne.status}
        disabled={disabled}
        onValueChange={(value) => value !== borne.status && setTarget(value as BorneStatus)}
        options={BORNE_STATUSES.map((s) => ({ value: s, label: BORNE_STATUS_LABEL[s] }))}
        className="w-40"
      />
      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        loading={pending}
        tone={target === "ACTIVE" ? "publish" : "neutral"}
        title={target ? `Passer ${borne.identifier} en « ${BORNE_STATUS_LABEL[target]} » ?` : ""}
        description={target ? DESCRIPTIONS[target] : ""}
        confirmLabel="Confirmer"
        onConfirm={async () => {
          if (!target) return;
          const result = await run(() => onChangeStatus(borne.id, target), { success: `Statut mis à jour : ${BORNE_STATUS_LABEL[target]}` });
          if (result.ok) setTarget(null);
        }}
      />
    </>
  );
}
