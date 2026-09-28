import type { Metadata } from "next";
import { OrganizationList } from "@clerk/nextjs";
import { redirect } from "next/navigation";
<<<<<<< HEAD
=======
import { Aurora } from "@/components/shell/Aurora";
>>>>>>> 939f032 (First Commit)
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
<<<<<<< HEAD
      <div className="glass flex w-full max-w-lg flex-col items-center rounded-[36px] px-6 py-12 text-center sm:px-10">
        <BotMark size={64} alive />
        <h1 className="mt-6 text-3xl font-light tracking-tight text-foreground">Choisissez votre organisation</h1>
        <p className="mt-2 text-sm text-muted-foreground">Le tableau de bord affiche uniquement les données de l’organisation active.</p>
=======
      <Aurora />
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <BotMark size={64} alive />
        <h1 className="font-display mt-6 text-2xl font-semibold text-text">Choisissez votre organisation</h1>
        <p className="mt-2 text-sm text-muted">
          Le tableau de bord affiche uniquement les données de l’organisation active.
        </p>
>>>>>>> 939f032 (First Commit)
        <div className="mt-8">
          <OrganizationList hidePersonal afterSelectOrganizationUrl="/dashboard/:id" afterCreateOrganizationUrl="/dashboard/:id" />
        </div>
        {session?.isPlatformAdmin && (
<<<<<<< HEAD
          <Button href="/admin" variant="secondary" className="mt-6">
=======
          <Button href="/admin" variant="ghost" className="mt-6">
>>>>>>> 939f032 (First Commit)
            Aller à l’administration Tontouma
          </Button>
        )}
      </div>
    </main>
  );
}
