"use client";

import { CheckCircle2, CircleAlert, CircleMinus, Copy, Fingerprint, ServerCog, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Stagger, StaggerItem } from "@/components/motion/Motion";
import { PageHeader } from "@/components/shell/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { StatusPill } from "@/components/ui/StatusPill";
import type { Me } from "@/lib/api/contract";
import type { ErrorDescription } from "@/lib/api/errors";
import { ROLE_LABELS, type OrgRole } from "@/lib/auth/roles";
import { backendJwtTemplate } from "@/lib/auth/token";
import { cn } from "@/lib/cn";

type Check = { label: string; state: "ok" | "ko" | "warn" | "na"; detail: string };

type AccountViewProps = {
  variant: "org" | "admin";
  session: { mode: "clerk" | "dev"; name: string; email: string | null; imageUrl: string | null; orgId: string | null; orgRole: string | null; isPlatformAdmin: boolean };
  me: { ok: true; data: Me } | { ok: false; error: ErrorDescription & { message?: string } };
  demo: boolean;
};

const ICONS = {
  ok: <CheckCircle2 className="size-5 text-brand-ink" aria-hidden />,
  ko: <XCircle className="size-5 text-destructive" aria-hidden />,
  warn: <CircleAlert className="size-5 text-warning" aria-hidden />,
  na: <CircleMinus className="size-5 text-subtle" aria-hidden />,
};

