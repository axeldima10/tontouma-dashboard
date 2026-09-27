"use client";

import { Check, ChevronDown } from "lucide-react";
import { Select as S } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { controlClass } from "./Input";

export type SelectOption = { value: string; label: ReactNode; description?: ReactNode; disabled?: boolean };

type SelectProps = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: "md" | "sm";
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-label"?: string;
};

/** Liste déroulante accessible (Radix) avec menu en verre. */
export function Select({ id, value, onValueChange, options, placeholder, disabled, className, size = "md", ...aria }: SelectProps) {
  return (
    <S.Root value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <S.Trigger
        id={id}
        {...aria}
        className={cn(
          controlClass,
          "flex items-center justify-between gap-2 text-left data-[placeholder]:text-subtle",
          size === "md" ? "h-11" : "h-9 rounded-full px-3 text-[13px]",
          className,
        )}
      >
        <span className="truncate">
          <S.Value placeholder={placeholder ?? "Choisir…"} />
        </span>
        <S.Icon>
          <ChevronDown className="size-4 text-subtle" aria-hidden />
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content
          position="popper"
          sideOffset={6}
          className={cn(
            "glass-strong z-50 max-h-[min(360px,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl p-1.5",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          )}
        >
          <S.Viewport className="scrollbar-thin">
            {options.map((option) => (
              <S.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={cn(
                  "relative flex cursor-pointer items-start gap-2 rounded-xl py-2 pr-8 pl-3 text-sm text-foreground outline-none select-none",
                  "data-[highlighted]:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                )}
              >
                <div className="min-w-0">
                  <S.ItemText>{option.label}</S.ItemText>
                  {option.description && <p className="mt-0.5 text-xs text-muted-foreground">{option.description}</p>}
                </div>
                <S.ItemIndicator className="absolute top-2.5 right-2.5">
                  <Check className="size-4 text-brand-ink" aria-hidden />
                </S.ItemIndicator>
              </S.Item>
            ))}
          </S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  );
}
