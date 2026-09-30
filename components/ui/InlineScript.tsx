"use client";

/**
 * Script exécuté pendant l'analyse du HTML (avant le premier affichage).
 * Côté client, React ne l'exécute jamais : `text/plain` évite l'avertissement « script tag » en développement.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
