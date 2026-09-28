"use client";

import { useState } from "react";
import { Field, TextArea } from "@/components/forms/Fields";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { setOrganizationStatus } from "@/lib/actions/platform";
import type { AdminOrganizationRow } from "@/lib/data/types";
import { useAction } from "@/lib/hooks/useAction";

/** Suspendre ou réactiver : confirmation explicite et motif obligatoire (tracé côté backend). */
export function SuspendDialog({ organization, onClose }: { organization: AdminOrganizationRow; onClose: () => void }) {
  const { run, pending } = useAction();
  const [motif, setMotif] = useState("");
  const suspending = organization.statut === "active";

  return (
    <Dialog
      open
      onClose={onClose}
      title={suspending ? `Suspendre « ${organization.nom} » ?` : `Réactiver « ${organization.nom} » ?`}
      description={
        suspending
          ? "Son tableau de bord passe en lecture seule : plus aucune modification ni publication. Le contenu publié reste visible des citoyens."
          : "L’organisation retrouve l’accès complet à son tableau de bord."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button
            variant={suspending ? "danger" : "primary"}
            loading={pending}
            disabled={motif.trim().length < 3}
            onClick={async () => {
              const result = await run(() => setOrganizationStatus(organization.id, suspending ? "suspendue" : "active", motif), {
                success: suspending ? "Organisation suspendue" : "Organisation réactivée",
              });
              if (result.ok) onClose();
            }}
          >
            {suspending ? "Suspendre" : "Réactiver"}
          </Button>
        </>
      }
    >
      <Field label="Motif" required hint="Visible dans l’historique de l’organisation.">
        {(p) => (
          <TextArea
            {...p}
            rows={3}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            autoFocus
            placeholder={suspending ? "Abonnement impayé depuis 30 jours…" : "Régularisation du paiement…"}
          />
        )}
      </Field>
    </Dialog>
  );
}
