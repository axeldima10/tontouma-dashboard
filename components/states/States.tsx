"use client";

import { Compass, Lock, RefreshCw, ServerCrash, ShieldAlert, WifiOff } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import type { ErrorDescription } from "@/lib/api/errors";
import { cn } from "@/lib/cn";

type StatePanelProps = {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  tone?: "neutral" | "warning" | "danger" | "brand";
  size?: "page" | "inline";
  role?: "alert" | "status";
};

const ICON_TONE = {
  neutral: "text-foreground",
  warning: "text-warning",
  danger: "text-destructive",
  brand: "text-brand-ink",
};

/** Panneau d'état commun : icône flottante dans une bulle de verre, titre, explication, prochaine action. */
export function StatePanel({ icon, title, description, actions, tone = "neutral", size = "page", role }: StatePanelProps) {
  return (
    <motion.div
      role={role}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col items-center text-center",
        size === "page" ? "glass mx-auto max-w-xl rounded-[32px] px-6 py-14 sm:px-12" : "rounded-[22px] border border-dashed border-border-strong px-6 py-10",
      )}
    >
      <div className="relative mb-5">
        <span aria-hidden className="hatch absolute -inset-3 rounded-[26px] opacity-70" />
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className={cn("glass-strong relative grid size-16 place-items-center rounded-[22px] [&_svg]:size-7", ICON_TONE[tone])}
        >
          {icon}
        </motion.span>
      </div>
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</div>
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>}
    </motion.div>
  );
}

type EmptyStateProps = { icon: ReactNode; title: string; description: ReactNode; action?: ReactNode; size?: "page" | "inline" };

/** État vide : toujours accompagné de la prochaine action utile. */
export function EmptyState({ icon, title, description, action, size = "inline" }: EmptyStateProps) {
  return <StatePanel size={size} icon={icon} title={title} description={description} actions={action} tone="brand" />;
}

/** Bouton « Réessayer » : relit la page côté serveur (lecture seule, donc sans risque). */
export function RetryButton({ label = "Réessayer" }: { label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button variant="primary" icon={<RefreshCw />} loading={pending} onClick={() => startTransition(() => router.refresh())}>
      {label}
    </Button>
  );
}

const ERROR_ICONS: Partial<Record<ErrorDescription["kind"], ReactNode>> = {
  network: <WifiOff />,
  forbidden: <ShieldAlert />,
  notFound: <Compass />,
};

/** Erreur de lecture : ce qui s'est passé, et si réessayer est sans risque. */
export function ErrorState({ error, size = "page" }: { error: ErrorDescription; size?: "page" | "inline" }) {
  return (
    <StatePanel
      role="alert"
      size={size}
      tone={error.kind === "forbidden" ? "warning" : "danger"}
      icon={ERROR_ICONS[error.kind] ?? <ServerCrash />}
      title={error.title}
      description={
        <>
          {error.description}
          {!error.retryable && error.kind !== "forbidden" && error.kind !== "notFound" && (
            <span className="mt-2 block text-xs">Si le problème persiste, contactez le support Tontouma.</span>
          )}
        </>
      }
      actions={error.retryable ? <RetryButton /> : null}
    />
  );
}

type ForbiddenReason = "role" | "platform";

const FORBIDDEN_COPY: Record<ForbiddenReason, { title: string; description: string }> = {
  role: {
    title: "Réservé au super administrateur",
    description:
      "Cette page gère des éléments sensibles de l’organisation (bornes, abonnement). Demandez à votre super administrateur si vous avez besoin d’y accéder.",
  },
  platform: {
    title: "Espace réservé à l’équipe Tontouma",
    description:
      "L’administration de la plateforme est accessible uniquement au personnel Tontouma Bot. Votre espace se trouve dans le tableau de bord de votre organisation.",
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

/** Erreur inattendue d'un segment (error.tsx) : on propose de réessayer le rendu. */
export function RouteError({ retry }: { retry: () => void }) {
  return (
    <StatePanel
      role="alert"
      tone="danger"
      icon={<ServerCrash />}
      title="Cette page n’a pas pu s’afficher"
      description="Une erreur inattendue est survenue. Aucune donnée n’a été modifiée : vous pouvez réessayer sans risque."
      actions={
        <Button icon={<RefreshCw />} onClick={retry}>
          Réessayer
        </Button>
      }
    />
  );
}
