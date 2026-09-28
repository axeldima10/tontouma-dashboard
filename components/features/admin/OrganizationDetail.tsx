"use client";

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
    </>
  );
}
