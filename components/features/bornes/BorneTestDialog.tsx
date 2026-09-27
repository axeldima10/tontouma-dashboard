"use client";

import { Clock, Loader2, MapPin, MonitorSmartphone, RefreshCw, WifiOff } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { BotMark } from "@/components/shell/BotMark";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { BornePill } from "@/components/ui/StatusPill";
import { testPublicBorne, type BorneTest } from "@/lib/actions/public";
import type { Borne } from "@/lib/api/contract";
import { summarizeOpeningHours } from "@/lib/format";

/** Simule le démarrage de la borne : ce qu'elle reçoit de `GET /public/bornes/{id}`. */
export function BorneTestDialog({ borne, onClose }: { borne: Borne; onClose: () => void }) {
  const [result, setResult] = useState<BorneTest | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void testPublicBorne(borne.id).then((r) => !cancelled && setResult(r));
    return () => {
      cancelled = true;
    };
  }, [borne.id, attempt]);

  const retry = () => {
    setResult(null);
    setAttempt((a) => a + 1);
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      icon={<MonitorSmartphone />}
      title={`Tester ${borne.identifier}`}
      description="Ce que la borne reçoit au démarrage (endpoint public, sans jeton)."
      footer={
        <>
          <Button variant="secondary" icon={<RefreshCw />} onClick={retry} disabled={result === null}>
            Relancer
          </Button>
          <Button onClick={onClose}>Fermer</Button>
        </>
      }
    >
      <div className="rounded-[26px] bg-primary p-2">
        <div className="min-h-64 rounded-[20px] bg-background p-5">
          {result === null ? (
            <div className="flex h-56 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="size-6 animate-spin" aria-hidden /> Démarrage de la borne…
            </div>
          ) : result.ok ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 text-center">
              <div className="flex justify-center">
                <Avatar name={result.borne.organization.name} imageUrl={result.borne.organization.logoUrl} size={64} square />
              </div>
              <div>
                <p className="text-xl font-light tracking-tight text-foreground">{result.borne.organization.name}</p>
                <p className="text-sm text-muted-foreground">{result.borne.organization.type}</p>
              </div>
              <div className="flex justify-center">
                <BornePill status={result.borne.status} />
              </div>
              <ul className="mx-auto max-w-xs space-y-1 text-xs text-muted-foreground">
                {result.borne.location && (
                  <li className="flex items-center justify-center gap-1.5">
                    <MapPin className="size-3.5" aria-hidden /> {result.borne.location}
                  </li>
                )}
                <li className="flex items-center justify-center gap-1.5">
                  <Clock className="size-3.5" aria-hidden /> {summarizeOpeningHours(result.borne.organization.openingHours)}
                </li>
              </ul>
              <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-card px-4 py-2 text-sm text-foreground shadow-[var(--card-shadow)]">
                <BotMark size={24} /> Bonjour ! Comment puis-je vous aider ?
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-56 flex-col items-center justify-center gap-3 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-destructive-soft text-destructive">
                <WifiOff className="size-6" aria-hidden />
              </span>
              <p className="font-semibold text-foreground">{result.kind === "notFound" ? "La borne ne démarre pas" : result.title}</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {result.kind === "notFound"
                  ? "Réponse 404 : la borne est hors service, inconnue, ou son organisation est désactivée. Les citoyens voient un écran d’indisponibilité."
                  : result.message}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
