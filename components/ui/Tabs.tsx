"use client";

import { motion } from "motion/react";
import { Tabs as T } from "radix-ui";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SegmentOption<V extends string> = { value: V; label: ReactNode; count?: number };

type SegmentedProps<V extends string> = {
  value: V;
  onValueChange: (value: V) => void;
  options: SegmentOption<V>[];
  className?: string;
  "aria-label": string;
};

/** Contrôle segmenté en verre : la pastille active glisse d'une option à l'autre (ressort). */
export function Segmented<V extends string>({ value, onValueChange, options, className, ...aria }: SegmentedProps<V>) {
  const layoutId = useId();
  return (
    <div role="radiogroup" {...aria} className={cn("glass scrollbar-thin inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full p-1", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-primary shadow-[0_6px_16px_-8px_var(--primary)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{option.label}</span>
            {option.count !== undefined && (
              <span className={cn("tabular relative rounded-full px-1.5 text-[11px]", active ? "bg-white/15" : "bg-accent")}>{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

type TabsProps<V extends string> = {
  value: V;
  onValueChange: (value: V) => void;
  tabs: { value: V; label: ReactNode; content: ReactNode }[];
  "aria-label": string;
};

/** Onglets (Radix) avec soulignement animé. */
export function Tabs<V extends string>({ value, onValueChange, tabs, ...aria }: TabsProps<V>) {
  const layoutId = useId();
  return (
    <T.Root value={value} onValueChange={(v) => onValueChange(v as V)}>
      <T.List {...aria} className="glass mb-5 inline-flex max-w-full gap-0.5 overflow-x-auto rounded-full p-1">
        {tabs.map((tab) => (
          <T.Trigger
            key={tab.value}
            value={tab.value}
            className="relative flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground [&_svg]:size-4"
          >
            {tab.value === value && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-card shadow-[var(--card-shadow)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative flex items-center gap-2">{tab.label}</span>
          </T.Trigger>
        ))}
      </T.List>
      {tabs.map((tab) => (
        <T.Content key={tab.value} value={tab.value} className="outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1">
          {tab.content}
        </T.Content>
      ))}
    </T.Root>
  );
}
