import { cookies } from "next/headers";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { AppShell } from "@/components/shell/AppShell";
import { ForbiddenState } from "@/components/states/States";
import { getSession } from "@/lib/auth/session";
import { isApiConfigured } from "@/lib/api/server";
import { SIDEBAR_COOKIE } from "@/lib/nav";

/** Double contrôle après le proxy : l'administration est réservée au personnel Tontouma. */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await getSession();
  if (!session?.isPlatformAdmin) {
    return (
      <main className="grid min-h-dvh place-items-center px-4 py-10">
        <ForbiddenState reason="platform" backHref="/dashboard" />
      </main>
    );
  }
  const cookieStore = await cookies();

  return (
    <SessionProvider session={session}>
      <AppShell variant="admin" basePath="/admin" isSuperAdmin={false} initialCollapsed={cookieStore.get(SIDEBAR_COOKIE)?.value === "1"}
        demo={!isApiConfigured()}>
        {children}
      </AppShell>
    </SessionProvider>
  );
}
