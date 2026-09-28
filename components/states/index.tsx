import { Compass, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { StatePanel } from "./StatePanel";

type ForbiddenReason = "role" | "platform" | "subscription";

const FORBIDDEN_COPY: Record<ForbiddenReason, { title: string; description: string }> = {
  role: {
    title: "Réservé au super administrateur",
    description:
      "Cette page gère des éléments sensibles de l’organisation (membres, bornes, abonnement, paramètres). Demandez à votre super administrateur si vous avez besoin d’y accéder.",
  },
  platform: {
    title: "Espace réservé à l’équipe Tontouma",
    description:
      "L’administration de la plateforme est accessible uniquement au personnel Tontouma Bot. Votre espace se trouve dans le tableau de bord de votre organisation.",
  },
  subscription: {
    title: "Action indisponible avec l’abonnement actuel",
    description: "L’abonnement de votre organisation est expiré ou suspendu. Le contenu reste consultable en lecture seule.",
  },
};

export function ForbiddenState({ reason, backHref }: { reason: ForbiddenReason; backHref: string }) {
  const copy = FORBIDDEN_COPY[reason];
  return (
    <StatePanel
      role="alert"
      tone="warning"
      icon={<Lock />}
      title={copy.title}
      description={copy.description}
      actions={
        <Button href={backHref} variant="secondary">
          Retour au tableau de bord
        </Button>
      }
    />
  );
}

export function NotFoundState({ backHref }: { backHref: string }) {
  return (
    <StatePanel
      tone="neutral"
      icon={<Compass />}
      title="Page introuvable"
      description="Cette page n’existe pas ou n’appartient pas à votre organisation active."
      actions={
        <Button href={backHref} variant="secondary">
          Retour au tableau de bord
        </Button>
      }
    />
  );
}

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  size?: "page" | "inline";
};

/** État vide : toujours accompagné de la prochaine action utile. */
export function EmptyState({ icon, title, description, action, size = "inline" }: EmptyStateProps) {
  return <StatePanel size={size} icon={icon} title={title} description={description} actions={action} />;
}
