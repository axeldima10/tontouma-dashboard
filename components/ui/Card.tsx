import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentPropsWithoutRef<"section">) {
  return <section className={cn("surface min-w-0 p-5 sm:p-6", className)} {...props} />;
}

type CardHeaderProps = {
  title: ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function CardHeader({ title, icon, description, action, className }: CardHeaderProps) {
  return (
    <header className={cn("mb-5 flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="font-display flex items-center gap-2 text-[17px] font-semibold text-text">
          {icon && <span className="text-green-ink [&_svg]:size-[18px]">{icon}</span>}
          {title}
        </h2>
        {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
