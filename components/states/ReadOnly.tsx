"use client";

import { ShieldAlert } from "lucide-react";
import { createContext, use, useRef, type ReactNode } from "react";
import { gsap, useGSAP, MEDIA } from "@/lib/motion/gsap";

export type ReadOnlyReason = "suspendue" | "expire" | null;

const ReadOnlyContext = createContext<ReadOnlyReason>(null);

/** Mode lecture seule détecté une fois (organisation suspendue / abonnement expiré). */
export function ReadOnlyProvider({ reason, children }: { reason: ReadOnlyReason; children: ReactNode }) {
  return <ReadOnlyContext value={reason}>{children}</ReadOnlyContext>;
}

/** Les formulaires des phases suivantes lisent ce hook pour se désactiver proprement. */
export function useReadOnly(): { readOnly: boolean; reason: ReadOnlyReason } {
  const reason = use(ReadOnlyContext);
  return { readOnly: reason !== null, reason };
}

const COPY: Record<Exclude<ReadOnlyReason, null>, { title: string; body: string }> = {
  suspendue: {
    title: "Organisation suspendue — mode lecture seule",
    body: "L’équipe Tontouma a suspendu cette organisation. Vous pouvez consulter le contenu, mais aucune modification ni publication n’est possible. Contactez le support Tontouma pour la réactiver.",
  },
  expire: {
    title: "Abonnement expiré — mode lecture seule",
    body: "La publication et les modifications sont désactivées jusqu’au renouvellement. Les citoyens continuent de voir le dernier contenu publié.",
  },
};

export function ReadOnlyBanner({ reason }: { reason: ReadOnlyReason }) {
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
  );
}
