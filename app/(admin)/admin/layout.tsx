<<<<<<< HEAD
import { cookies } from "next/headers";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { AppShell } from "@/components/shell/AppShell";
import { ForbiddenState } from "@/components/states/States";
import { getSession } from "@/lib/auth/session";
import { isApiConfigured } from "@/lib/api/server";
import { SIDEBAR_COOKIE } from "@/lib/nav";
=======
import { SessionProvider } from "@/components/auth/SessionProvider";
import { Aurora } from "@/components/shell/Aurora";
import { AppShell } from "@/components/shell/AppShell";
import { ForbiddenState } from "@/components/states";
import { getSession } from "@/lib/auth/session";
>>>>>>> 939f032 (First Commit)

/** Double contrôle après le proxy : l'administration est réservée au personnel Tontouma. */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await getSession();
  if (!session?.isPlatformAdmin) {
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
<<<<<<< HEAD
  const cookieStore = await cookies();

  return (
    <SessionProvider session={session}>
      <AppShell variant="admin" basePath="/admin" isSuperAdmin={false} initialCollapsed={cookieStore.get(SIDEBAR_COOKIE)?.value === "1"}
        demo={!isApiConfigured()}>
=======

  return (
    <SessionProvider session={session}>
      <AppShell variant="admin" basePath="/admin" isSuperAdmin={false}>
>>>>>>> 939f032 (First Commit)
        {children}
      </AppShell>
    </SessionProvider>
  );
}
