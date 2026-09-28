import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  kicker?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, kicker, actions }: PageHeaderProps) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {kicker && <p className="kicker mb-2">{kicker}</p>}
        <h1 className="font-display text-[26px] leading-tight font-semibold text-text sm:text-[30px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
