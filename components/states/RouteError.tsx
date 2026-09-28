"use client";

import { ErrorState } from "./ErrorState";

/** Contenu des fichiers `error.tsx` : erreur inattendue, réessai sans risque (lecture seule). */
export function RouteError({ retry }: { retry: () => void }) {
  return (
    <ErrorState
      onRetry={retry}
      error={{
        title: "Cet écran n’a pas pu s’afficher",
        description: "Une erreur inattendue est survenue. Aucune modification n’a été enregistrée ; vous pouvez réessayer sans risque.",
        retryable: true,
      }}
    />
  );
}
