import "server-only";
import { ApiError } from "@/lib/api/errors";
import { loadOrg } from "./load";

/** Données de l'éditeur de démarche (création si `procedureId` est null). `null` = introuvable (404). */
export function loadProcedureEditor(orgId: string, serviceId: string, procedureId: string | null) {
  return loadOrg(orgId, async (r, ctx) => {
    const orNull = <T,>(promise: Promise<T>) =>
      promise.catch((error: unknown) => {
        if (error instanceof ApiError && error.kind === "notFound") return null;
        throw error;
      });
    const [service, procedure, services] = await Promise.all([
      orNull(r.getService(ctx, serviceId)),
      procedureId ? orNull(r.getProcedure(ctx, procedureId)) : Promise.resolve(null),
      r.listServices(ctx),
    ]);
    if (!service || (procedureId && !procedure)) return null;
    // Documents de la base de connaissances rattachés à cette démarche (sourceProcedureId).
    const [allDocuments, procedureForm, publicForm] = procedure
      ? await Promise.all([r.listDocuments(ctx), r.getForm(ctx, procedure.id), r.getPublicForm(procedure.id).catch(() => null)])
      : [[], null, null];
    const documents = allDocuments.filter((d) => d.sourceProcedureId === procedure?.id);
    return { service, procedure, services, documents, procedureForm, publicForm };
  });
}
