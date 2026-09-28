"use client";

import { MailPlus, Send, UserMinus, Users, X } from "lucide-react";
import { useState } from "react";
import { Field, Select, TextInput } from "@/components/forms/Fields";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/states";
import { useReadOnly } from "@/components/states/ReadOnly";
import { IconButton, UsageMeter } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusPill } from "@/components/ui/StatusPill";
import { changeMemberRole, inviteMember, removeMember, revokeInvitation } from "@/lib/actions/management";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { Invitation, Member, MemberRole } from "@/lib/data/types";
import { formatDate, formatRelative } from "@/lib/format";
import { useAction } from "@/lib/hooks/useAction";
import { Reveal } from "@/lib/motion/Reveal";

const roleLabel = (role: MemberRole) => ROLE_LABELS[`org:${role}`];

type MembersManagerProps = {
  members: Member[];
  invitations: Invitation[];
  limit: number;
  currentUserId: string;
  now: string;
};

export function MembersManager({ members, invitations, limit, currentUserId, now }: MembersManagerProps) {
  const { readOnly } = useReadOnly();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("admin");
  const [toRemove, setToRemove] = useState<Member | null>(null);
  const invite = useAction();
  const update = useAction();
  const used = members.length + invitations.length;
  const atLimit = used >= limit;

  const submit = async () => {
    const result = await invite.run(() => inviteMember({ email, role }), {
      success: "Invitation envoyée",
      successDescription: `${email} recevra un email pour rejoindre l’organisation.`,
    });
    if (result.ok) setEmail("");
  };

  return (
    <>
      <PageHeader title="Membres" description="Les personnes qui gèrent le contenu de votre organisation." />
      <Reveal className="grid gap-5 xl:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader title="Équipe" icon={<Users />} description={`${members.length} membre(s)`} />
            <ul className="-mx-2 divide-y divide-line">
              {members.map((m) => {
                const isMe = m.id === currentUserId;
                return (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 px-2 py-3 sm:flex-nowrap">
                    <span className="font-display grid size-10 shrink-0 place-items-center rounded-full bg-soft-green text-[13px] font-semibold text-green-ink">
                      {m.nom
                        .split(/\s+/)
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text">
                        {m.nom} {isMe && <span className="font-normal text-muted">(vous)</span>}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {m.email} · depuis le {formatDate(m.depuis, { month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <div className="w-44">
                      <Select
                        aria-label={`Rôle de ${m.nom}`}
                        value={m.role}
                        disabled={readOnly || update.pending}
                        onChange={(e) =>
                          update.run(() => changeMemberRole(m.id, e.target.value as MemberRole), {
                            success: `${m.nom} est maintenant ${roleLabel(e.target.value as MemberRole).toLowerCase()}`,
                          })
                        }
                        className="h-9"
                      >
                        <option value="super_admin">{roleLabel("super_admin")}</option>
                        <option value="admin">{roleLabel("admin")}</option>
                      </Select>
                    </div>
                    {!readOnly && !isMe && (
                      <IconButton label={`Retirer ${m.nom}`} tone="danger" onClick={() => setToRemove(m)}>
                        <UserMinus />
                      </IconButton>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Invitations en attente" icon={<Send />} />
            {invitations.length === 0 ? (
              <EmptyState icon={<Send />} title="Aucune invitation en attente" description="Les invitations envoyées apparaissent ici jusqu’à leur acceptation." />
            ) : (
              <ul className="-mx-2 divide-y divide-line">
                {invitations.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 px-2 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{i.email}</p>
                      <p className="text-xs text-muted">
                        {roleLabel(i.role)} · expire {formatRelative(i.dateExpiration, new Date(now))}
                      </p>
                    </div>
                    <StatusPill tone="info" pulse>
                      Envoyée
                    </StatusPill>
                    {!readOnly && (
                      <IconButton
                        label={`Révoquer l’invitation de ${i.email}`}
                        tone="danger"
                        onClick={() => update.run(() => revokeInvitation(i.id), { success: "Invitation révoquée" })}
                      >
                        <X />
                      </IconButton>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside className="min-w-0 space-y-5">
          <Card>
            <CardHeader title="Inviter un membre" icon={<MailPlus />} />
            <UsageMeter label="Places utilisées" used={used} limit={limit} />
            <p className="mt-2 text-xs text-muted">Les invitations en attente comptent dans la limite du plan.</p>
            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <fieldset disabled={readOnly || atLimit} className="space-y-4">
                <Field label="Email" required>
                  {(p) => <TextInput {...p} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@mairie.sn" />}
                </Field>
                <Field
                  label="Rôle"
                  hint={role === "super_admin" ? "Accès complet : membres, bornes, abonnement, paramètres." : "Contenu, documents et plans uniquement."}
                >
                  {(p) => (
                    <Select {...p} value={role} onChange={(e) => setRole(e.target.value as MemberRole)}>
                      <option value="admin">{roleLabel("admin")}</option>
                      <option value="super_admin">{roleLabel("super_admin")}</option>
                    </Select>
                  )}
                </Field>
                <Button type="submit" className="w-full" icon={<Send className="size-4" />} loading={invite.pending} disabled={!email.trim()}>
                  Envoyer l’invitation
                </Button>
              </fieldset>
              {atLimit && (
                <p className="rounded-xl bg-warning-soft px-3 py-2 text-xs text-warning">
                  Limite du plan atteinte. Révoquez une invitation, retirez un membre ou changez de plan.
                </p>
              )}
            </form>
          </Card>
        </aside>
      </Reveal>

      <ConfirmDialog
        open={toRemove !== null}
        onCancel={() => setToRemove(null)}
        onConfirm={async () => {
          if (!toRemove) return;
          const result = await update.run(() => removeMember(toRemove.id), { success: `${toRemove.nom} a été retiré(e)` });
          if (result.ok) setToRemove(null);
        }}
        loading={update.pending}
        tone="danger"
        title={`Retirer ${toRemove?.nom ?? ""} ?`}
        description="Cette personne perdra immédiatement l’accès au tableau de bord de l’organisation."
        confirmLabel="Retirer"
      />
    </>
  );
}
