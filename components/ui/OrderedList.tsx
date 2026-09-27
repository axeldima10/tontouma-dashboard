"use client";

import { ArrowDown, ArrowUp, GripVertical, Plus, X } from "lucide-react";
import { AnimatePresence, Reorder, useDragControls } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { controlClass } from "./Input";

export type ListItem = { key: string; value: string };

let counter = 0;
export function newItem(value = ""): ListItem {
  counter += 1;
  return { key: `item-${counter}-${Math.random().toString(36).slice(2, 7)}`, value };
}

type OrderedListProps = {
  items: ListItem[];
  onChange: (items: ListItem[]) => void;
  placeholder: string;
  addLabel: string;
  itemLabel: string;
  disabled?: boolean;
  maxLength?: number;
  /** Numérotation visible (conditions) ou puces (pièces, avantages). */
  numbered?: boolean;
};

/**
 * Liste ordonnée éditable : glisser-déposer (souris / tactile) ET flèches haut/bas (clavier).
 * Entrée ajoute l'élément suivant, Retour arrière sur un champ vide le supprime.
 */
export function OrderedList({ items, onChange, placeholder, addLabel, itemLabel, disabled, maxLength = 255, numbered = true }: OrderedListProps) {
  const inputs = useRef(new Map<string, HTMLInputElement>());

  const focus = (key: string) => requestAnimationFrame(() => inputs.current.get(key)?.focus());
  const update = (key: string, value: string) => onChange(items.map((item) => (item.key === key ? { ...item, value } : item)));
  const remove = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onChange(next);
    const neighbour = next[Math.max(0, index - 1)];
    if (neighbour) focus(neighbour.key);
  };
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    focus(next[target].key);
  };
  const add = (after?: number) => {
    const item = newItem();
    const next = [...items];
    next.splice(after === undefined ? items.length : after + 1, 0, item);
    onChange(next);
    focus(item.key);
  };

  return (
    <div>
      <Reorder.Group axis="y" values={items} onReorder={onChange} className="space-y-2">
        <AnimatePresence initial={false}>
          {items.map((item, index) => (
            <Row
              key={item.key}
              item={item}
              index={index}
              count={items.length}
              numbered={numbered}
              disabled={disabled}
              placeholder={placeholder}
              itemLabel={itemLabel}
              maxLength={maxLength}
              register={(node) => (node ? inputs.current.set(item.key, node) : inputs.current.delete(item.key))}
              onValue={(value) => update(item.key, value)}
              onRemove={() => remove(index)}
              onMove={(delta) => move(index, delta)}
              onEnter={() => add(index)}
            />
          ))}
        </AnimatePresence>
      </Reorder.Group>
      {!disabled && (
        <button
          type="button"
          onClick={() => add()}
          className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-border-strong text-sm font-medium text-muted-foreground transition hover:border-brand hover:bg-brand-soft hover:text-brand-ink"
        >
          <Plus className="size-4" aria-hidden />
          {addLabel}
        </button>
      )}
    </div>
  );
}

type RowProps = {
  item: ListItem;
  index: number;
  count: number;
  numbered: boolean;
  disabled?: boolean;
  placeholder: string;
  itemLabel: string;
  maxLength: number;
  register: (node: HTMLInputElement | null) => void;
  onValue: (value: string) => void;
  onRemove: () => void;
  onMove: (delta: number) => void;
  onEnter: () => void;
};

function Row({ item, index, count, numbered, disabled, placeholder, itemLabel, maxLength, register, onValue, onRemove, onMove, onEnter }: RowProps) {
  const controls = useDragControls();
  const iconButton =
    "grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.18 } }}
      whileDrag={{ scale: 1.02, boxShadow: "0 18px 40px -16px rgba(21,35,46,0.35)" }}
      className="relative rounded-[16px] bg-card"
    >
      <div className="flex items-center gap-1.5">
        {!disabled && (
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onPointerDown={(event) => controls.start(event)}
            className="grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-full text-subtle hover:text-foreground active:cursor-grabbing"
          >
            <GripVertical className="size-4" />
          </button>
        )}
        <span className="tabular grid size-7 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-muted-foreground">
          {numbered ? index + 1 : "•"}
        </span>
        <input
          ref={register}
          value={item.value}
          disabled={disabled}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-label={`${itemLabel} ${index + 1}`}
          onChange={(event) => onValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onEnter();
            } else if (event.key === "Backspace" && item.value === "" && count > 0) {
              event.preventDefault();
              onRemove();
            }
          }}
          className={cn(controlClass, "h-10 min-w-0 flex-1")}
        />
        {!disabled && (
          <div className="flex shrink-0 items-center">
            <button type="button" className={cn(iconButton, "max-sm:hidden")} onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Monter ${itemLabel.toLowerCase()} ${index + 1}`}>
              <ArrowUp className="size-4" />
            </button>
            <button type="button" className={cn(iconButton, "max-sm:hidden")} onClick={() => onMove(1)} disabled={index === count - 1} aria-label={`Descendre ${itemLabel.toLowerCase()} ${index + 1}`}>
              <ArrowDown className="size-4" />
            </button>
            <button type="button" className={cn(iconButton, "hover:bg-destructive-soft hover:text-destructive")} onClick={onRemove} aria-label={`Supprimer ${itemLabel.toLowerCase()} ${index + 1}`}>
              <X className="size-4" />
            </button>
          </div>
        )}
      </div>
    </Reorder.Item>
  );
}
