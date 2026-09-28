"use client";

/**
 * Tous les usages client de Clerk, regroupés pour être chargés à la demande (mode Clerk uniquement).
 * En mode dev, ce module n'est jamais téléchargé.
 */
import { OrganizationSwitcher, UserButton, useAuth, useOrganization } from "@clerk/nextjs";
import { useEffect, type ReactNode } from "react";

export function ClerkUserButton() {
<<<<<<< HEAD
  return <UserButton appearance={{ elements: { avatarBox: "size-9 ring-2 ring-white/70" } }} />;
=======
  return <UserButton appearance={{ elements: { avatarBox: "size-9" } }} />;
>>>>>>> 939f032 (First Commit)
}

export function ClerkOrgSwitcher() {
  return (
    <OrganizationSwitcher
      hidePersonal
      afterSelectOrganizationUrl="/dashboard/:id"
      afterCreateOrganizationUrl="/dashboard/:id"
<<<<<<< HEAD
      appearance={{
        elements: {
          rootBox: "w-full",
          organizationSwitcherTrigger: "w-full justify-between rounded-2xl px-2.5 py-2 hover:bg-[var(--accent)]",
        },
      }}
=======
      appearance={{ elements: { organizationSwitcherTrigger: "rounded-xl px-2 py-1.5" } }}
>>>>>>> 939f032 (First Commit)
    />
  );
}

<<<<<<< HEAD
export type ClerkOrgInfo = { loaded: boolean; name: string; imageUrl: string | null };

/** Transmet les infos d'organisation Clerk au rendu commun de la barre latérale. */
export function ClerkOrgInfoBridge({ children }: { children: (info: ClerkOrgInfo) => ReactNode }) {
  const { organization, isLoaded } = useOrganization();
  return children({
    loaded: isLoaded && Boolean(organization),
    name: organization?.name ?? "",
    imageUrl: organization?.hasImage ? organization.imageUrl : null,
=======
export type ClerkOrgInfo = { loaded: boolean; name: string; imageUrl: string | null; role: string | null };

/** Transmet les infos d'organisation Clerk au rendu commun de la barre latérale. */
export function ClerkOrgInfoBridge({ children }: { children: (info: ClerkOrgInfo) => ReactNode }) {
  const { organization, membership, isLoaded } = useOrganization();
  return children({
    loaded: isLoaded && Boolean(organization),
    name: organization?.name ?? "",
    imageUrl: organization?.imageUrl ?? null,
    role: membership?.role ?? null,
>>>>>>> 939f032 (First Commit)
  });
}

/** Fournit `getToken` de Clerk au contexte de session. */
export function ClerkTokenSource({ onReady }: { onReady: (getToken: () => Promise<string | null>) => void }) {
  const { getToken } = useAuth();
  useEffect(() => {
    onReady(() => getToken());
  }, [getToken, onReady]);
  return null;
}
