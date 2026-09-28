"use client";

<<<<<<< HEAD
import { Command } from "cmdk";
import { Building2, CornerDownLeft, FileText, Layers, Loader2, Search } from "lucide-react";
import { Dialog as D } from "radix-ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { orgSearchIndex, platformSearchIndex, type SearchEntry } from "@/lib/actions/search";
import { cn } from "@/lib/cn";
=======
import { CornerDownLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/cn";
import { gsap, useGSAP, MEDIA } from "@/lib/motion/gsap";
>>>>>>> 939f032 (First Commit)
import { hrefFor, navFor, type ShellVariant } from "@/lib/nav";

type CommandPaletteProps = {
  open: boolean;
<<<<<<< HEAD
  onOpenChange: (open: boolean) => void;
=======
  onClose: () => void;
>>>>>>> 939f032 (First Commit)
  variant: ShellVariant;
  basePath: string;
  isSuperAdmin: boolean;
};

<<<<<<< HEAD
const KIND_ICON = { service: Layers, procedure: FileText, organization: Building2 };
const KIND_GROUP = { service: "Services", procedure: "Démarches", organization: "Organisations" };

const itemClass = cn(
  "flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-foreground outline-none select-none",
  "data-[selected=true]:bg-card data-[selected=true]:shadow-[var(--card-shadow)]",
);

/** Palette ⌘K : aller à une page, un service, une démarche ou une organisation. */
export function CommandPalette({ open, onOpenChange, variant, basePath, isSuperAdmin }: CommandPaletteProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);

  // L'index est chargé à la première ouverture, puis gardé pour la session de page.
  useEffect(() => {
    if (!open || entries) return;
    let cancelled = false;
    void (variant === "admin" ? platformSearchIndex() : orgSearchIndex(basePath)).then((result) => {
      if (cancelled) return;
      if (result.ok) setEntries(result.data);
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [open, entries, variant, basePath]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const pages = navFor(variant, isSuperAdmin);
  const kinds = entries ? ([...new Set(entries.map((e) => e.kind))] as SearchEntry["kind"][]) : [];

  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--bg-3)_40%,transparent)] backdrop-blur-[6px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <D.Content className="glass-strong fixed top-[12vh] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-[28px] duration-300 ease-[var(--ease-spring)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-4 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <D.Title className="sr-only">Recherche rapide</D.Title>
          <D.Description className="sr-only">Tapez pour rechercher une page, un service ou une démarche.</D.Description>
          <Command label="Recherche rapide" loop>
            <div className="flex items-center gap-3 border-b border-border px-5">
              <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              <Command.Input
                autoFocus
                placeholder={variant === "admin" ? "Rechercher une page ou une organisation…" : "Rechercher une page, un service, une démarche…"}
                className="h-14 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-subtle"
              />
              <kbd className="rounded-md border border-border-strong px-1.5 py-0.5 text-[11px] text-muted-foreground">Échap</kbd>
            </div>
            <Command.List className="scrollbar-thin max-h-[min(60vh,420px)] overflow-y-auto p-2">
              <Command.Empty className="px-4 py-10 text-center text-sm text-muted-foreground">Aucun résultat.</Command.Empty>

              <Command.Group heading="Pages" className="[&_[cmdk-group-heading]]:kicker [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                {pages.map((page) => (
                  <Command.Item key={page.segment} value={`page ${page.label} ${page.description}`} onSelect={() => go(hrefFor(basePath, page.segment))} className={itemClass}>
                    <span className="grid size-8 place-items-center rounded-xl bg-accent">
                      <page.Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{page.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{page.description}</p>
                    </div>
                    <CornerDownLeft className="size-3.5 text-subtle" aria-hidden />
                  </Command.Item>
                ))}
              </Command.Group>

              {!entries && !failed && (
                <p className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden /> Chargement du contenu…
                </p>
              )}
              {failed && <p className="px-4 py-3 text-xs text-muted-foreground">Contenu indisponible pour le moment.</p>}

              {kinds.map((kind) => {
                const Icon = KIND_ICON[kind];
                return (
                  <Command.Group key={kind} heading={KIND_GROUP[kind]} className="[&_[cmdk-group-heading]]:kicker [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                    {entries!
                      .filter((e) => e.kind === kind)
                      .map((entry) => (
                        <Command.Item key={entry.id} value={`${kind} ${entry.label} ${entry.hint} ${entry.id}`} onSelect={() => go(entry.href)} className={itemClass}>
                          <span className="grid size-8 place-items-center rounded-xl bg-accent">
                            <Icon className="size-4" aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{entry.label}</p>
                            <p className="truncate text-xs text-muted-foreground">{entry.hint}</p>
                          </div>
                        </Command.Item>
                      ))}
                  </Command.Group>
                );
              })}
            </Command.List>
          </Command>
        </D.Content>
      </D.Portal>
    </D.Root>
=======
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
>>>>>>> 939f032 (First Commit)
  );
}
