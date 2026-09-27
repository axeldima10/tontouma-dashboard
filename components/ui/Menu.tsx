"use client";

import { MoreHorizontal } from "lucide-react";
import { DropdownMenu as M, Tooltip as T } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type MenuItem =
  | {
      label: string;
      icon?: ReactNode;
      onSelect: () => void;
      tone?: "default" | "danger";
      disabled?: boolean;
    }
  | "separator";

type ActionMenuProps = {
  items: MenuItem[];
  label?: string;
  trigger?: ReactNode;
  align?: "start" | "end";
};

/** Menu « … » d'actions secondaires, en verre. */
export function ActionMenu({ items, label = "Plus d’actions", trigger, align = "end" }: ActionMenuProps) {
  return (
    <M.Root>
      <M.Trigger asChild>
        {trigger ?? (
          <button
            type="button"
            aria-label={label}
            className="grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground data-[state=open]:bg-accent"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </button>
        )}
      </M.Trigger>
      <M.Portal>
        <M.Content
          align={align}
          sideOffset={6}
          className={cn(
            "glass-strong z-50 min-w-48 rounded-2xl p-1.5",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          )}
        >
          {items.map((item, index) =>
            item === "separator" ? (
              <M.Separator key={index} className="my-1 h-px bg-border" />
            ) : (
              <M.Item
                key={item.label}
                disabled={item.disabled}
                onSelect={item.onSelect}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4",
                  item.tone === "danger"
                    ? "text-destructive data-[highlighted]:bg-destructive-soft"
                    : "text-foreground data-[highlighted]:bg-accent [&_svg]:text-muted-foreground",
                )}
              >
                {item.icon}
                {item.label}
              </M.Item>
            ),
          )}
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}

export const TooltipProvider = T.Provider;

type TipProps = { content: ReactNode; side?: "top" | "right" | "bottom" | "left"; children: ReactNode; disabled?: boolean };

/** Info-bulle en verre (barre latérale repliée, boutons icônes). */
export function Tip({ content, side = "top", children, disabled }: TipProps) {
  if (disabled) return <>{children}</>;
  return (
    <T.Root>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={10}
          className="z-50 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-lg data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
        >
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
