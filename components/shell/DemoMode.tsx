"use client";

import { createContext, use, type ReactNode } from "react";

const DemoModeContext = createContext(false);

/** Indique aux composants client que les données viennent du backend fictif (DATA_SOURCE=mock). */
export function DemoModeProvider({ demo, children }: { demo: boolean; children: ReactNode }) {
  return <DemoModeContext value={demo}>{children}</DemoModeContext>;
}

export function useDemoMode(): boolean {
  return use(DemoModeContext);
}
