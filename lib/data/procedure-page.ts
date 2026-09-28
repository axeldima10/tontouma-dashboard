import "server-only";
import { ApiError } from "@/lib/api/errors";
import { loadOrg } from "./load";

<<<<<<< HEAD
/** Données de l'éditeur de démarche (création si `procedureId` est null). `null` = introuvable (404). */
=======
/** Données de l'éditeur de démarche (création si `procedureId` est null). */
>>>>>>> 939f032 (First Commit)
export function loadProcedureEditor(orgId: string, serviceId: string, procedureId: string | null) {
  return loadOrg(orgId, async (r, ctx) => {
    const orNull = <T,>(promise: Promise<T>) =>
      promise.catch((error: unknown) => {
        if (error instanceof ApiError && error.kind === "notFound") return null;
        throw error;
      });
<<<<<<< HEAD
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
=======
    const [service, procedure] = await Promise.all([
      orNull(r.getService(ctx, serviceId)),
      procedureId ? orNull(r.getProcedure(ctx, procedureId)) : Promise.resolve(null),
    ]);
    if (!service || (procedureId && !procedure)) return null;
    const [services, documents] = await Promise.all([
      r.listServices(ctx),
      procedure ? r.listDocuments(ctx) : Promise.resolve([]),
    ]);
    return {
      service,
      procedure,
      services,
      documents: procedure ? documents.filter((d) => d.procedure_id === procedure.id) : [],
    };
>>>>>>> 939f032 (First Commit)
  });
}
