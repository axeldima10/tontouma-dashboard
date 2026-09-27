"use client";

import { Command } from "cmdk";
import { Building2, CornerDownLeft, FileText, Layers, Loader2, Search } from "lucide-react";
import { Dialog as D } from "radix-ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { orgSearchIndex, platformSearchIndex, type SearchEntry } from "@/lib/actions/search";
import { cn } from "@/lib/cn";
import { hrefFor, navFor, type ShellVariant } from "@/lib/nav";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: ShellVariant;
  basePath: string;
  isSuperAdmin: boolean;
};

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
  );
}
