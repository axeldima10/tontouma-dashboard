"use client";

import { ArrowLeft, Clock, Coins, FileCheck2, Globe2, ListChecks, Mail, MapPin, Phone, Search, Timer, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormPreview } from "@/components/features/forms/FormPreview";
import { toFormRequest, toFormState } from "@/components/features/forms/model";
import { PageHeader } from "@/components/shell/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { StatusPill } from "@/components/ui/StatusPill";
import type { Form, Procedure, PublicOrganization, PublicService } from "@/lib/api/contract";
import { formatXOF, summarizeOpeningHours } from "@/lib/format";

type PublicPreviewProps = {
  basePath: string;
  organization: PublicOrganization;
  services: PublicService[];
  procedures: Procedure[];
  query: string;
  selected: { procedure: Procedure; form: Form | null } | null;
};

/**
 * Ce que voient les citoyens (endpoints publics, sans jeton) : seul le contenu publié apparaît.
 * La recherche utilise le paramètre `q` de l'endpoint public des démarches.
 */
export function PublicPreview({ basePath, organization, services, procedures, query, selected }: PublicPreviewProps) {
  const router = useRouter();
  const [q, setQ] = useState(query);
  const [pending, startTransition] = useTransition();
  const href = (params: Record<string, string | undefined>) => {
    const search = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])));
    const text = search.toString();
    return `${basePath}/apercu${text ? `?${text}` : ""}`;
  };

  const departments = [...services.reduce((map, s) => map.set(s.departmentName ?? "Autres services", [...(map.get(s.departmentName ?? "Autres services") ?? []), s]), new Map<string, PublicService[]>())];

  return (
    <>
      <PageHeader
        kicker="Contenu"
        title="Aperçu public"
        description="Exactement ce que reçoivent la borne et l’application citoyenne : uniquement le contenu publié."
        badges={
          <>
            <StatusPill tone="success">{services.length} service{services.length > 1 ? "s" : ""} publié{services.length > 1 ? "s" : ""}</StatusPill>
            <StatusPill tone="info">{procedures.length} démarche{procedures.length > 1 ? "s" : ""}{query ? " trouvée" : " publiée"}{procedures.length > 1 ? "s" : ""}</StatusPill>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* Appareil citoyen */}
        <div className="mx-auto w-full max-w-[420px]">
          <div className="rounded-[44px] bg-primary p-2.5 shadow-[0_40px_80px_-40px_var(--primary)]">
            <div className="relative h-[760px] overflow-hidden rounded-[36px] bg-background">
              <div className="absolute top-2 left-1/2 z-10 h-6 w-28 -translate-x-1/2 rounded-full bg-primary" aria-hidden />
              <div className="scrollbar-thin h-full overflow-y-auto px-4 pt-12 pb-6">
                <section className="glass rounded-[26px] p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={organization.name} imageUrl={organization.logoUrl} size={48} square />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-foreground">{organization.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{organization.type ?? "Organisation"}</p>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {organization.address && <Info icon={<MapPin />}>{organization.address}</Info>}
                    {organization.phone && <Info icon={<Phone />}>{organization.phone}</Info>}
                    {organization.email && <Info icon={<Mail />}>{organization.email}</Info>}
                    <Info icon={<Clock />}>{summarizeOpeningHours(organization.openingHours)}</Info>
                  </ul>
                </section>

                <form
                  className="relative mt-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    startTransition(() => router.push(href({ q: q.trim() || undefined })));
                  }}
                >
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-subtle" aria-hidden />
                  <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Rechercher une démarche…"
                    aria-label="Rechercher une démarche publiée"
                    className="h-11 w-full rounded-full border border-[var(--glass-border)] bg-card pr-4 pl-10 text-sm text-foreground shadow-[var(--card-shadow)] outline-none focus:ring-4 focus:ring-brand/15"
                  />
                </form>
                {query && (
                  <Link href={href({})} className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <X className="size-3" /> Effacer « {query} »
                  </Link>
                )}

                <p className="kicker mt-5 mb-2">{query ? "Résultats" : "Démarches"}</p>
                <ul className={`space-y-2 transition-opacity ${pending ? "opacity-50" : ""}`}>
                  {procedures.length === 0 && (
                    <li className="hatch rounded-2xl px-4 py-6 text-center text-xs text-muted-foreground">
                      {query ? "Aucune démarche publiée ne correspond." : "Aucune démarche publiée : les citoyens ne voient rien ici."}
                    </li>
                  )}
                  {procedures.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={href({ q: query || undefined, procedure: p.id })}
                        scroll={false}
                        className={`block rounded-2xl px-3.5 py-3 shadow-[var(--card-shadow)] transition hover:-translate-y-0.5 ${selected?.procedure.id === p.id ? "bg-primary text-primary-foreground" : "bg-card"}`}
                      >
                        <p className="text-sm font-semibold">{p.title}</p>
                        <p className={`mt-0.5 text-xs ${selected?.procedure.id === p.id ? "opacity-75" : "text-muted-foreground"}`}>
                          {p.serviceName} · {p.cost === null ? "Coût non précisé" : p.cost === 0 ? "Gratuit" : formatXOF(p.cost)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>

                {!query &&
                  departments.map(([department, list]) => (
                    <section key={department} className="mt-5">
                      <p className="kicker mb-2">{department}</p>
                      <ul className="space-y-2">
                        {list.map((s) => (
                          <li key={s.id} className="rounded-2xl bg-card/70 px-3.5 py-3 shadow-[var(--card-shadow)]">
                            <p className="text-sm font-semibold text-foreground">{s.name}</p>
                            {s.location && <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{s.location}</p>}
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" />{summarizeOpeningHours(s.openingHours)}</p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Détail d'une démarche */}
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.section key={selected.procedure.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="surface p-6">
                <Link href={href({ q: query || undefined })} scroll={false} className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="size-3.5" /> Fermer
                </Link>
                <p className="kicker">{selected.procedure.serviceName}</p>
                <h2 className="mt-1 text-2xl font-light tracking-tight text-foreground">{selected.procedure.title}</h2>
                {selected.procedure.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{selected.procedure.description}</p>}
                <dl className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Fact icon={<Coins />} label="Coût" value={selected.procedure.cost === null ? "Non précisé" : selected.procedure.cost === 0 ? "Gratuit" : formatXOF(selected.procedure.cost)} />
                  <Fact icon={<Timer />} label="Délai" value={selected.procedure.processingDays === null ? "Non précisé" : `${selected.procedure.processingDays} jour${selected.procedure.processingDays > 1 ? "s" : ""}`} />
                  <Fact icon={<MapPin />} label="Lieu" value={selected.procedure.place ?? "Non précisé"} />
                </dl>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><ListChecks className="size-4" /> Conditions</p>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                      {(selected.procedure.conditions ?? "").split(/\r?\n/).filter(Boolean).map((c, i) => <li key={i}>{c}</li>)}
                    </ol>
                  </div>
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><FileCheck2 className="size-4" /> À apporter</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {[...selected.procedure.requiredDocuments].sort((a, b) => a.displayOrder - b.displayOrder).map((d) => <li key={d.id}>{d.label}</li>)}
                    </ul>
                  </div>
                </div>
                {selected.procedure.additionalInfo && <p className="mt-5 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">{selected.procedure.additionalInfo}</p>}
              </div>
              <div className="glass rounded-[28px] p-6">
                <p className="mb-4 text-sm font-semibold text-foreground">Formulaire reçu par les citoyens</p>
                {selected.form ? <FormPreview form={toFormRequest(toFormState(selected.form, selected.procedure.title))} /> : <p className="hatch rounded-2xl px-4 py-8 text-center text-sm text-muted-foreground">Aucun formulaire publié pour cette démarche.</p>}
              </div>
            </motion.section>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass hidden flex-col items-center justify-center rounded-[30px] p-10 text-center xl:flex">
              <Globe2 className="size-10 text-muted-foreground" aria-hidden />
              <p className="mt-4 text-lg font-light tracking-tight text-foreground">Choisissez une démarche</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">Son détail public et son formulaire s’afficheront ici, tels que les citoyens les reçoivent.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

function Info({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-1.5 [&_svg]:mt-0.5 [&_svg]:size-3 [&_svg]:shrink-0">
      {icon}
      <span>{children}</span>
    </li>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted px-4 py-3">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground [&_svg]:size-3.5">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}
