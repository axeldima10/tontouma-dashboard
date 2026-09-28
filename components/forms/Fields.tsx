"use client";

import { ChevronDown } from "lucide-react";
import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-xl border border-line-strong bg-panel px-3.5 text-sm text-text shadow-[inset_0_1px_1px_#0f2a1c08] outline-none transition-[border-color,box-shadow] placeholder:text-subtle hover:border-green/40 focus:border-green focus:ring-4 focus:ring-green/15 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/15";

type FieldProps = {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean; required?: boolean }) => ReactNode;
};

/** Libellé, aide et erreur reliés au contrôle (accessibilité). */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-text">
        {label}
        {required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined, required })}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextInput({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return <input type="text" className={cn(CONTROL, "h-10", className)} {...props} />;
}

export function TextArea({ className, rows = 4, ...props }: ComponentPropsWithoutRef<"textarea">) {
  return <textarea rows={rows} className={cn(CONTROL, "resize-y py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentPropsWithoutRef<"select">) {
  return (
    <div className="relative">
      <select className={cn(CONTROL, "h-10 cursor-pointer appearance-none pr-9", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
    </div>
  );
}

type IntegerInputProps = Omit<ComponentPropsWithoutRef<"input">, "value" | "onChange" | "type"> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
  suffix?: string;
};

/** Entier positif (montants FCFA, jours) : jamais de décimales. */
export function IntegerInput({ value, onValueChange, suffix, className, ...props }: IntegerInputProps) {
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        value={value === null ? "" : String(value)}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "").slice(0, 10);
          onValueChange(digits === "" ? null : Number(digits));
        }}
        className={cn(CONTROL, "tabular h-10", suffix && "pr-16", className)}
        {...props}
      />
      {suffix && (
        <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-semibold text-muted">
          {suffix}
        </span>
      )}
    </div>
  );
}

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  /** Masque le libellé (toujours lu par les lecteurs d'écran). */
  hideLabel?: boolean;
};

export function Switch({ checked, onChange, label, disabled, hideLabel }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={hideLabel ? label : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group inline-flex items-center gap-2.5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full border transition-colors duration-300",
          checked ? "border-green bg-green" : "border-line-strong bg-surface-3",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-[18px] rounded-full bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]",
            checked && "translate-x-4",
          )}
        />
      </span>
      {!hideLabel && <span className="text-sm text-text">{label}</span>}
    </button>
  );
}

/** Désactive d'un bloc tous les contrôles (mode lecture seule). */
export function FormFieldset({ disabled, children, className }: { disabled: boolean; children: ReactNode; className?: string }) {
  return (
    <fieldset disabled={disabled} className={cn("min-w-0 border-0 p-0", className)}>
      {children}
    </fieldset>
  );
}
