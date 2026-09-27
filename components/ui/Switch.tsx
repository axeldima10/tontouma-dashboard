"use client";

import { Switch as S } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Interrupteur façon iOS, piste verte quand actif. */
export function Switch({ className, ...props }: ComponentProps<typeof S.Root>) {
  return (
    <S.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent p-0.5 transition-colors duration-300",
        "bg-[color-mix(in_srgb,var(--foreground)_16%,transparent)] data-[state=checked]:bg-brand",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <S.Thumb
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-white shadow-[0_2px_6px_#15232e40] transition-transform duration-300 ease-[var(--ease-spring)]",
          "data-[state=checked]:translate-x-5",
        )}
      />
    </S.Root>
  );
}
