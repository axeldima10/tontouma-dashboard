import { SessionProvider } from "@/components/auth/SessionProvider";
import { Aurora } from "@/components/shell/Aurora";
import { AppShell } from "@/components/shell/AppShell";
import { ForbiddenState } from "@/components/states";
import { getSession } from "@/lib/auth/session";

/** Double contrôle après le proxy : l'administration est réservée au personnel Tontouma. */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await getSession();
  if (!session?.isPlatformAdmin) {
    return (
      <main className="grid min-h-dvh place-items-center px-4 py-10">
        <Aurora />
        <ForbiddenState reason="platform" backHref="/dashboard" />
      </main>
    );
  }

  return (
    <SessionProvider session={session}>
      <AppShell variant="admin" basePath="/admin" isSuperAdmin={false}>
        {children}
      </AppShell>
    </SessionProvider>
  );
}
