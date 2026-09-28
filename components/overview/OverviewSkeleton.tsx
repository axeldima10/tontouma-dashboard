import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

/** Squelette calqué sur la mise en page finale (pas de saut à l'arrivée des données). */
export function OrgOverviewSkeleton() {
  return (
    <LoadingRegion label="Chargement de la vue d’ensemble" className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="surface space-y-5 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-16 rounded-full" />
          </div>
        </div>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-3.5 w-full" />
          </div>
        ))}
      </div>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="surface space-y-3 p-4">
              <Skeleton className="size-9 rounded-[11px]" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        <div className="surface flex items-center gap-6 p-6">
          <Skeleton className="size-32 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}

export function AdminOverviewSkeleton() {
  return (
    <LoadingRegion label="Chargement du tableau de bord" className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="surface space-y-3 p-4">
            <Skeleton className="size-9 rounded-[11px]" />
            <Skeleton className="h-7 w-14" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="surface space-y-4 p-6">
          <Skeleton className="h-4 w-48" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
        <div className="surface space-y-4 p-6">
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}

export function GenericPageSkeleton() {
  return (
    <LoadingRegion label="Chargement" className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-72 w-full rounded-[18px]" />
    </LoadingRegion>
  );
}
