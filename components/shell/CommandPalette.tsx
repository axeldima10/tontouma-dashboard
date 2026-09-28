"use client";

import { CornerDownLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/cn";
import { gsap, useGSAP, MEDIA } from "@/lib/motion/gsap";
import { hrefFor, navFor, type ShellVariant } from "@/lib/nav";

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  variant: ShellVariant;
  basePath: string;
  isSuperAdmin: boolean;
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** Palette de navigation (Ctrl/⌘ K). Uniquement les pages autorisées pour le rôle. */
export function CommandPalette({ open, onClose, variant, basePath, isSuperAdmin }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return navFor(variant, isSuperAdmin).filter(
      (item) => !q || normalize(item.label).includes(q) || normalize(item.description).includes(q),
    );
  }, [query, variant, isSuperAdmin]);

  useGSAP(
    () => {
      if (!open) return;
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        gsap.from(".palette-item", { y: 8, autoAlpha: 0, duration: 0.35, stagger: 0.03, delay: 0.08 });
      });
      return () => mm.revert();
    },
    { dependencies: [open], scope: listRef },
  );

  const close = () => {
    setQuery("");
    setCursor(0);
    onClose();
  };

  const go = (index: number) => {
    const item = results[index];
    if (!item) return;
    close();
    router.push(hrefFor(basePath, item.segment));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((c) => (results.length ? (c + 1) % results.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((c) => (results.length ? (c - 1 + results.length) % results.length : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(cursor);
    }
  };

  const activeId = results[cursor] ? `${listboxId}-${results[cursor].segment || "accueil"}` : undefined;

  return (
    <Dialog open={open} onClose={close} title="Aller à…" placement="top" hideTitle className="max-w-xl">
      <div className="-mx-6 -mt-4">
        <div className="flex items-center gap-3 border-b border-line px-5">
          <Search className="size-4 shrink-0 text-muted" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCursor(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Rechercher une page…"
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={activeId}
            aria-label="Rechercher une page"
            className="h-14 w-full bg-transparent text-[15px] text-text outline-none placeholder:text-subtle"
          />
          <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 text-[11px] text-muted sm:block">Échap</kbd>
        </div>
        <ul ref={listRef} id={listboxId} role="listbox" aria-label="Pages" className="max-h-[50vh] overflow-y-auto p-2 scrollbar-thin">
          {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted">Aucune page ne correspond.</li>}
          {results.map((item, index) => (
            <li
              key={item.segment}
              id={`${listboxId}-${item.segment || "accueil"}`}
              role="option"
              aria-selected={index === cursor}
              onPointerMove={() => setCursor(index)}
              onClick={() => go(index)}
              className={cn(
                "palette-item flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                index === cursor ? "bg-soft-green" : "hover:bg-surface-3",
              )}
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-[10px] border border-line bg-panel",
                  index === cursor ? "text-green-ink" : "text-muted",
                )}
              >
                <item.Icon className="size-[18px]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-text">{item.label}</span>
                <span className="block truncate text-xs text-muted">{item.description}</span>
              </span>
              {index === cursor && <CornerDownLeft className="size-4 text-green-ink" aria-hidden />}
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  );
}
