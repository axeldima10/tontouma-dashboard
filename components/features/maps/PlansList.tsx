"use client";

import { Map as MapIcon, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileDrop } from "@/components/forms/FileDrop";
import { Field, TextInput } from "@/components/forms/Fields";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/states";
import { useReadOnly } from "@/components/states/ReadOnly";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { createPlan, requestPlanUpload } from "@/lib/actions/assets";
import type { PlanBatiment } from "@/lib/data/types";
import { Reveal } from "@/lib/motion/Reveal";
import { uploadToSignedUrl } from "@/lib/upload";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];

function NewPlanDialog({ onClose, basePath }: { onClose: () => void; basePath: string }) {
  const router = useRouter();
  const toast = useToast();
  const [nom, setNom] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const ticket = await requestPlanUpload({ fileName: file.name, contentType: file.type, sizeBytes: file.size });
      if (!ticket.ok) throw ticket.error;
      setProgress(0);
      await uploadToSignedUrl(ticket.data.uploadUrl, file, setProgress);
      const created = await createPlan({ nom, image_url: ticket.data.imageUrl });
      if (!created.ok) throw created.error;
      toast.show({ tone: "success", title: "Plan ajouté", description: "Placez maintenant les services et les bornes." });
      router.push(`${basePath}/plans/${created.data.id}`);
    } catch (error) {
      const e = error as { title?: string; message?: string };
      toast.show({ tone: "error", title: e.title ?? "Ajout impossible", description: e.message ?? "Réessayez." });
      setProgress(null);
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onClose={busy ? () => undefined : onClose}
      title="Nouveau plan du bâtiment"
      description="Une image du plan d’un étage. Les points sont enregistrés en pourcentage : ils restent justes sur la borne comme sur le téléphone."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          <Button onClick={submit} loading={busy} disabled={!file || !nom.trim()}>
            Ajouter le plan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nom" required>
          {(p) => <TextInput {...p} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Rez-de-chaussée" autoFocus disabled={busy} />}
        </Field>
        <FileDrop
          accept={IMAGE_TYPES}
          formatsLabel="PNG, JPG, SVG ou WebP"
          maxBytes={5 * 1024 * 1024}
          file={file}
          onFile={setFile}
          disabled={busy}
          progress={progress}
        />
      </div>
    </Dialog>
  );
}

export function PlansList({ plans, basePath }: { plans: (PlanBatiment & { points: number })[]; basePath: string }) {
  const { readOnly } = useReadOnly();
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Plans du bâtiment"
        description="Placez les services et les bornes sur vos plans : l’assistant guide les citoyens jusqu’au bon guichet."
        actions={
          !readOnly && (
            <Button magnetic icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>
              Nouveau plan
            </Button>
          )
        }
      />
      {plans.length === 0 ? (
        <EmptyState
          size="page"
          icon={<MapIcon />}
          title="Aucun plan pour l’instant"
          description="Ajoutez l’image du plan d’un étage, puis cliquez dessus pour y placer vos services et vos bornes."
          action={!readOnly && <Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>Ajouter un plan</Button>}
        />
      ) : (
        <Reveal className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <Link
              key={plan.id}
              href={`${basePath}/plans/${plan.id}`}
              className="surface group overflow-hidden transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-green/40"
            >
              <div className="aspect-[3/2] overflow-hidden border-b border-line bg-surface-2">
                {plan.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element -- image servie par le stockage objet
                  <img
                    src={plan.image_url}
                    alt=""
                    className="size-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                )}
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <p className="font-display truncate font-semibold text-text">{plan.nom}</p>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted">
                  <MapPin className="size-3.5" aria-hidden />
                  {plan.points} point{plan.points > 1 ? "s" : ""}
                </span>
              </div>
            </Link>
          ))}
        </Reveal>
      )}
      {open && <NewPlanDialog onClose={() => setOpen(false)} basePath={basePath} />}
    </>
  );
}
