"use client";

import { useRef } from "react";
import { BotMark } from "@/components/shell/BotMark";
import { formatNumber, formatXOF } from "@/lib/format";
import { gsap, useGSAP, MEDIA } from "@/lib/motion/gsap";

type AssistantPreviewProps = {
  title: string;
  cost: number | null;
  processingDays: number | null;
  place: string;
  conditions: string[];
  documents: string[];
  published: boolean;
};

/**
 * Aperçu de ce que l'assistant pourra dire à partir des champs structurés.
 * Purement illustratif : la formulation réelle est produite par le service IA.
 */
export function AssistantPreview({ title, cost, processingDays, place, conditions, documents, published }: AssistantPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const signature = [title, cost, processingDays, place, conditions.join("|"), documents.join("|")].join("§");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        gsap.fromTo(".preview-bubble", { opacity: 0.55 }, { opacity: 1, duration: 0.5 });
      });
      return () => mm.revert();
    },
    { dependencies: [signature], scope: ref },
  );

  const missing: string[] = [];
  if (cost === null) missing.push("le coût");
  if (processingDays === null) missing.push("le délai");
  if (conditions.length === 0) missing.push("les conditions");
  if (documents.length === 0) missing.push("les pièces requises");

  return (
    <div ref={ref} className="surface overflow-hidden">
      <div className="border-b border-line bg-surface-2 px-5 py-3">
        <p className="kicker">Ce que l’assistant dira</p>
        <p className="mt-0.5 text-xs text-muted">
          {published ? "Contenu publié : visible des citoyens." : "Brouillon : invisible des citoyens tant qu’il n’est pas publié."}
        </p>
      </div>
      <div className="space-y-3 p-5">
        <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-green px-3.5 py-2 text-[13px] text-on-green">
          Comment faire pour « {title || "cette démarche"} » ?
        </p>
        <div className="flex items-end gap-2">
          <BotMark size={26} />
          <div className="preview-bubble max-w-[88%] space-y-2 rounded-2xl rounded-bl-md border border-line bg-panel px-3.5 py-2.5 text-[13px] leading-relaxed text-text">
            <p>
              {cost === null ? "Le coût n’est pas précisé" : cost === 0 ? "C’est gratuit" : `Cela coûte ${formatXOF(cost)}`}
              {processingDays === null
                ? "."
                : `, avec un délai de ${formatNumber(processingDays)} jour${processingDays > 1 ? "s" : ""}.`}
              {place && ` Rendez-vous : ${place}.`}
            </p>
            {conditions.length > 0 && (
              <div>
                <p className="font-medium">Conditions :</p>
                <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-muted">
                  {conditions.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
            {documents.length > 0 && (
              <div>
                <p className="font-medium">À apporter :</p>
                <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-muted">
                  {documents.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        {missing.length > 0 && (
          <p className="rounded-xl bg-warning-soft px-3 py-2 text-xs text-warning">
            À compléter pour une réponse complète : {missing.join(", ")}.
          </p>
        )}
      </div>
    </div>
  );
}
