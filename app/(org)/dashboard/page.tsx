import type { Metadata } from "next";
import { OrganizationList } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Aurora } from "@/components/shell/Aurora";
import { BotMark } from "@/components/shell/BotMark";
import { Button } from "@/components/ui/Button";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Choisir une organisation" };

/** Point d'entrée : redirige vers l'organisation active, ou propose d'en choisir une. */
export default async function DashboardEntry() {
  const session = await getSession();
  if (session?.orgId) redirect(`/dashboard/${session.orgId}`);
  // Mode dev : le persona plateforme n'appartient à aucune organisation.
  if (session?.mode === "dev") redirect("/admin");

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <Aurora />
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <BotMark size={64} alive />
        <h1 className="font-display mt-6 text-2xl font-semibold text-text">Choisissez votre organisation</h1>
        <p className="mt-2 text-sm text-muted">
          Le tableau de bord affiche uniquement les données de l’organisation active.
        </p>
        <div className="mt-8">
          <OrganizationList hidePersonal afterSelectOrganizationUrl="/dashboard/:id" afterCreateOrganizationUrl="/dashboard/:id" />
        </div>
        {session?.isPlatformAdmin && (
          <Button href="/admin" variant="ghost" className="mt-6">
            Aller à l’administration Tontouma
          </Button>
        )}
      </div>
    </main>
  );
}
