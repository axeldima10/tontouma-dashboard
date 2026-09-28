"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { LazyClerkOrgInfoBridge, LazyClerkUserButton } from "@/components/auth/LazyClerk";
import { useSession } from "@/components/auth/SessionProvider";
import { ROLE_LABELS, type OrgRole } from "@/lib/auth/roles";
import { cn } from "@/lib/cn";
import { gsap } from "@/lib/motion/gsap";
import { hrefFor, NAV_GROUP_LABELS, navFor, type NavItem, type ShellVariant } from "@/lib/nav";
import { BotMark } from "./BotMark";

type SidebarContentProps = {
  variant: ShellVariant;
  basePath: string;
  isSuperAdmin: boolean;
  /** Barre d'icônes sur tablette ; libellés complets sur desktop et dans le tiroir. */
  responsiveRail?: boolean;
  onNavigate?: () => void;
};

/** Libellés masqués visuellement en mode rail (tablette) mais toujours lus par les lecteurs d'écran. */
const RAIL_HIDE = "md:max-lg:sr-only";

function activeSegment(pathname: string, basePath: string, items: NavItem[]): string {
  const rest = pathname.startsWith(basePath) ? pathname.slice(basePath.length).replace(/^\//, "") : "";
  const first = rest.split("/")[0] ?? "";
  return items.some((item) => item.segment === first) ? first : "";
}

function SidebarHeader({ variant, rail }: { variant: ShellVariant; rail: boolean }) {
  const { session } = useSession();

  if (variant === "admin") {
    return (
      <div className={cn("flex items-center gap-3 px-2", rail && "md:max-lg:justify-center md:max-lg:px-0")}>
        <BotMark size={40} />
        <div className={cn("min-w-0", rail && RAIL_HIDE)}>
          <p className="font-display text-[15px] font-bold tracking-tight text-text">Tontouma Bot</p>
          <p className="kicker !text-[10px]">Administration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={cn("flex items-center gap-2 px-2", rail && "md:max-lg:justify-center md:max-lg:px-0")}>
        <BotMark size={28} />
        <span className={cn("font-display text-[13px] font-bold tracking-tight text-text", rail && RAIL_HIDE)}>
          Tontouma Bot
        </span>
      </div>
      {session.mode === "clerk" ? (
        <ClerkOrgCard rail={rail} />
      ) : (
        <OrgCard rail={rail} loaded name={session.orgName ?? ""} imageUrl={null} roleLabel={roleLabel(session.orgRole)} />
      )}
    </div>
  );
}

function roleLabel(role: string | null | undefined): string {
  return role && role in ROLE_LABELS ? ROLE_LABELS[role as OrgRole] : "Membre";
}

type OrgCardProps = { rail: boolean; loaded: boolean; name: string; imageUrl: string | null; roleLabel: string };

function OrgCard({ rail, loaded, name, imageUrl, roleLabel: label }: OrgCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-line bg-panel/70 p-2.5",
        rail && "md:max-lg:justify-center md:max-lg:border-0 md:max-lg:bg-transparent md:max-lg:p-0",
      )}
    >
      {!loaded ? (
        <span className="skeleton size-9 shrink-0 rounded-[10px]" />
      ) : imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo servi par Clerk (domaine externe)
        <img src={imageUrl} alt="" className="size-9 shrink-0 rounded-[10px] object-cover ring-1 ring-line" />
      ) : (
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-soft-green text-green-ink ring-1 ring-green/15">
          <Building2 className="size-4" aria-hidden />
        </span>
      )}
      <div className={cn("min-w-0", rail && RAIL_HIDE)}>
        {loaded ? (
          <>
            <p className="truncate text-[13px] font-semibold text-text">{name}</p>
            <p className="truncate text-[11px] text-muted">{label}</p>
          </>
        ) : (
          <>
            <span className="skeleton block h-3 w-28" />
            <span className="skeleton mt-1.5 block h-2.5 w-20" />
          </>
        )}
      </div>
    </div>
  );
}

