"use client";

import { FolderPlus, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { createDepartment, saveService, updateDepartment } from "@/lib/actions/content";
import type { Department, Service } from "@/lib/api/contract";
import { useAction, violationFor } from "@/lib/hooks/useAction";
import type { ActionResult } from "@/lib/actions/result";
import { ServiceFields, serviceErrors, toServiceForm, toServiceRequest } from "./ServiceForm";

type DepartmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
};

export function DepartmentDialog({ open, onOpenChange, department }: DepartmentDialogProps) {
  const [name, setName] = useState(department?.name ?? "");
  const [description, setDescription] = useState(department?.description ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [last, setLast] = useState<ActionResult<unknown> | null>(null);
  const { run, pending } = useAction();

  const error = submitted && !name.trim() ? "Le nom est obligatoire." : violationFor(last, "name");

  const submit = async () => {
    setSubmitted(true);
    if (!name.trim()) return;
    const input = { name: name.trim(), description: description.trim() || null };
    const result = await run(() => (department ? updateDepartment(department.id, input) : createDepartment(input)), {
      success: department ? "Département renommé" : "Département créé",
    });
    setLast(result);
    if (result.ok) onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<FolderPlus />}
      title={department ? "Modifier le département" : "Nouveau département"}
      description="Les départements regroupent vos services (État civil, Urbanisme…)."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button loading={pending} onClick={submit}>
            {department ? "Enregistrer" : "Créer le département"}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Field label="Nom" required error={error}>
          {(p) => <Input {...p} autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={255} placeholder="État civil" />}
        </Field>
        <Field label="Description">
          {(p) => <Textarea {...p} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />}
        </Field>
      </form>
    </Dialog>
  );
}

type ServiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: Department[];
  defaultDepartmentId?: string;
  basePath: string;
  service?: Service | null;
};

/** Création (ou édition rapide) d'un service. Enregistré en brouillon : jamais publié automatiquement. */
export function ServiceDialog({ open, onOpenChange, departments, defaultDepartmentId, basePath, service = null }: ServiceDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState(() => toServiceForm(service, departments, defaultDepartmentId));
  const [submitted, setSubmitted] = useState(false);
  const { run, pending } = useAction();
  const errors = serviceErrors(form);

  const submit = async () => {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    const result = await run(() => saveService(service?.id ?? null, toServiceRequest(form)), {
      success: service ? "Service enregistré" : "Service créé en brouillon",
      successDescription: service ? undefined : "Ajoutez ses démarches, puis publiez-le quand il est prêt.",
    });
    if (!result.ok) return;
    onOpenChange(false);
    if (!service) router.push(`${basePath}/services/${result.data.id}`);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      dismissible={false}
      icon={<Layers />}
      title={service ? "Modifier le service" : "Nouveau service"}
      description="Un guichet ou un bureau que les citoyens peuvent consulter."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button loading={pending} onClick={submit}>
            {service ? "Enregistrer" : "Créer le brouillon"}
          </Button>
        </>
      }
    >
      <ServiceFields form={form} onChange={setForm} departments={departments} errors={errors} showErrors={submitted} />
    </Dialog>
  );
}
