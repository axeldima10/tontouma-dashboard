"use client";

import { AnimatePresence, motion } from "motion/react";
import { BotMark } from "@/components/shell/BotMark";
import { formatNumber, formatXOF } from "@/lib/format";

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
  const missing: string[] = [];
  if (cost === null) missing.push("le coût");
  if (processingDays === null) missing.push("le délai");
  if (conditions.length === 0) missing.push("les conditions");
  if (documents.length === 0) missing.push("les pièces requises");

  return (
    <section className="glass overflow-hidden rounded-[28px]">
      <header className="flex items-center gap-3 border-b border-[var(--glass-border)] px-5 py-4">
        <BotMark size={34} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Ce que l’assistant dira</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`size-1.5 rounded-full ${published ? "bg-brand" : "bg-[#f5a122]"}`} />
            {published ? "Publié : visible des citoyens" : "Brouillon : invisible des citoyens"}
          </p>
        </div>
      </header>
      <div className="space-y-3 p-5">
        <motion.p layout className="ml-auto w-fit max-w-[85%] rounded-[20px] rounded-br-md bg-primary px-4 py-2.5 text-[13px] text-primary-foreground">
          Comment faire pour « {title || "cette démarche"} » ?
        </motion.p>
        <div className="flex items-end gap-2">
          <BotMark size={26} />
          <motion.div layout className="max-w-[88%] space-y-2 rounded-[20px] rounded-bl-md bg-card px-4 py-3 text-[13px] leading-relaxed text-foreground shadow-[var(--card-shadow)]">
            <p>
              {cost === null ? "Le coût n’est pas précisé" : cost === 0 ? "C’est gratuit" : <>Cela coûte <b>{formatXOF(cost)}</b></>}
              {processingDays === null ? "." : <>, avec un délai de <b>{formatNumber(processingDays)} jour{processingDays > 1 ? "s" : ""}</b>.</>}
              {place && ` Rendez-vous : ${place}.`}
            </p>
            <AnimatePresence initial={false}>
              {conditions.length > 0 && (
                <motion.div key="conditions" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <p className="font-semibold">Conditions :</p>
                  <ol className="mt-0.5 list-decimal space-y-0.5 pl-4 text-muted-foreground">
                    {conditions.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ol>
                </motion.div>
              )}
              {documents.length > 0 && (
                <motion.div key="documents" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <p className="font-semibold">À apporter :</p>
                  <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-muted-foreground">
                    {documents.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        {missing.length > 0 && (
          <p className="rounded-[16px] bg-warning-soft px-3.5 py-2.5 text-xs text-warning">
            À compléter pour une réponse complète : {missing.join(", ")}.
          </p>
        )}
      </div>
    </section>
  );
}
