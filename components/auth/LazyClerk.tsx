"use client";

import dynamic from "next/dynamic";

/**
 * Versions chargées à la demande : le code Clerk n'arrive dans le navigateur qu'en mode Clerk.
 * `ssr: false` évite aussi les erreurs d'hydratation : Clerk ne rend son conteneur qu'une fois chargé dans le navigateur.
 */
export const LazyClerkSignIn = dynamic(() => import("./ClerkWidgets").then((m) => m.ClerkSignIn), {
  ssr: false,
  loading: () => <span className="skeleton block h-[420px] w-full max-w-[400px] rounded-[1.2rem]" />,
});

export const LazyClerkOrgList = dynamic(() => import("./ClerkWidgets").then((m) => m.ClerkOrgList), {
  ssr: false,
  loading: () => <span className="skeleton block h-40 w-80 rounded-2xl" />,
});

export const LazyClerkUserButton = dynamic(() => import("./ClerkWidgets").then((m) => m.ClerkUserButton), {
  ssr: false,
  loading: () => <span className="skeleton block size-9 rounded-full" />,
});

export const LazyClerkOrgSwitcher = dynamic(() => import("./ClerkWidgets").then((m) => m.ClerkOrgSwitcher), {
  ssr: false,
  loading: () => <span className="skeleton block h-11 w-full rounded-2xl" />,
});

export const LazyClerkOrgInfoBridge = dynamic(() => import("./ClerkWidgets").then((m) => m.ClerkOrgInfoBridge), {
  ssr: false,
});

export const LazyClerkTokenSource = dynamic(() => import("./ClerkWidgets").then((m) => m.ClerkTokenSource), {
  ssr: false,
});
