import type { Metadata } from "next";
<<<<<<< HEAD
import { ForbiddenState } from "@/components/states/States";
=======
import { Aurora } from "@/components/shell/Aurora";
import { ForbiddenState } from "@/components/states";
>>>>>>> 939f032 (First Commit)

export const metadata: Metadata = { title: "Accès refusé" };

/** Cible de la réécriture du proxy pour /admin sans la claim plateforme. */
export default function AccessDeniedPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
<<<<<<< HEAD
=======
      <Aurora />
>>>>>>> 939f032 (First Commit)
      <ForbiddenState reason="platform" backHref="/dashboard" />
    </main>
  );
}