/** Profil backend (`GET /me`) et vérification pas à pas de la configuration Clerk ↔ backend. */
export function AccountView({ variant, session, me, demo }: AccountViewProps) {
  const roleKnown = session.orgRole === "org:super_admin" || session.orgRole === "org:admin";
  const template = backendJwtTemplate();
  const checks: Check[] = [
    session.mode === "clerk"
      ? { label: "Connexion Clerk", state: "ok", detail: `Session Clerk active : chaque appel au backend porte un jeton frais (${template ? `modèle « ${template} »` : "jeton de session standard"}).` }
      : { label: "Connexion Clerk", state: "warn", detail: "Mode développement (AUTH_MODE=dev) : utilisateurs fictifs, aucun jeton envoyé au backend." },
    variant === "org"
      ? session.orgId
        ? { label: "Organisation active", state: "ok", detail: `Organisation Clerk ${session.orgId}.` }
        : { label: "Organisation active", state: "ko", detail: "Aucune organisation active dans la session." }
      : { label: "Rôle plateforme dans le jeton", state: session.isPlatformAdmin ? "ok" : "ko", detail: session.isPlatformAdmin ? "Claim platform_role = SUPER_ADMIN présente." : "Claim platform_role absente ou différente de SUPER_ADMIN." },
    variant === "org"
      ? { label: "Rôle d’organisation", state: roleKnown ? "ok" : "ko", detail: roleKnown ? `${ROLE_LABELS[session.orgRole as OrgRole]} (${session.orgRole}).` : `Rôle « ${session.orgRole ?? "aucun"} » : attendu org:super_admin ou org:admin.` }
      : { label: "Accès à l’administration", state: "ok", detail: "Vous voyez cette page : le proxy vous a laissé entrer." },
    demo
      ? { label: "Source des données", state: "warn", detail: "Backend fictif (DATA_SOURCE=mock) : rien n’est enregistré sur le vrai serveur." }
      : { label: "Source des données", state: "ok", detail: "Backend réel (API_BASE_URL)." },
    me.ok
      ? { label: "Backend joignable (GET /me)", state: "ok", detail: "Le backend a reconnu votre jeton." }
      : { label: "Backend joignable (GET /me)", state: "ko", detail: `${me.error.title} — ${me.error.description}` },
  ];
  if (me.ok) {
    const roles = me.data.roles;
    if (variant === "org") {
      checks.push(
        me.data.mirrored
          ? { label: "Organisation reliée au backend", state: "ok", detail: `Organisation backend ${me.data.organizationId ?? "?"} (${me.data.organizationName ?? "sans nom"}).` }
          : { label: "Organisation reliée au backend", state: "ko", detail: "L’organisation Clerk n’est pas encore reflétée côté backend (mirrored = false) : vérifiez le webhook Clerk." },
        roles.includes("ADMIN_ORGANISATION")
          ? { label: "Rôle backend", state: "ok", detail: "ADMIN_ORGANISATION : accès aux endpoints /admin de votre organisation." }
          : { label: "Rôle backend", state: "ko", detail: `Rôles reçus : ${roles.join(", ") || "aucun"}. ADMIN_ORGANISATION est requis.` },
      );
    } else {
      checks.push(
        roles.includes("SUPER_ADMIN")
          ? { label: "Rôle backend", state: "ok", detail: "SUPER_ADMIN : accès aux endpoints /superadmin." }
          : { label: "Rôle backend", state: "ko", detail: `Rôles reçus : ${roles.join(", ") || "aucun"}. Ajoutez public_metadata.role = "SUPER_ADMIN" dans Clerk.` },
      );
    }
  }

  const passed = checks.filter((c) => c.state === "ok").length;
  const profile = me.ok ? me.data : null;
  const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || session.name || session.email || "Utilisateur";

  const rows: [string, string | null][] = profile
    ? [
        ["Identifiant Clerk", profile.clerkUserId],
        ["Email", profile.email],
        ["Organisation Clerk", profile.clerkOrgId],
        ["Organisation backend", profile.organizationId],
        ["Nom côté backend", profile.organizationName],
      ]
    : [];

  return (
    <>
      <PageHeader kicker="Compte" title="Mon compte" description="Votre profil tel que le backend le voit, et l’état de la configuration Clerk ↔ backend." />
      <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <StaggerItem className="lg:col-span-2">
          <section className="glass h-full rounded-[28px] p-6">
            <div className="flex items-center gap-4">
              <Avatar name={displayName} imageUrl={session.imageUrl} size={64} />
              <div className="min-w-0">
                <p className="truncate text-xl font-light tracking-tight text-foreground">{displayName}</p>
                <p className="truncate text-sm text-muted-foreground">{profile?.email ?? session.email ?? "—"}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {(profile?.roles ?? []).map((role) => (
                <StatusPill key={role} tone="info">
                  {role}
                </StatusPill>
              ))}
              {session.orgRole && <StatusPill tone="neutral">{session.orgRole}</StatusPill>}
            </div>
            {rows.length > 0 && (
              <dl className="mt-6 space-y-2">
                {rows.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-2xl bg-card/70 px-3.5 py-2.5 shadow-[var(--card-shadow)]">
                    <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
                    <dd className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate font-mono text-xs text-foreground">{value ?? "—"}</span>
                      {value && (
                        <button type="button" aria-label={`Copier ${label}`} onClick={() => void navigator.clipboard.writeText(value).then(() => toast.success(`${label} copié`))} className="grid size-6 shrink-0 place-items-center rounded-full text-subtle hover:bg-accent hover:text-foreground">
                          <Copy className="size-3" />
                        </button>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {!me.ok && (
              <p className="mt-6 flex items-start gap-2 rounded-2xl bg-destructive-soft px-3.5 py-3 text-xs text-destructive">
                <ServerCog className="mt-0.5 size-4 shrink-0" aria-hidden /> Profil backend indisponible : {me.error.description}
              </p>
            )}
          </section>
        </StaggerItem>

        <StaggerItem className="lg:col-span-3">
          <section className="surface h-full p-6">
            <header className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-foreground">
                <Fingerprint className="size-4 text-muted-foreground" aria-hidden /> Vérification de la configuration
              </h2>
              <StatusPill tone={passed === checks.length ? "success" : "warning"}>
                {passed}/{checks.length} OK
              </StatusPill>
            </header>
            <ol className="space-y-2">
              {checks.map((check, i) => (
                <li key={check.label} className={cn("flex items-start gap-3 rounded-2xl px-4 py-3", check.state === "ko" ? "bg-destructive-soft" : "bg-muted")}>
                  <span className="mt-0.5 shrink-0">{ICONS[check.state]}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      <span className="tabular mr-1.5 text-muted-foreground">{i + 1}.</span>
                      {check.label}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{check.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </StaggerItem>
      </Stagger>
    </>
  );
}
