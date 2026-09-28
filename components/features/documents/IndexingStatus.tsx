import { StatusPill, type Tone } from "@/components/ui/StatusPill";
import type { IndexingStatus as Status } from "@/lib/data/types";

const STATUS: Record<Status, { tone: Tone; label: string; pulse?: boolean }> = {
  en_attente: { tone: "neutral", label: "En attente", pulse: true },
  en_cours: { tone: "info", label: "Indexation…", pulse: true },
  indexe: { tone: "success", label: "Indexé" },
  erreur: { tone: "danger", label: "Erreur" },
};

export function IndexingStatus({ status }: { status: Status }) {
  const s = STATUS[status];
  return (
    <StatusPill tone={s.tone} pulse={s.pulse}>
      {s.label}
    </StatusPill>
  );
}

export const isSettling = (status: Status) => status === "en_attente" || status === "en_cours";
