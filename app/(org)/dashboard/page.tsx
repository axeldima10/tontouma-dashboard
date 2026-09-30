import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LazyClerkOrgList } from "@/components/auth/LazyClerk";
import { BotMark } from "@/components/shell/BotMark";
import { requireSession } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Choisir une organisation" };

/** Point d'entrée : redirige vers l'organisation active, ou propose d'en choisir une. */
export default async function DashboardEntry() {
  const session = await requireSession();
  // L'équipe Tontouma arrive sur l'administration (URL de retour après connexion).
  if (session.isPlatformAdmin) redirect("/admin");
  if (session.orgId) redirect(`/dashboard/${session.orgId}`);

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="glass flex w-full max-w-lg flex-col items-center rounded-[36px] px-6 py-12 text-center sm:px-10">
        <BotMark size={64} alive />
        <h1 className="mt-6 text-3xl font-light tracking-tight text-foreground">Choisissez votre organisation</h1>
        <p className="mt-2 text-sm text-muted-foreground">Le tableau de bord affiche uniquement les données de l’organisation active.</p>
        <div className="mt-8">
          <LazyClerkOrgList />
        </div>
      </div>
    </main>
  );
}
