"use client";

/**
 * Tous les usages client de Clerk, regroupés pour être chargés à la demande (mode Clerk uniquement).
 * En mode dev, ce module n'est jamais téléchargé.
 */
import { OrganizationSwitcher, UserButton, useAuth, useOrganization } from "@clerk/nextjs";
import { useEffect, type ReactNode } from "react";

export function ClerkUserButton() {
  return <UserButton appearance={{ elements: { avatarBox: "size-9" } }} />;
}

export function ClerkOrgSwitcher() {
  return (
    <OrganizationSwitcher
      hidePersonal
      afterSelectOrganizationUrl="/dashboard/:id"
      afterCreateOrganizationUrl="/dashboard/:id"
      appearance={{ elements: { organizationSwitcherTrigger: "rounded-xl px-2 py-1.5" } }}
    />
  );
}

export type ClerkOrgInfo = { loaded: boolean; name: string; imageUrl: string | null; role: string | null };

/** Transmet les infos d'organisation Clerk au rendu commun de la barre latérale. */
export function ClerkOrgInfoBridge({ children }: { children: (info: ClerkOrgInfo) => ReactNode }) {
  const { organization, membership, isLoaded } = useOrganization();
  return children({
    loaded: isLoaded && Boolean(organization),
    name: organization?.name ?? "",
    imageUrl: organization?.imageUrl ?? null,
    role: membership?.role ?? null,
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
