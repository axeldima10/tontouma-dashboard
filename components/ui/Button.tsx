"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useMagnetic } from "@/lib/motion/usePointerEffects";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-green text-on-green shadow-[0_6px_18px_-6px_color-mix(in_srgb,var(--green)_70%,transparent)] hover:bg-green-dark",
  secondary: "bg-panel text-text border border-line-strong hover:border-green/50 hover:bg-surface-2",
  ghost: "text-muted hover:text-text hover:bg-surface-3",
  danger: "bg-danger text-white hover:brightness-110",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-[10px]",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-5 text-[15px] gap-2 rounded-[14px]",
};

type BaseProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  /** Attraction magnétique au survol — à réserver à l'action principale d'un écran. */
  magnetic?: boolean;
  className?: string;
  children?: ReactNode;
};

type ButtonProps = BaseProps & ComponentPropsWithoutRef<"button"> & { href?: undefined };
type LinkProps = BaseProps & { href: string; prefetch?: boolean } & Omit<ComponentPropsWithoutRef<"a">, "href">;

export function Button(props: ButtonProps | LinkProps) {
  const { variant = "primary", size = "md", loading, icon, magnetic, className, children, ...rest } = props;
  const magneticRef = useMagnetic<HTMLElement>(magnetic ? 0.22 : 0);
  const classes = cn(
    "inline-flex shrink-0 select-none items-center justify-center font-medium whitespace-nowrap",
    "transition-[background-color,border-color,color,box-shadow,filter] duration-200",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
  const content = (
    <>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </>
  );

  if (typeof rest.href === "string") {
    const { href, ...anchor } = rest as LinkProps;
    return (
      <Link ref={magnetic ? (magneticRef as React.Ref<HTMLAnchorElement>) : undefined} href={href} className={classes} {...anchor}>
        {content}
      </Link>
    );
  }

  const { type = "button", disabled, ...button } = rest as ButtonProps;
  return (
    <button
      ref={magnetic ? (magneticRef as React.Ref<HTMLButtonElement>) : undefined}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...button}
    >
      {content}
    </button>
  );
}
