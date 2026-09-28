"use client";

import { Crosshair, MapPinOff, MonitorSmartphone, Navigation, Pencil, Save, Store, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Field, TextArea, TextInput } from "@/components/forms/Fields";
import { useReadOnly } from "@/components/states/ReadOnly";
import { BackLink, FilterChips, IconButton } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deletePlan, deletePosition, renamePlan, savePosition } from "@/lib/actions/assets";
import { updateService } from "@/lib/actions/content";
import { cn } from "@/lib/cn";
import type { Borne, PlanBatiment, Position, ServiceOffering } from "@/lib/data/types";
import { useAction } from "@/lib/hooks/useAction";
import { gsap, useGSAP, MEDIA } from "@/lib/motion/gsap";

type Entity = { type: Position["entite_type"]; id: string; label: string; detail: string | null };

type MapEditorProps = {
  basePath: string;
  plan: PlanBatiment & { positions: Position[] };
  services: ServiceOffering[];
  bornes: Borne[];
  canPlaceBornes: boolean;
};

const round = (v: number) => Math.round(v * 100) / 100;
const clamp = (v: number) => Math.min(100, Math.max(0, v));

/**
 * Éditeur de plan : image + calque <svg> natif. Les points sont en POURCENTAGES de l'image
 * (jamais en pixels) pour s'afficher au même endroit sur le tableau de bord, la borne et le téléphone.
 */
