import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { StateArt, type StateTone } from "./StateArt";

type StatePanelProps = {
  icon: ReactNode;
  tone?: StateTone;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  /** "page" occupe la zone de contenu ; "inline" s'insère dans une carte. */
  size?: "page" | "inline";
  role?: "alert" | "status";
  className?: string;
};

export function StatePanel({ icon, tone, title, description, actions, size = "page", role, className }: StatePanelProps) {
  return (
    <div
      role={role}
      className={cn(
        "flex flex-col items-center text-center",
        size === "page" ? "surface mx-auto w-full max-w-2xl px-6 py-14 sm:py-16" : "px-4 py-10",
        className,
      )}
    >
      <StateArt icon={icon} tone={tone} />
      <h2 className="font-display mt-6 text-xl font-semibold text-text text-balance">{title}</h2>
      <div className="mt-2 max-w-md text-sm leading-relaxed text-muted text-pretty">{description}</div>
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
