"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export const controlClass = cn(
  "w-full rounded-[14px] border border-input bg-card px-3.5 text-sm text-foreground shadow-[inset_0_1px_2px_#15232e0a]",
  "placeholder:text-subtle transition-[border-color,box-shadow] duration-200",
  "hover:border-border-strong focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15",
  "disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-destructive/15",
);

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClass, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(controlClass, "min-h-24 resize-y py-2.5 leading-relaxed", className)} {...props} />;
}

type AffixInputProps = Omit<ComponentProps<"input">, "prefix"> & { prefix?: ReactNode; suffix?: ReactNode };

/** Champ avec préfixe / suffixe (icône de recherche, unité « FCFA », « jours »…). */
export function AffixInput({ prefix, suffix, className, ...props }: AffixInputProps) {
  return (
    <div className="relative">
      {prefix && <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-subtle [&_svg]:size-4">{prefix}</span>}
      <input className={cn(controlClass, "h-11", prefix && "pl-10", suffix && "pr-16", className)} {...props} />
      {suffix && <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-medium text-subtle">{suffix}</span>}
    </div>
  );
}

type IntegerInputProps = Omit<ComponentProps<"input">, "value" | "onChange" | "type" | "prefix"> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
  suffix?: ReactNode;
};

/** Entier positif ou vide (montants XOF, délais, limites) — jamais de décimales. */
export function IntegerInput({ value, onValueChange, suffix, ...props }: IntegerInputProps) {
  const [text, setText] = useState(value === null ? "" : String(value));
  const [last, setLast] = useState(value);
  if (value !== last) {
    setLast(value);
    setText(value === null ? "" : String(value));
  }
  return (
    <AffixInput
      {...props}
      inputMode="numeric"
      suffix={suffix}
      className="tabular"
      value={text}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "").slice(0, 12);
        setText(digits);
        const next = digits === "" ? null : Number(digits);
        setLast(next);
        onValueChange(next);
      }}
    />
  );
}
