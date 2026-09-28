"use client";

<<<<<<< HEAD
import { Building2, Check, Mail, MonitorSmartphone, Pause, Play, Receipt, Save, UserMinus, UserPlus, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/states/States";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { AffixInput } from "@/components/ui/Input";
import { UsageMeter } from "@/components/ui/Metrics";
import { ActivePill, StatusPill } from "@/components/ui/StatusPill";
import { Tabs } from "@/components/ui/Tabs";
import { changeOrganizationPlan, inviteAdmin, removeAdmin, setOrganizationActive, updateOrganization } from "@/lib/actions/platform";
import type { Borne, Member, Organization, Plan } from "@/lib/api/contract";
import { ROLE_LABELS, type OrgRole } from "@/lib/auth/roles";
import { cn } from "@/lib/cn";
import { BILLING_PERIOD_LABELS, formatDate, formatXOF } from "@/lib/format";
import { useAction } from "@/lib/hooks/useAction";
import { useUnsavedChanges } from "@/lib/hooks/useUnsavedChanges";
import { BornesManager } from "./BornesManager";
import { OrganizationFields, organizationErrors, toOrganizationForm, toOrganizationRequest } from "./OrganizationForm";

type TabKey = "infos" | "membres" | "bornes" | "plan";

type OrganizationDetailProps = {
  organization: Organization;
  members: Member[] | null;
  bornes: Borne[];
  plans: Plan[];
};

export function OrganizationDetail({ organization, members, bornes, plans }: OrganizationDetailProps) {
  const [tab, setTab] = useState<TabKey>("infos");
  const [statusConfirm, setStatusConfirm] = useState(false);
  const status = useAction();
  const plan = plans.find((p) => p.id === organization.plan?.id) ?? null;

  const toggleStatus = async () => {
    const active = !organization.active;
    const result = await status.run(() => setOrganizationActive(organization.id, active), {
      success: active ? "Organisation réactivée" : "Organisation suspendue",
      successDescription: active ? "Ses membres peuvent de nouveau modifier et publier." : "Son tableau de bord passe en lecture seule.",
    });
    if (result.ok) setStatusConfirm(false);
  };

  return (
    <>
      <PageHeader
        back={{ href: "/admin/organisations", label: "Organisations" }}
        kicker={organization.type ?? "Organisation"}
        title={
          <span className="flex items-center gap-4">
            <Avatar name={organization.name} imageUrl={organization.logoUrl} size={52} square className="max-sm:hidden" />
            {organization.name}
          </span>
        }
        badges={<ActivePill active={organization.active} on="Active" off="Suspendue" />}
        description={`Cliente depuis le ${formatDate(organization.createdAt)}${organization.plan ? ` · Plan ${organization.plan.name}` : ""}`}
        actions={
          organization.active ? (
            <Button variant="secondary" icon={<Pause />} onClick={() => setStatusConfirm(true)}>
              Suspendre
            </Button>
          ) : (
            <Button variant="brand" icon={<Play />} onClick={() => setStatusConfirm(true)}>
              Réactiver
            </Button>
          )
        }
      />

      <Tabs
        aria-label="Sections de l’organisation"
        value={tab}
        onValueChange={setTab}
        tabs={[
          { value: "infos", label: <><Building2 /> Informations</>, content: <InfoTab organization={organization} /> },
          {
            value: "membres",
            label: (
              <>
                <Users /> Administrateurs {members && <span className="tabular text-xs text-muted-foreground">{members.length}</span>}
              </>
            ),
            content: <MembersTab organization={organization} members={members} limit={plan?.maxAdmins ?? null} />,
          },
          {
            value: "bornes",
            label: (
              <>
                <MonitorSmartphone /> Bornes <span className="tabular text-xs text-muted-foreground">{bornes.length}</span>
              </>
            ),
            content: (
              <div className="space-y-4">
                {plan && (
                  <div className="glass rounded-[22px] px-5 py-4">
                    <UsageMeter label={`Bornes du plan ${plan.name}`} used={bornes.length} limit={plan.maxBornes} icon={<MonitorSmartphone />} />
                  </div>
                )}
                <BornesManager bornes={bornes} organizations={[{ id: organization.id, name: organization.name }]} organizationId={organization.id} />
              </div>
            ),
          },
          { value: "plan", label: <><Receipt /> Plan</>, content: <PlanTab organization={organization} plans={plans} /> },
        ]}
      />

      <ConfirmDialog
        open={statusConfirm}
        onOpenChange={setStatusConfirm}
        loading={status.pending}
        onConfirm={toggleStatus}
        tone={organization.active ? "danger" : "publish"}
        title={organization.active ? `Suspendre ${organization.name} ?` : `Réactiver ${organization.name} ?`}
        description={
          organization.active
            ? "Son tableau de bord passe en lecture seule : plus aucune modification ni publication. Le contenu déjà publié reste visible des citoyens selon les règles du service."
            : "Ses administrateurs pourront de nouveau modifier et publier leur contenu."
        }
        confirmLabel={organization.active ? "Suspendre" : "Réactiver"}
      />
    </>
  );
}

/* --------------------------------- Infos --------------------------------- */

function InfoTab({ organization }: { organization: Organization }) {
  const [initial, setInitial] = useState(() => toOrganizationForm(organization));
  const [form, setForm] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const { run, pending } = useAction();
  const dirty = JSON.stringify(toOrganizationRequest(form)) !== JSON.stringify(toOrganizationRequest(initial));
  useUnsavedChanges(dirty);

  const submit = async () => {
    setSubmitted(true);
    if (Object.values(organizationErrors(form)).some(Boolean)) return;
    const result = await run(() => updateOrganization(organization.id, toOrganizationRequest(form)), { success: "Organisation mise à jour" });
    if (result.ok) {
      const next = toOrganizationForm(result.data);
      setInitial(next);
      setForm(next);
      setSubmitted(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Informations de l’organisation"
        description="Affichées aux citoyens (nom, adresse, contact, horaires)."
        action={
          <Button icon={<Save />} loading={pending} disabled={!dirty} onClick={submit}>
            Enregistrer
          </Button>
        }
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <OrganizationFields form={form} onChange={setForm} showErrors={submitted} />
      </form>
    </Card>
  );
}

/* -------------------------------- Membres -------------------------------- */

function MembersTab({ organization, members, limit }: { organization: Organization; members: Member[] | null; limit: number | null }) {
  const [inviting, setInviting] = useState<number | null>(null);
  const [removing, setRemoving] = useState<Member | null>(null);
  const { run, pending } = useAction();

  if (members === null) {
    return (
      <EmptyState
        icon={<Users />}
        title="Membres indisponibles"
        description="La liste des membres n’a pas pu être lue depuis Clerk. Réessayez dans un instant."
      />
    );
  }

  const atLimit = limit !== null && members.length >= limit;
  const nameOf = (m: Member) => [m.firstName, m.lastName].filter(Boolean).join(" ") || m.identifier || m.clerkUserId;

  return (
    <div className="space-y-4">
      <div className="glass flex flex-wrap items-center gap-4 rounded-[22px] px-5 py-4">
        <div className="min-w-56 flex-1">
          <UsageMeter label="Administrateurs du plan" used={members.length} limit={limit} icon={<Users />} />
        </div>
        <Button icon={<UserPlus />} onClick={() => setInviting(Date.now())} disabled={atLimit} title={atLimit ? "Limite du plan atteinte" : undefined}>
          Inviter un administrateur
        </Button>
      </div>

      {members.length === 0 ? (
        <EmptyState icon={<Users />} title="Aucun membre" description="Invitez le premier administrateur de cette organisation." />
      ) : (
        <ul className="surface divide-y divide-border overflow-hidden">
          {members.map((member, index) => (
            <motion.li
              key={member.clerkUserId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="flex items-center gap-3 px-5 py-3.5"
            >
              <Avatar name={nameOf(member)} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{nameOf(member)}</p>
                <p className="truncate text-xs text-muted-foreground">{member.identifier ?? "—"}</p>
              </div>
              {member.role && <StatusPill tone={member.role === "org:super_admin" ? "info" : "neutral"}>{ROLE_LABELS[member.role as OrgRole] ?? member.role}</StatusPill>}
              <Button variant="destructive-ghost" size="icon-sm" aria-label={`Retirer ${nameOf(member)}`} onClick={() => setRemoving(member)}>
                <UserMinus />
              </Button>
            </motion.li>
          ))}
        </ul>
      )}

      {inviting && <InviteDialog key={inviting} organization={organization} onClose={() => setInviting(null)} />}

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        loading={pending}
        tone="danger"
        title={`Retirer ${removing ? nameOf(removing) : ""} ?`}
        description="Cette personne perdra immédiatement l’accès au tableau de bord de l’organisation."
        confirmLabel="Retirer"
        onConfirm={async () => {
          if (!removing) return;
          const result = await run(() => removeAdmin(organization.id, removing.clerkUserId), { success: "Administrateur retiré" });
          if (result.ok) setRemoving(null);
        }}
      />
    </div>
  );
}

function InviteDialog({ organization, onClose }: { organization: Organization; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { run, pending } = useAction();
  const error = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? null : "Adresse email invalide.";

  const submit = async () => {
    setSubmitted(true);
    if (error) return;
    const result = await run(() => inviteAdmin(organization.id, email.trim()), {
      success: "Invitation envoyée",
      successDescription: `${email.trim()} recevra un email pour rejoindre ${organization.name}.`,
    });
    if (result.ok) onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      icon={<UserPlus />}
      title="Inviter un administrateur"
      description={`L’invitation passe par le backend, qui vérifie d’abord la limite du plan de ${organization.name}.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button loading={pending} onClick={submit}>
            Envoyer l’invitation
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Field label="Email" required error={submitted ? error : null}>
          {(p) => <AffixInput {...p} autoFocus prefix={<Mail />} type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} placeholder="prenom.nom@organisation.sn" />}
        </Field>
      </form>
    </Dialog>
  );
}

/* ---------------------------------- Plan ---------------------------------- */

function PlanTab({ organization, plans }: { organization: Organization; plans: Plan[] }) {
  const [target, setTarget] = useState<Plan | null>(null);
  const { run, pending } = useAction();
  const candidates = plans.filter((p) => p.active || p.id === organization.plan?.id);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {candidates.map((plan, index) => {
          const current = plan.id === organization.plan?.id;
          return (
            <motion.button
              key={plan.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={current ? undefined : { y: -3 }}
              disabled={current}
              onClick={() => setTarget(plan)}
              className={cn(
                "relative flex flex-col rounded-[26px] p-6 text-left transition-shadow",
                current ? "bg-primary text-primary-foreground shadow-[0_24px_48px_-24px_var(--primary)]" : "surface hover:shadow-[var(--glass-shadow)]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-lg font-semibold tracking-tight">{plan.name}</span>
                {current && (
                  <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                    <Check className="size-3.5" aria-hidden /> Plan actuel
                  </span>
                )}
                {!plan.active && <StatusPill tone="neutral">Archivé</StatusPill>}
              </div>
              <p className="tabular mt-4 text-3xl font-light tracking-tight">
                {formatXOF(plan.amount ?? 0)}
                <span className={cn("ml-1 text-sm", current ? "opacity-70" : "text-muted-foreground")}>/ {BILLING_PERIOD_LABELS[plan.billingPeriod]}</span>
              </p>
              <ul className={cn("mt-4 space-y-1 text-sm", current ? "opacity-85" : "text-muted-foreground")}>
                <li>{plan.maxAdmins ?? "∞"} administrateurs</li>
                <li>{plan.maxBornes ?? "∞"} bornes</li>
                <li>{plan.maxAiDocuments ?? "∞"} documents de référence</li>
              </ul>
              {!current && <span className="mt-5 text-sm font-semibold text-brand-ink">Passer à ce plan →</span>}
            </motion.button>
          );
        })}
      </div>

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        loading={pending}
        tone="neutral"
        title={`Passer ${organization.name} au plan ${target?.name ?? ""} ?`}
        description="Les nouvelles limites s’appliquent immédiatement. Si l’organisation dépasse une limite du nouveau plan, le backend refusera le changement."
        confirmLabel="Changer de plan"
        onConfirm={async () => {
          if (!target) return;
          const result = await run(() => changeOrganizationPlan(organization.id, target.id), { success: `Plan ${target.name} appliqué` });
          if (result.ok) setTarget(null);
        }}
      />
=======
import { Building2, Mail, MapPin, Phone, ShieldAlert, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { BackLink, InfoRow } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import type { AdminOrganizationRow } from "@/lib/data/types";
import { formatDate, formatNumber } from "@/lib/format";
import { Reveal } from "@/lib/motion/Reveal";
import { SuspendDialog } from "./SuspendDialog";

const SUB = { active: "Actif", expiree: "Expiré", suspendue: "Suspendu" } as const;

export function OrganizationDetail({ organization }: { organization: AdminOrganizationRow }) {
  const [open, setOpen] = useState(false);
  const active = organization.statut === "active";

  return (
    <>
      <BackLink href="/admin/organisations">Organisations</BackLink>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-soft-green text-green-ink">
            <Building2 className="size-6" aria-hidden />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-[26px] leading-tight font-semibold text-text">{organization.nom}</h1>
              <StatusPill tone={active ? "success" : "danger"} pulse={active}>
                {active ? "Active" : "Suspendue"}
              </StatusPill>
            </div>
            <p className="mt-1 text-sm text-muted">
              {organization.type} · cliente depuis le {formatDate(organization.dateCreation)}
            </p>
          </div>
        </div>
        <Button
          variant={active ? "danger" : "primary"}
          icon={active ? <ShieldAlert className="size-4" /> : <ShieldCheck className="size-4" />}
          onClick={() => setOpen(true)}
        >
          {active ? "Suspendre" : "Réactiver"}
        </Button>
      </header>

      <Reveal className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Coordonnées" />
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3 text-text">
              <MapPin className="size-4 text-muted" aria-hidden /> {organization.adresse ?? <span className="text-subtle italic">Non renseignée</span>}
            </li>
            <li className="flex items-center gap-3 text-text">
              <Phone className="size-4 text-muted" aria-hidden /> {organization.telephone ?? <span className="text-subtle italic">Non renseigné</span>}
            </li>
            <li className="flex items-center gap-3 text-text">
              <Mail className="size-4 text-muted" aria-hidden /> {organization.email ?? <span className="text-subtle italic">Non renseigné</span>}
            </li>
          </ul>
          {organization.description && <p className="mt-4 text-sm leading-relaxed text-muted">{organization.description}</p>}
        </Card>
        <Card>
          <CardHeader title="Abonnement et usage" />
          <dl className="divide-y divide-line">
            <InfoRow label="Plan">{organization.plan ?? "—"}</InfoRow>
            <InfoRow label="Abonnement">{organization.abonnementStatut ? SUB[organization.abonnementStatut] : "—"}</InfoRow>
            <InfoRow label="Bornes">{formatNumber(organization.bornes)}</InfoRow>
            <InfoRow label="Membres">{formatNumber(organization.membres)}</InfoRow>
          </dl>
        </Card>
      </Reveal>
      {open && <SuspendDialog organization={organization} onClose={() => setOpen(false)} />}
>>>>>>> 939f032 (First Commit)
    </>
  );
}
