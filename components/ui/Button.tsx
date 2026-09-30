import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Slot } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full font-medium select-none",
    "transition-[background-color,color,box-shadow,transform,opacity] duration-200 ease-out",
    "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        /** Pilule marine : action principale (comme « Provide feedback » de la référence). */
        primary:
          "bg-primary text-primary-foreground shadow-[0_8px_20px_-8px_color-mix(in_srgb,var(--primary)_60%,transparent)] hover:shadow-[0_12px_28px_-10px_color-mix(in_srgb,var(--primary)_70%,transparent)] hover:-translate-y-px",
        /** Vert Tontouma : publier / activer. */
        brand:
          "bg-brand-ink text-on-brand shadow-[0_8px_20px_-8px_color-mix(in_srgb,var(--brand)_70%,transparent)] hover:-translate-y-px hover:brightness-110",
        /** Pilule de verre : actions secondaires. */
        secondary:
          "border border-[var(--glass-border)] bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_var(--glass-highlight),0_1px_2px_#15232e0d] backdrop-blur-md hover:bg-card",
        outline: "border border-border-strong bg-transparent text-foreground hover:bg-accent",
        ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
        destructive: "bg-destructive text-white hover:brightness-110 dark:text-[#1a0505]",
        "destructive-ghost": "text-destructive hover:bg-destructive-soft",
        link: "rounded-md px-0 text-brand-ink underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        sm: "h-8 px-3.5 text-[13px]",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-6 text-[15px]",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
    /** Icône placée avant le libellé (remplacée par le spinner pendant le chargement). */
    icon?: ReactNode;
    /** Rend un lien Next.js stylé en bouton. */
    href?: string;
  };

export function Button({ className, variant, size, asChild, loading, icon, href, children, disabled, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  const content = (
    <>
      {loading ? <Loader2 className="animate-spin" aria-hidden /> : icon}
      {children}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes} aria-label={props["aria-label"]} title={props.title}>
        {content}
      </Link>
    );
  }

  if (asChild) {
    return (
      <Slot.Root className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <button className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {content}
    </button>
  );
}
