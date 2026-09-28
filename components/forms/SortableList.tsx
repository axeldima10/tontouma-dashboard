"use client";

import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Draggable, Flip, gsap } from "@/lib/motion/gsap";

type SortableListProps<T> = {
  items: T[];
  getId: (item: T) => string;
  /** Appelé avec le nouvel ordre (identifiants). */
  onReorder: (next: T[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
  /** Libellé de l'élément pour les boutons « monter / descendre ». */
  getLabel: (item: T) => string;
  disabled?: boolean;
  className?: string;
  gap?: number;
};

type FlipState = ReturnType<typeof Flip.getState>;

/**
 * Liste réordonnable : glisser la poignée (GSAP Draggable, les voisins s'écartent)
 * ou utiliser les boutons monter / descendre (clavier). Transitions animées avec Flip.
 */
export function SortableList<T>({
  items,
  getId,
  onReorder,
  renderItem,
  getLabel,
  disabled,
  className,
  gap = 8,
}: SortableListProps<T>) {
  const listRef = useRef<HTMLUListElement>(null);
  const flipState = useRef<FlipState | null>(null);
  const [announce, setAnnounce] = useState("");
  const itemsRef = useRef(items);
  const onReorderRef = useRef(onReorder);
  useLayoutEffect(() => {
    itemsRef.current = items;
    onReorderRef.current = onReorder;
  });

  const commit = (next: T[], message: string) => {
    const list = listRef.current;
    if (list) flipState.current = Flip.getState(list.querySelectorAll("[data-sortable]"));
    setAnnounce(message);
    onReorderRef.current(next);
  };

  // Après le nouveau rendu : on retire les décalages et Flip anime vers les positions finales.
  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state || !listRef.current) return;
    flipState.current = null;
    const elements = listRef.current.querySelectorAll("[data-sortable]");
    gsap.set(elements, { clearProps: "transform,zIndex" });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    Flip.from(state, { targets: elements, duration: 0.35, ease: "power3.out" });
  }, [items]);

  // Glisser-déposer : une instance Draggable par poignée.
  const idsKey = items.map(getId).join("|");
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || disabled) return;
    const elements = Array.from(list.querySelectorAll<HTMLElement>("[data-sortable]"));
    const draggables = elements.map((element, startIndex) => {
      let rects: DOMRect[] = [];
      let target = startIndex;
      return Draggable.create(element, {
        type: "y",
        trigger: element.querySelector("[data-handle]"),
        bounds: list,
        zIndexBoost: true,
        onPress() {
          rects = elements.map((el) => el.getBoundingClientRect());
          target = startIndex;
          gsap.to(element, { scale: 1.015, boxShadow: "0 18px 40px -18px rgba(15,42,28,.35)", duration: 0.2 });
        },
        onDrag() {
          const height = rects[startIndex].height + gap;
          const center = rects[startIndex].top + rects[startIndex].height / 2 + this.y;
          target = rects.reduce((index, rect, i) => {
            if (i === startIndex) return index;
            const mid = rect.top + rect.height / 2;
            if (i > startIndex && center > mid) return Math.max(index, i);
            if (i < startIndex && center < mid) return Math.min(index, i);
            return index;
          }, startIndex);
          elements.forEach((el, i) => {
            if (i === startIndex) return;
            const shift =
              startIndex < target && i > startIndex && i <= target
                ? -height
                : startIndex > target && i < startIndex && i >= target
                  ? height
                  : 0;
            gsap.to(el, { y: shift, duration: 0.22, ease: "power2.out", overwrite: "auto" });
          });
        },
        onRelease() {
          gsap.to(element, { scale: 1, boxShadow: "none", duration: 0.2, clearProps: "boxShadow" });
          const current = itemsRef.current;
          if (target === startIndex) {
            gsap.to(elements, { y: 0, duration: 0.25 });
            return;
          }
          const next = [...current];
          const [moved] = next.splice(startIndex, 1);
          next.splice(target, 0, moved);
          commit(next, `${getLabel(moved)} déplacé en position ${target + 1} sur ${next.length}.`);
        },
      })[0];
    });
    return () => draggables.forEach((d) => d.kill());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recréé quand l'ordre ou l'état change
  }, [idsKey, disabled, gap]);

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    commit(next, `${getLabel(moved)} déplacé en position ${target + 1} sur ${next.length}.`);
  };

  return (
    <>
      <ul ref={listRef} className={cn("relative", className)} style={{ display: "grid", gap }}>
        {items.map((item, index) => (
          <li key={getId(item)} data-sortable className="relative flex min-w-0 items-stretch gap-1 rounded-2xl bg-panel">
            {!disabled && (
              <span
                data-handle
                aria-hidden
                title="Glisser pour réordonner"
                className="flex w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-l-2xl text-subtle transition-colors hover:text-green-ink active:cursor-grabbing"
              >
                <GripVertical className="size-4" />
              </span>
            )}
            <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
            {!disabled && items.length > 1 && (
              <div className="flex shrink-0 flex-col justify-center gap-0.5 pr-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Monter ${getLabel(item)}`}
                  className="grid size-6 place-items-center rounded-md text-subtle hover:bg-surface-3 hover:text-text disabled:opacity-30"
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label={`Descendre ${getLabel(item)}`}
                  className="grid size-6 place-items-center rounded-md text-subtle hover:bg-surface-3 hover:text-text disabled:opacity-30"
                >
                  <ArrowDown className="size-3.5" />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </>
  );
}
