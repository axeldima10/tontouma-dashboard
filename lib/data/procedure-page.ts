import "server-only";
import { ApiError } from "@/lib/api/errors";
import { loadOrg } from "./load";

/** Données de l'éditeur de démarche (création si `procedureId` est null). */
export function loadProcedureEditor(orgId: string, serviceId: string, procedureId: string | null) {
  return loadOrg(orgId, async (r, ctx) => {
    const orNull = <T,>(promise: Promise<T>) =>
      promise.catch((error: unknown) => {
        if (error instanceof ApiError && error.kind === "notFound") return null;
        throw error;
      });
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
  });
}
