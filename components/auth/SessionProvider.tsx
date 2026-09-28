"use client";

import { createContext, use, useCallback, useMemo, useRef, type ReactNode } from "react";
import type { Session } from "@/lib/auth/types";
import { LazyClerkTokenSource } from "./LazyClerk";

type SessionContextValue = {
  session: Session;
<<<<<<< HEAD
  /** Jeton frais pour le backend, demandé juste avant chaque requête (null en mode dev). Jamais stocké. */
=======
  /** Jeton frais pour le backend, demandé juste avant chaque requête (null en mode dev). */
>>>>>>> 939f032 (First Commit)
  getToken: () => Promise<string | null>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ session, children }: { session: Session; children: ReactNode }) {
  // En mode Clerk, la source du jeton arrive avec le module Clerk chargé à la demande.
  const clerkGetToken = useRef<(() => Promise<string | null>) | null>(null);
  const onReady = useCallback((getToken: () => Promise<string | null>) => {
    clerkGetToken.current = getToken;
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      getToken: async () => (session.mode === "clerk" && clerkGetToken.current ? clerkGetToken.current() : null),
    }),
    [session],
  );

  return (
    <SessionContext value={value}>
      {session.mode === "clerk" && <LazyClerkTokenSource onReady={onReady} />}
      {children}
    </SessionContext>
  );
}

export function useSession(): SessionContextValue {
  const context = use(SessionContext);
  if (!context) throw new Error("useSession doit être utilisé dans <SessionProvider>");
  return context;
}