export function MapEditor({ basePath, plan, services, bornes, canPlaceBornes }: MapEditorProps) {
  const router = useRouter();
  const { readOnly } = useReadOnly();
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState(plan.positions);
  const [selected, setSelected] = useState<{ type: Position["entite_type"]; id: string } | null>(null);
  const [tab, setTab] = useState<Position["entite_type"]>("service");
  const [dragging, setDragging] = useState<string | null>(null);
  const [name, setName] = useState(plan.nom);
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { run } = useAction();
  const del = useAction();
  const orientation = useAction();

  const entities: Entity[] = [
    ...services.map((s) => ({ type: "service" as const, id: s.id, label: s.nom, detail: s.localisation })),
    ...bornes.map((b) => ({ type: "borne" as const, id: b.id, label: b.nom, detail: b.localisation })),
  ];
  const labelOf = (p: Position) => entities.find((e) => e.type === p.entite_type && e.id === p.entite_id)?.label ?? "—";
  const positionOf = (type: Position["entite_type"], id: string) => positions.find((p) => p.entite_type === type && p.entite_id === id);
  const canEdit = (type: Position["entite_type"]) => !readOnly && (type === "service" || canPlaceBornes);
  const selectedEntity = selected ? entities.find((e) => e.type === selected.type && e.id === selected.id) : undefined;
  const selectedPosition = selected ? positionOf(selected.type, selected.id) : undefined;
  const placing = Boolean(selected && !selectedPosition && canEdit(selected.type));

  // Les repères tombent en place à l'ouverture.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        gsap.from(".map-marker", { y: -24, autoAlpha: 0, duration: 0.7, ease: "bounce.out", stagger: 0.06, delay: 0.25 });
      });
      return () => mm.revert();
    },
    { scope: canvasRef },
  );

  const toPercent = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: round(clamp(((clientX - rect.left) / rect.width) * 100)),
      y: round(clamp(((clientY - rect.top) / rect.height) * 100)),
    };
  };

  const persist = (type: Position["entite_type"], id: string, x: number, y: number) => {
    const existing = positionOf(type, id);
    const optimistic: Position = existing
      ? { ...existing, coordonnee_x: x, coordonnee_y: y }
      : { id: `tmp-${id}`, plan_id: plan.id, entite_type: type, entite_id: id, coordonnee_x: x, coordonnee_y: y };
    setPositions((list) => [...list.filter((p) => !(p.entite_type === type && p.entite_id === id)), optimistic]);
    void run(() => savePosition(plan.id, { entite_type: type, entite_id: id, coordonnee_x: x, coordonnee_y: y }), {
      success: existing ? undefined : "Point placé",
      onSuccess: (saved) =>
        setPositions((list) => [...list.filter((p) => !(p.entite_type === type && p.entite_id === id)), saved]),
    });
  };

  const onCanvasClick = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!placing || !selected || dragging) return;
    const { x, y } = toPercent(event.clientX, event.clientY);
    persist(selected.type, selected.id, x, y);
    const marker = svgRef.current;
    if (marker && window.matchMedia(MEDIA.motion).matches) {
      requestAnimationFrame(() =>
        gsap.from(marker.querySelector(`[data-marker="${selected.type}-${selected.id}"]`), {
          scale: 0.2,
          transformOrigin: "50% 100%",
          duration: 0.6,
          ease: "back.out(2.5)",
        }),
      );
    }
  };

  const startDrag = (event: ReactPointerEvent<SVGGElement>, p: Position) => {
    setSelected({ type: p.entite_type, id: p.entite_id });
    if (!canEdit(p.entite_type)) return;
    event.stopPropagation();
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    setDragging(p.id);
  };

  const onDrag = (event: ReactPointerEvent<SVGGElement>, p: Position) => {
    if (dragging !== p.id) return;
    const { x, y } = toPercent(event.clientX, event.clientY);
    setPositions((list) => list.map((item) => (item.id === p.id ? { ...item, coordonnee_x: x, coordonnee_y: y } : item)));
  };

  const endDrag = (p: Position) => {
    if (dragging !== p.id) return;
    setDragging(null);
    const current = positions.find((item) => item.id === p.id);
    if (current) persist(current.entite_type, current.entite_id, current.coordonnee_x, current.coordonnee_y);
  };

  /** Clavier : flèches pour déplacer finement le point sélectionné (Maj = pas plus grand). */
  const onMarkerKey = (event: KeyboardEvent<SVGGElement>, p: Position) => {
    const step = event.shiftKey ? 2 : 0.5;
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelected({ type: p.entite_type, id: p.entite_id });
      return;
    }
    if (!delta || !canEdit(p.entite_type)) return;
    event.preventDefault();
    persist(p.entite_type, p.entite_id, round(clamp(p.coordonnee_x + delta[0])), round(clamp(p.coordonnee_y + delta[1])));
  };

  const removePoint = () => {
    if (!selectedPosition) return;
    const target = selectedPosition;
    setPositions((list) => list.filter((p) => p.id !== target.id));
    void run(() => deletePosition(plan.id, target.id), { success: "Point retiré du plan" });
  };

  const selectedService = selected?.type === "service" ? services.find((s) => s.id === selected.id) : undefined;
  const [orientationDraft, setOrientationDraft] = useState<{ id: string; value: string } | null>(null);
  const orientationValue =
    selectedService && orientationDraft?.id === selectedService.id
      ? orientationDraft.value
      : (selectedService?.description_orientation ?? "");

  const saveOrientation = () => {
    if (!selectedService) return;
    const s = selectedService;
    const input = {
      departement_id: s.departement_id,
      nom: s.nom,
      description: s.description,
      localisation: s.localisation,
      telephone: s.telephone,
      email: s.email,
      horaires: s.horaires,
      description_orientation: orientationValue.trim() || null,
    };
    void orientation.run(() => updateService(s.id, input), {
      success: "Indication d’orientation enregistrée",
      onSuccess: () => setOrientationDraft(null),
    });
  };

  const list = entities.filter((e) => e.type === tab);
  const placedCount = (type: Position["entite_type"]) => positions.filter((p) => p.entite_type === type).length;

  return (
    <>
      <BackLink href={`${basePath}/plans`}>Plans du bâtiment</BackLink>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {renaming ? (
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setRenaming(false);
                if (name.trim() && name !== plan.nom) void run(() => renamePlan(plan.id, name), { success: "Plan renommé" });
              }}
            >
              <TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus aria-label="Nom du plan" className="h-11 text-lg" />
              <Button type="submit" size="sm">
                OK
              </Button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="font-display text-[26px] leading-tight font-semibold text-text sm:text-[30px]">{name}</h1>
              {!readOnly && (
                <IconButton label="Renommer le plan" onClick={() => setRenaming(true)}>
                  <Pencil />
                </IconButton>
              )}
            </div>
          )}
          <p className="mt-1.5 text-sm text-muted">
            {placedCount("service")} service(s) et {placedCount("borne")} borne(s) placés
          </p>
        </div>
        {!readOnly && (
          <Button variant="ghost" icon={<Trash2 className="size-4" />} onClick={() => setConfirmDelete(true)}>
            Supprimer le plan
          </Button>
        )}
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
            <ul className="flex flex-wrap items-center gap-4 text-xs text-muted" aria-label="Légende">
              <li className="flex items-center gap-1.5">
                <span className="grid size-5 place-items-center rounded-full bg-green text-white">
                  <Store className="size-3" aria-hidden />
                </span>
                Service
              </li>
              <li className="flex items-center gap-1.5">
                <span className="grid size-5 place-items-center rounded-md bg-violet text-white">
                  <MonitorSmartphone className="size-3" aria-hidden />
                </span>
                Borne
              </li>
            </ul>
            {placing && selectedEntity && (
              <p role="status" className="inline-flex items-center gap-1.5 rounded-full bg-soft-green px-3 py-1 text-xs font-medium text-green-ink">
                <Crosshair className="size-3.5" aria-hidden />
                Cliquez sur le plan pour placer « {selectedEntity.label} »
              </p>
            )}
          </div>

          <div ref={canvasRef} className="relative overflow-hidden rounded-xl border border-line bg-surface-2">
            {plan.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- image du plan servie par le stockage objet
              <img src={plan.image_url} alt={`Plan : ${plan.nom}`} className="block h-auto w-full select-none" draggable={false} />
            ) : (
              <div className="aspect-[3/2]" />
            )}
            <svg
              ref={svgRef}
              className={cn("absolute inset-0 size-full", placing ? "cursor-crosshair" : "cursor-default")}
              onPointerDown={onCanvasClick}
              role="group"
              aria-label="Points placés sur le plan"
            >
              {positions.map((p) => {
                const isSelected = selected?.type === p.entite_type && selected.id === p.entite_id;
                const isService = p.entite_type === "service";
                return (
                  <svg key={p.id} x={`${p.coordonnee_x}%`} y={`${p.coordonnee_y}%`} overflow="visible">
                    <g
                      className="map-marker"
                      data-marker={`${p.entite_type}-${p.entite_id}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`${isService ? "Service" : "Borne"} : ${labelOf(p)}${canEdit(p.entite_type) ? " — flèches pour déplacer" : ""}`}
                      aria-pressed={isSelected}
                      onPointerDown={(e) => startDrag(e, p)}
                      onPointerMove={(e) => onDrag(e, p)}
                      onPointerUp={() => endDrag(p)}
                      onKeyDown={(e) => onMarkerKey(e, p)}
                      style={{ cursor: canEdit(p.entite_type) ? (dragging === p.id ? "grabbing" : "grab") : "pointer", outline: "none" }}
                    >
                      {isSelected && (
                        <circle r="22" cy="-18" fill="none" stroke={isService ? "var(--green)" : "var(--violet)"} strokeWidth="2" opacity="0.5">
                          <animate attributeName="r" values="18;26;18" dur="1.8s" repeatCount="indefinite" />
                        </circle>
                      )}
                      {isService ? (
                        <path
                          d="M0 0 C-4 -8 -14 -14 -14 -24 A14 14 0 1 1 14 -24 C14 -14 4 -8 0 0 Z"
                          fill="var(--green)"
                          stroke="white"
                          strokeWidth="2.5"
                          style={{ filter: "drop-shadow(0 3px 5px rgba(0,0,0,.25))" }}
                        />
                      ) : (
                        <>
                          <rect x="-14" y="-36" width="28" height="28" rx="8" fill="var(--violet)" stroke="white" strokeWidth="2.5" style={{ filter: "drop-shadow(0 3px 5px rgba(0,0,0,.25))" }} />
                          <path d="M0 -8 L-5 0 L5 0 Z" fill="var(--violet)" />
                        </>
                      )}
                      <text x="0" y={isService ? -20 : -17} textAnchor="middle" fontSize="12" fontWeight="700" fill="white" aria-hidden>
                        {isService ? "S" : "B"}
                      </text>
                      {isSelected && (
                        <g aria-hidden>
                          <rect x="-70" y="-66" width="140" height="22" rx="11" fill="var(--panel)" stroke="var(--line)" />
                          <text x="0" y="-51" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text)">
                            {labelOf(p).length > 22 ? `${labelOf(p).slice(0, 21)}…` : labelOf(p)}
                          </text>
                        </g>
                      )}
                    </g>
                  </svg>
                );
              })}
            </svg>
          </div>
          <p className="mt-2 px-1 text-xs text-muted">
            Astuce : sélectionnez un point puis utilisez les flèches du clavier pour l’ajuster (Maj pour aller plus vite).
          </p>
        </Card>

        <aside className="min-w-0 space-y-4">
          <Card className="p-4">
            <FilterChips
              label="Type d’élément"
              value={tab}
              onChange={setTab}
              chips={[
                { value: "service", label: "Services", count: services.length },
                { value: "borne", label: "Bornes", count: bornes.length },
              ]}
            />
            <ul className="mt-3 max-h-[46vh] space-y-1 overflow-y-auto scrollbar-thin">
              {list.length === 0 && (
                <li className="px-2 py-6 text-center text-sm text-muted">
                  {tab === "service" ? "Aucun service à placer." : "Aucune borne à placer."}
                </li>
              )}
              {list.map((entity) => {
                const placed = Boolean(positionOf(entity.type, entity.id));
                const isSelected = selected?.type === entity.type && selected.id === entity.id;
                return (
                  <li key={entity.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(isSelected ? null : { type: entity.type, id: entity.id })}
                      aria-pressed={isSelected}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                        isSelected ? "bg-soft-green" : "hover:bg-surface-3",
                      )}
                    >
                      <span
                        className={cn(
                          "size-2.5 shrink-0 rounded-full",
                          placed ? (entity.type === "service" ? "bg-green" : "bg-violet") : "bg-line-strong",
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-text">{entity.label}</span>
                        <span className="block truncate text-xs text-muted">{placed ? "Placé sur ce plan" : "Pas encore placé"}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          {selectedEntity && (
            <Card className="space-y-4 p-4">
              <div>
                <p className="kicker">{selectedEntity.type === "service" ? "Service" : "Borne"}</p>
                <p className="font-display mt-1 text-base font-semibold text-text">{selectedEntity.label}</p>
                {selectedEntity.detail && <p className="text-xs text-muted">{selectedEntity.detail}</p>}
              </div>
              {selectedPosition ? (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2 text-xs text-muted">
                  <span className="tabular">
                    x {selectedPosition.coordonnee_x.toLocaleString("fr-FR")} % · y {selectedPosition.coordonnee_y.toLocaleString("fr-FR")} %
                  </span>
                  {canEdit(selectedEntity.type) && (
                    <Button variant="ghost" size="sm" icon={<MapPinOff className="size-3.5" />} onClick={removePoint}>
                      Retirer
                    </Button>
                  )}
                </div>
              ) : canEdit(selectedEntity.type) ? (
                <p className="rounded-xl bg-soft-green px-3 py-2 text-xs text-green-ink">Cliquez sur le plan pour placer ce point.</p>
              ) : (
                <p className="rounded-xl bg-surface-2 px-3 py-2 text-xs text-muted">
                  {readOnly ? "Mode lecture seule." : "Seul le super administrateur place les bornes."}
                </p>
              )}
              {selectedService && (
                <div>
                  <Field
                    label="Indication d’orientation"
                    hint="Lue à voix haute par l’assistant, en complément du point sur le plan."
                  >
                    {(p) => (
                      <div className="relative">
                        <Navigation className="pointer-events-none absolute top-3 left-3 size-4 text-green-ink" aria-hidden />
                        <TextArea
                          {...p}
                          rows={3}
                          className="pl-9"
                          value={orientationValue}
                          disabled={readOnly}
                          onChange={(e) => setOrientationDraft({ id: selectedService.id, value: e.target.value })}
                          placeholder="Couloir central, première porte à droite"
                        />
                      </div>
                    )}
                  </Field>
                  {!readOnly && (
                    <Button
                      size="sm"
                      className="mt-2"
                      icon={<Save className="size-3.5" />}
                      loading={orientation.pending}
                      disabled={orientationValue === (selectedService.description_orientation ?? "")}
                      onClick={saveOrientation}
                    >
                      Enregistrer l’indication
                    </Button>
                  )}
                </div>
              )}
            </Card>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          const result = await del.run(() => deletePlan(plan.id), { success: "Plan supprimé" });
          if (result.ok) router.push(`${basePath}/plans`);
        }}
        loading={del.pending}
        tone="danger"
        title={`Supprimer « ${plan.nom} » ?`}
        description="Tous les points placés sur ce plan seront retirés. L’assistant ne pourra plus s’en servir pour orienter les citoyens."
        confirmLabel="Supprimer"
      />
    </>
  );
}
