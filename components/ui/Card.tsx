import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Surface pleine (données, formulaires) — lisible en toutes circonstances. */
export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("surface p-5 sm:p-6", className)} {...props} />;
}

/** Carte en verre (tuiles d'accueil, éléments décoratifs légers). */
export function GlassCard({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("glass rounded-[26px] p-5 sm:p-6", className)} {...props} />;
}

type CardHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function CardHeader({ title, description, icon, action, className }: CardHeaderProps) {
  return (
    <header className={cn("mb-5 flex items-start justify-between gap-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-foreground [&_svg]:size-[18px]">{icon}</span>
        )}
        <div className="min-w-0">
          <h2 className="text-[15px] leading-tight font-semibold tracking-tight text-foreground">{title}</h2>
          {description && <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  );
}
