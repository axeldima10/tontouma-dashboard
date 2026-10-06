"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/observability/report";
import "./globals.css";

/** Dernier filet : erreur dans le layout racine. Remplace toute la page, donc il porte ses propres <html> et <body>. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="grid min-h-dvh place-items-center bg-background px-4 text-foreground">
        <main className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Une erreur inattendue est survenue</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            L’équipe Tontouma a été prévenue. Rechargez la page ; vos données publiées ne sont pas affectées.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Recharger la page
          </button>
        </main>
      </body>
    </html>
  );
}