function ClerkOrgCard({ rail }: { rail: boolean }) {
  return (
    <LazyClerkOrgInfoBridge>
      {(info) => (
        <OrgCard rail={rail} loaded={info.loaded} name={info.name} imageUrl={info.imageUrl} roleLabel={roleLabel(info.role)} />
      )}
    </LazyClerkOrgInfoBridge>
  );
}

function initials(name: string): string {
  return name
    .split(/s+/)
    .map((word) => word[0]?.toUpperCase())
    .slice(0, 2)
    .join("");
}

function UserBlock({ rail }: { rail: boolean }) {
  const { session } = useSession();
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl px-2 py-2", rail && "md:max-lg:justify-center md:max-lg:px-0")}>
      {session.mode === "clerk" ? (
        <LazyClerkUserButton />
      ) : (
        <span
          aria-hidden
          className="font-display grid size-9 shrink-0 place-items-center rounded-full bg-green text-[13px] font-semibold text-on-green"
        >
          {initials(session.name)}
        </span>
      )}
      <div className={cn("min-w-0", rail && RAIL_HIDE)}>
        <p className="truncate text-[13px] font-semibold text-text">{session.name || "…"}</p>
        <p className="truncate text-[11px] text-muted">{session.email}</p>
      </div>
    </div>
  );
}

export function SidebarContent({ variant, basePath, isSuperAdmin, responsiveRail = false, onNavigate }: SidebarContentProps) {
  const pathname = usePathname();
  const items = navFor(variant, isSuperAdmin);
  const current = activeSegment(pathname, basePath, items);
  const listRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);

  // Le repère actif glisse d'un lien à l'autre (mesure → transform uniquement).
  useLayoutEffect(() => {
    const list = listRef.current;
    const indicator = indicatorRef.current;
    const active = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !indicator || !active) return;

    const measure = () => ({
      y: active.offsetTop,
      height: active.offsetHeight,
      x: active.offsetLeft,
      width: active.offsetWidth,
    });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!placed.current || reduce) {
      gsap.set(indicator, { ...measure(), autoAlpha: 1 });
      placed.current = true;
    } else {
      gsap.to(indicator, { ...measure(), autoAlpha: 1, duration: 0.5, ease: "tontouma" });
    }
    // Rail ↔ desktop, ou tiroir qui s'ouvre (mesures nulles tant qu'il est masqué).
    const observer = new ResizeObserver(() => gsap.set(indicator, measure()));
    observer.observe(list);
    return () => observer.disconnect();
  }, [current]);

  const groups = Array.from(new Set(items.map((item) => item.group)));
  const rail = responsiveRail;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SidebarHeader variant={variant} rail={rail} />

      <nav aria-label="Navigation principale" className="mt-6 min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <div ref={listRef} className="relative">
          <span
            ref={indicatorRef}
            aria-hidden
            className="invisible absolute top-0 left-0 rounded-xl bg-soft-green ring-1 ring-green/20 shadow-[0_6px_16px_-10px_color-mix(in_srgb,var(--green)_80%,transparent)]"
          />
          {groups.map((group) => (
            <div key={group} className="mb-4">
              {variant === "org" && (
                <p className={cn("kicker mb-2 px-3 !text-[10px] !text-subtle", rail && RAIL_HIDE)}>{NAV_GROUP_LABELS[group]}</p>
              )}
              <ul className="space-y-1">
                {items
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const isActive = item.segment === current;
                    return (
                      <li key={item.segment}>
                        <Link
                          href={hrefFor(basePath, item.segment)}
                          aria-current={isActive ? "page" : undefined}
                          title={item.label}
                          onClick={onNavigate}
                          className={cn(
                            "group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                            rail && "md:max-lg:justify-center md:max-lg:px-0",
                            isActive ? "text-green-ink" : "text-muted hover:bg-surface-3/70 hover:text-text",
                          )}
                        >
                          <item.Icon
                            className="relative size-[18px] shrink-0 transition-transform duration-300 group-hover:scale-110"
                            strokeWidth={isActive ? 2.3 : 1.9}
                            aria-hidden
                          />
                          <span className={cn("relative truncate", rail && RAIL_HIDE)}>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-line pt-3">
        <UserBlock rail={rail} />
      </div>
    </div>
  );
}
