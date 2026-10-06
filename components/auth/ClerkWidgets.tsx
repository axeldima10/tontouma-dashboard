"use client";

/**
 * Tous les usages client de Clerk, regroupés pour être chargés à la demande (mode Clerk uniquement).
 * En mode dev, ce module n'est jamais téléchargé.
 */
import { OrganizationList, OrganizationSwitcher, SignIn, UserButton, useAuth, useClerk, useOrganization } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { backendJwtTemplate } from "@/lib/auth/token";

export function ClerkSignIn() {
  return <SignIn />;
}

export function ClerkOrgList() {
  return <OrganizationList hidePersonal afterSelectOrganizationUrl="/dashboard/:id" />;
}

export function ClerkUserButton() {
  return <UserButton appearance={{ elements: { avatarBox: "size-9 ring-2 ring-white/70" } }} />;
}

/** Déconnexion directe, sans passer par le menu de l'avatar. */
export function ClerkSignOutButton({ className }: { className?: string }) {
  const { signOut } = useClerk();
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void signOut({ redirectUrl: "/sign-in" }).catch(() => setPending(false));
      }}
      className={className}
      aria-label="Se déconnecter"
    >
      <LogOut className="size-4" aria-hidden />
    </button>
  );
}

export function ClerkOrgSwitcher() {
  return (
    <OrganizationSwitcher
      hidePersonal
      afterSelectOrganizationUrl="/dashboard/:id"
      appearance={{
        elements: {
          rootBox: "w-full",
          organizationSwitcherTrigger: "w-full justify-between rounded-2xl px-2.5 py-2 hover:bg-[var(--accent)]",
        },
      }}
    />
  );
}

export type ClerkOrgInfo = { loaded: boolean; name: string; imageUrl: string | null };

/** Transmet les infos d'organisation Clerk au rendu commun de la barre latérale. */
export function ClerkOrgInfoBridge({ children }: { children: (info: ClerkOrgInfo) => ReactNode }) {
  const { organization, isLoaded } = useOrganization();
  return children({
    loaded: isLoaded && Boolean(organization),
    name: organization?.name ?? "",
    imageUrl: organization?.hasImage ? organization.imageUrl : null,
  });
}

/** Fournit `getToken` de Clerk au contexte de session. */
export function ClerkTokenSource({ onReady }: { onReady: (getToken: () => Promise<string | null>) => void }) {
  const { getToken } = useAuth();
  useEffect(() => {
    const template = backendJwtTemplate();
    onReady(() => getToken(template ? { template } : undefined));
  }, [getToken, onReady]);
  return null;
}
