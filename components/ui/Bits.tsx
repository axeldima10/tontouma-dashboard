"use client";

import { Check, ChevronLeft, Copy, Search } from "lucide-react";
import Link from "next/link";
import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { ProgressBar } from "./Progress";
import { StatusPill } from "./StatusPill";

/** Brouillon / Publié — toujours visible sur le contenu éditable. */
export function PublicationBadge({ published }: { published: boolean }) {
  return published ? (
    <StatusPill tone="success" pulse>
      Publié
    </StatusPill>
  ) : (
    <StatusPill tone="neutral">Brouillon</StatusPill>
  );
}

type IconButtonProps = ComponentPropsWithoutRef<"button"> & { label: string; tone?: "default" | "danger" };

export function IconButton({ label, tone = "default", className, children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4",
        tone === "danger" ? "hover:bg-danger-soft hover:text-danger" : "hover:bg-surface-3 hover:text-text",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group mb-4 inline-flex items-center gap-1 text-[13px] font-medium text-muted transition-colors hover:text-green-ink"
    >
      <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
      {children}
    </Link>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-10 w-full rounded-xl border border-line-strong bg-panel pr-3 pl-9 text-sm text-text outline-none transition-[border-color,box-shadow] placeholder:text-subtle focus:border-green focus:ring-4 focus:ring-green/15"
      />
    </div>
  );
}

type Chip<T extends string> = { value: T; label: string; count?: number };

export function FilterChips<T extends string>({
  chips,
  value,
  onChange,
  label,
}: {
  chips: Chip<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip.value}
          type="button"
          role="radio"
          aria-checked={value === chip.value}
          onClick={() => onChange(chip.value)}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
            value === chip.value
              ? "border-green/40 bg-soft-green text-green-ink"
              : "border-line bg-panel text-muted hover:border-line-strong hover:text-text",
          )}
        >
          {chip.label}
          {chip.count !== undefined && <span className="tabular text-[11px] opacity-70">{chip.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Utilisation vs limite du plan. */
export function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const ratio = limit ? used / limit : 0;
  const tone = ratio >= 1 ? "danger" : ratio >= 0.8 ? "warning" : "green";
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="text-muted">{label}</span>
        <span className="tabular font-semibold text-text">
          {formatNumber(used)}
          <span className="font-normal text-subtle"> / {limit !== null ? formatNumber(limit) : "∞"}</span>
        </span>
      </div>
      <ProgressBar value={ratio} tone={tone} label={`${label} : ${used} sur ${limit ?? "illimité"}`} className="mt-2" />
    </div>
  );
}

export function CopyButton({ value, label = "Copier" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[13px] font-medium transition-colors",
        copied ? "border-green/40 bg-soft-green text-green-ink" : "border-line-strong bg-panel text-text hover:border-green/40",
      )}
    >
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copied ? "Copié" : label}
      <span aria-live="polite" className="sr-only">
        {copied ? "Copié dans le presse-papiers" : ""}
      </span>
    </button>
  );
}

/** Ligne « libellé : valeur » des fiches. */
export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-text">{children}</dd>
    </div>
  );
}
