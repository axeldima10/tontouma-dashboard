"use client";

import { CloudOff, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import type { ErrorDescription } from "@/lib/api/errors";
import { StatePanel } from "./StatePanel";

type ErrorStateProps = {
  error: ErrorDescription;
  size?: "page" | "inline";
  /** Réessai personnalisé ; par défaut, rafraîchit les données serveur de la route. */
  onRetry?: () => void;
};

/** Dit ce qui s'est passé et si réessayer est sans risque. */
export function ErrorState({ error, size = "page", onRetry }: ErrorStateProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <StatePanel
      role="alert"
      size={size}
      tone={error.retryable ? "danger" : "warning"}
      icon={<CloudOff />}
      title={error.title}
      description={error.description}
      actions={
        error.retryable && (
          <Button
            variant="secondary"
            loading={pending}
            icon={<RotateCcw className="size-4" />}
            onClick={() => (onRetry ? onRetry() : startTransition(() => router.refresh()))}
          >
            Réessayer
          </Button>
        )
      }
    />
  );
}
