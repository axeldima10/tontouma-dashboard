"use client";

import { ShieldAlert } from "lucide-react";
<<<<<<< HEAD
import { motion } from "motion/react";
import { createContext, use, type ReactNode } from "react";

export type ReadOnlyReason = "suspendue" | "abonnement" | null;

const ReadOnlyContext = createContext<ReadOnlyReason>(null);

/** Mode lecture seule détecté une fois (organisation suspendue / abonnement inactif). */
=======
import { createContext, use, useRef, type ReactNode } from "react";
import { gsap, useGSAP, MEDIA } from "@/lib/motion/gsap";

export type ReadOnlyReason = "suspendue" | "expire" | null;

const ReadOnlyContext = createContext<ReadOnlyReason>(null);

/** Mode lecture seule détecté une fois (organisation suspendue / abonnement expiré). */
>>>>>>> 939f032 (First Commit)
export function ReadOnlyProvider({ reason, children }: { reason: ReadOnlyReason; children: ReactNode }) {
  return <ReadOnlyContext value={reason}>{children}</ReadOnlyContext>;
}

<<<<<<< HEAD
/** Les formulaires lisent ce hook pour se désactiver proprement au lieu d'échouer en 403. */
=======
/** Les formulaires des phases suivantes lisent ce hook pour se désactiver proprement. */
>>>>>>> 939f032 (First Commit)
export function useReadOnly(): { readOnly: boolean; reason: ReadOnlyReason } {
  const reason = use(ReadOnlyContext);
  return { readOnly: reason !== null, reason };
}

const COPY: Record<Exclude<ReadOnlyReason, null>, { title: string; body: string }> = {
  suspendue: {
<<<<<<< HEAD
    title: "Organisation suspendue · lecture seule",
    body: "L’équipe Tontouma a suspendu cette organisation. Vous pouvez consulter le contenu, mais aucune modification ni publication n’est possible. Contactez le support Tontouma pour la réactiver.",
  },
  abonnement: {
    title: "Abonnement inactif · lecture seule",
    body: "Les modifications et publications sont désactivées tant que l’abonnement n’est pas actif. Les citoyens continuent de voir le dernier contenu publié.",
=======
    title: "Organisation suspendue — mode lecture seule",
    body: "L’équipe Tontouma a suspendu cette organisation. Vous pouvez consulter le contenu, mais aucune modification ni publication n’est possible. Contactez le support Tontouma pour la réactiver.",
  },
  expire: {
    title: "Abonnement expiré — mode lecture seule",
    body: "La publication et les modifications sont désactivées jusqu’au renouvellement. Les citoyens continuent de voir le dernier contenu publié.",
>>>>>>> 939f032 (First Commit)
  },
};

export function ReadOnlyBanner({ reason }: { reason: ReadOnlyReason }) {
<<<<<<< HEAD
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
=======
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        gsap.from(ref.current, { y: -12, autoAlpha: 0, duration: 0.6, delay: 0.3 });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  if (!reason) return null;
  const copy = COPY[reason];
  return (
    <div
      ref={ref}
      role="status"
      className="mb-6 flex items-start gap-3 rounded-2xl border border-warning/35 bg-warning-soft px-4 py-3.5 text-warning"
    >
      <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div>
        <p className="text-sm font-semibold">{copy.title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-text/80">{copy.body}</p>
      </div>
    </div>
>>>>>>> 939f032 (First Commit)
  );
}
