"use client";

import { ArrowUpRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useId } from "react";
import { LazyClerkOrgInfoBridge, LazyClerkOrgSwitcher, LazyClerkUserButton } from "@/components/auth/LazyClerk";
import { useSession } from "@/components/auth/SessionProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Tip } from "@/components/ui/Menu";
import { ROLE_LABELS, type OrgRole } from "@/lib/auth/roles";
import { cn } from "@/lib/cn";
import { activeSegment, hrefFor, NAV_GROUP_LABELS, navFor, type NavItem, type ShellVariant } from "@/lib/nav";
import { BotMark } from "./BotMark";
import { ThemeToggle } from "./ThemeToggle";

type SidebarProps = {
  variant: ShellVariant;
  basePath: string;
  isSuperAdmin: boolean;
  collapsed: boolean;
  onToggle?: () => void;
  /** Tiroir mobile : fermer après navigation. */
  onNavigate?: () => void;
};

export function Sidebar({ variant, basePath, isSuperAdmin, collapsed, onToggle, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const items = navFor(variant, isSuperAdmin);
  const active = activeSegment(items, basePath, pathname);
  const layoutId = useId();
  const { session } = useSession();

  const groups = items.reduce<{ group: NavItem["group"]; items: NavItem[] }[]>((acc, item) => {
    const last = acc.at(-1);
    if (last?.group === item.group) last.items.push(item);
    else acc.push({ group: item.group, items: [item] });
    return acc;
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* En-tête : marque ou organisation active */}
      <div className={cn("flex items-center gap-2 px-3 pt-4 pb-3", collapsed && "flex-col px-2")}>
        <div className="min-w-0 flex-1">
          {variant === "admin" ? <PlatformBrand collapsed={collapsed} /> : <OrgBrand collapsed={collapsed} />}
        </div>
        {onToggle && (
          <Tip content={collapsed ? "Déplier (Ctrl+B)" : "Replier (Ctrl+B)"} side="right">
            <button
              type="button"
              onClick={onToggle}
              aria-label={collapsed ? "Déplier la barre latérale" : "Replier la barre latérale"}
              aria-expanded={!collapsed}
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
            </button>
          </Tip>
        )}
      </div>

      {/* Navigation */}
      <nav aria-label="Navigation principale" className="scrollbar-thin min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-2">
        {groups.map(({ group, items: groupItems }, groupIndex) => (
          <Fragment key={group}>
            <div className={cn("h-6", groupIndex === 0 && "h-2")}>
              {!collapsed && groupIndex > 0 && (
                <p className="kicker px-3 pt-2 text-[10px]">{NAV_GROUP_LABELS[group]}</p>
              )}
              {collapsed && groupIndex > 0 && <div className="mx-auto mt-3 h-px w-6 bg-border-strong" />}
            </div>
            <ul className="space-y-1">
              {groupItems.map((item) => {
                const isActive = item.segment === active;
                const link = (
                  <Link
                    href={hrefFor(basePath, item.segment)}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group relative flex h-11 items-center gap-3 rounded-2xl text-sm font-medium outline-offset-0 transition-colors",
                      collapsed ? "justify-center px-0" : "px-3",
                      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId={layoutId}
                        className="absolute inset-0 rounded-2xl bg-card shadow-[var(--card-shadow)]"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      >
                        <span className="absolute top-1/2 -left-3 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                      </motion.span>
                    )}
                    <span
                      className={cn(
                        "relative grid size-8 shrink-0 place-items-center rounded-xl transition-all duration-300",
                        isActive ? "bg-primary text-primary-foreground shadow-[0_6px_14px_-6px_var(--primary)]" : "group-hover:bg-accent",
                      )}
                    >
                      <item.Icon className="size-[17px]" aria-hidden />
                    </span>
                    {!collapsed && <span className="relative truncate">{item.label}</span>}
                    {collapsed && <span className="sr-only">{item.label}</span>}
                  </Link>
                );
                return (
                  <li key={item.segment}>
                    <Tip content={item.label} side="right" disabled={!collapsed}>
                      {link}
                    </Tip>
                  </li>
                );
              })}
            </ul>
          </Fragment>
        ))}

        {/* Passerelle entre les deux espaces pour l'équipe Tontouma. */}
        {session.isPlatformAdmin && (
          <div className="mt-6">
            <Tip content={variant === "admin" ? "Espace organisation" : "Administration Tontouma"} side="right" disabled={!collapsed}>
              <Link
                href={variant === "admin" ? "/dashboard" : "/admin"}
                onClick={onNavigate}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-2xl border border-dashed border-border-strong text-[13px] text-muted-foreground transition hover:border-solid hover:bg-accent hover:text-foreground",
                  collapsed ? "justify-center" : "px-3",
                )}
              >
                <ArrowUpRight className="size-4 shrink-0" aria-hidden />
                {!collapsed && <span className="truncate">{variant === "admin" ? "Espace organisation" : "Administration Tontouma"}</span>}
              </Link>
            </Tip>
          </div>
        )}
      </nav>

      {/* Pied : thème + utilisateur */}
      <div className={cn("space-y-3 border-t border-border px-3 pt-3 pb-4", collapsed && "px-2")}>
        {collapsed ? (
          <div className="flex justify-center">
            <ThemeToggle compact />
          </div>
        ) : (
          <ThemeToggle />
        )}
        <UserCard collapsed={collapsed} />
      </div>
    </div>
  );
}

function PlatformBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link href="/admin" className="flex items-center gap-3 rounded-2xl p-1">
      <BotMark size={40} />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="min-w-0">
            <p className="truncate text-[15px] font-bold tracking-tight text-foreground">Tontouma Bot</p>
            <p className="truncate text-xs text-muted-foreground">Administration</p>
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
}

function OrgBrand({ collapsed }: { collapsed: boolean }) {
  const { session } = useSession();

  if (session.mode === "dev") {
    const name = session.orgName ?? "Organisation";
    return (
      <div className={cn("flex items-center gap-3 rounded-2xl p-1", collapsed && "justify-center")}>
        <Avatar name={name} size={40} square />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold tracking-tight text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">Propulsé par Tontouma Bot</p>
          </div>
        )}
      </div>
    );
  }

  if (!collapsed) return <LazyClerkOrgSwitcher />;
  return (
    <LazyClerkOrgInfoBridge>
      {(org) => (
        <div className="flex justify-center p-1">
          <Avatar name={org.name || "Organisation"} imageUrl={org.imageUrl} size={40} square />
        </div>
      )}
    </LazyClerkOrgInfoBridge>
  );
}

function UserCard({ collapsed }: { collapsed: boolean }) {
  const { session } = useSession();
  const role = session.isPlatformAdmin && !session.orgRole ? "Équipe Tontouma" : ROLE_LABELS[session.orgRole as OrgRole] ?? "Membre";

  return (
    <div className={cn("flex items-center gap-3 rounded-2xl bg-card/70 p-2 shadow-[var(--card-shadow)]", collapsed && "justify-center bg-transparent p-0 shadow-none")}>
      {session.mode === "clerk" ? <LazyClerkUserButton /> : <Avatar name={session.name} size={36} />}
      {!collapsed && (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-foreground">{session.name || session.email || "Utilisateur"}</p>
            <p className="truncate text-[11px] text-muted-foreground">{role}</p>
          </div>
        </>
      )}
    </div>
  );
}
