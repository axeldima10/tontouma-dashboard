"use client";

import dynamic from "next/dynamic";

/** Versions chargées à la demande : le code Clerk n'arrive dans le navigateur qu'en mode Clerk. */
export const LazyClerkUserButton = dynamic(() => import("./ClerkWidgets").then((m) => m.ClerkUserButton), {
  ssr: false,
<<<<<<< HEAD
  loading: () => <span className="skeleton block size-9 rounded-full" />,
=======
  loading: () => <span className="skeleton size-9 rounded-full" />,
>>>>>>> 939f032 (First Commit)
});

export const LazyClerkOrgSwitcher = dynamic(() => import("./ClerkWidgets").then((m) => m.ClerkOrgSwitcher), {
  ssr: false,
<<<<<<< HEAD
  loading: () => <span className="skeleton block h-11 w-full rounded-2xl" />,
=======
>>>>>>> 939f032 (First Commit)
});

export const LazyClerkOrgInfoBridge = dynamic(() => import("./ClerkWidgets").then((m) => m.ClerkOrgInfoBridge), {
  ssr: false,
});

export const LazyClerkTokenSource = dynamic(() => import("./ClerkWidgets").then((m) => m.ClerkTokenSource), {
  ssr: false,
});
