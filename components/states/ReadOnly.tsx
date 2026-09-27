"use client";

import { ShieldAlert } from "lucide-react";
import { motion } from "motion/react";
import { createContext, use, type ReactNode } from "react";

export type ReadOnlyReason = "suspendue" | "abonnement" | null;

const ReadOnlyContext = createContext<ReadOnlyReason>(null);

/** Mode lecture seule détecté une fois (organisation suspendue / abonnement inactif). */
export function ReadOnlyProvider({ reason, children }: { reason: ReadOnlyReason; children: ReactNode }) {
  return <ReadOnlyContext value={reason}>{children}</ReadOnlyContext>;
}

/** Les formulaires lisent ce hook pour se désactiver proprement au lieu d'échouer en 403. */
export function useReadOnly(): { readOnly: boolean; reason: ReadOnlyReason } {
  const reason = use(ReadOnlyContext);
  return { readOnly: reason !== null, reason };
}

const COPY: Record<Exclude<ReadOnlyReason, null>, { title: string; body: string }> = {
  suspendue: {
    title: "Organisation suspendue · lecture seule",
    body: "L’équipe Tontouma a suspendu cette organisation. Vous pouvez consulter le contenu, mais aucune modification ni publication n’est possible. Contactez le support Tontouma pour la réactiver.",
  },
  abonnement: {
    title: "Abonnement inactif · lecture seule",
    body: "Les modifications et publications sont désactivées tant que l’abonnement n’est pas actif. Les citoyens continuent de voir le dernier contenu publié.",
  },
};

export function ReadOnlyBanner({ reason }: { reason: ReadOnlyReason }) {
  if (!reason) return null;
  const copy = COPY[reason];
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="mb-6 flex items-start gap-3 rounded-[22px] border border-warning/25 bg-card px-4 py-3.5 shadow-[var(--card-shadow)]"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-warning-soft text-warning">
        <ShieldAlert className="size-[18px]" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">{copy.title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{copy.body}</p>
      </div>
    </motion.div>
  );
}
