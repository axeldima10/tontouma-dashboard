import { Search } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { controlClass } from "./Input";

/** Tableau sur surface pleine (desktop). Sous 768 px, les écrans affichent des cartes à la place. */
export function Table({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("surface hidden overflow-hidden md:block", className)}>
      <div className="scrollbar-thin relative overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn("border-b border-border bg-muted/50 px-5 py-3 text-left text-[11px] font-semibold tracking-[0.08em] whitespace-nowrap text-muted-foreground uppercase", className)}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("border-b border-border px-5 py-3.5 align-middle text-foreground", className)} {...props} />;
}

export function Tr({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("transition-colors last:[&>td]:border-b-0 hover:bg-accent/60", className)} {...props} />;
}

/** Version mobile : une carte par ligne. */
export function MobileList({ className, children }: { className?: string; children: ReactNode }) {
  return <ul className={cn("space-y-3 md:hidden", className)}>{children}</ul>;
}

export function MobileCard({ className, ...props }: ComponentProps<"li">) {
  return <li className={cn("surface p-4", className)} {...props} />;
}

type SearchFieldProps = { value: string; onChange: (value: string) => void; placeholder: string; className?: string };

export function SearchField({ value, onChange, placeholder, className }: SearchFieldProps) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-subtle" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(controlClass, "h-10 rounded-full border-[var(--glass-border)] bg-[var(--glass-strong)] pl-10 backdrop-blur-md")}
      />
    </label>
  );
}

/** Barre d'outils au-dessus d'une liste : recherche, filtres, compteur. */
export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mb-4 flex flex-wrap items-center gap-3", className)}>{children}</div>;
}
