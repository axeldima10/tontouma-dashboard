import type { Metadata } from "next";
import { Aurora } from "@/components/shell/Aurora";
import { ForbiddenState } from "@/components/states";

export const metadata: Metadata = { title: "Accès refusé" };

/** Cible de la réécriture du proxy pour /admin sans la claim plateforme. */
export default function AccessDeniedPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <Aurora />
      <ForbiddenState reason="platform" backHref="/dashboard" />
    </main>
  );
}
