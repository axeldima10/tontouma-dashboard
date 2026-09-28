"use client";

import { Plus, X } from "lucide-react";
import { SortableList } from "@/components/forms/SortableList";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/Bits";

export type ListItem = { key: string; value: string };

let counter = 0;
export const newItem = (value = ""): ListItem => ({ key: `item-${Date.now()}-${counter++}`, value });

type EditableListProps = {
  items: ListItem[];
  onChange: (items: ListItem[]) => void;
  placeholder: string;
  addLabel: string;
  itemLabel: string;
  disabled?: boolean;
  maxLength?: number;
};

/** Liste ordonnée éditable (conditions, pièces requises) : saisie, ajout, suppression, réordonnancement. */
export function EditableList({ items, onChange, placeholder, addLabel, itemLabel, disabled, maxLength = 255 }: EditableListProps) {
  const update = (key: string, value: string) => onChange(items.map((i) => (i.key === key ? { ...i, value } : i)));

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <SortableList
          items={items}
          getId={(i) => i.key}
          getLabel={(i) => i.value || itemLabel}
          disabled={disabled}
          gap={6}
          onReorder={onChange}
          renderItem={(item, index) => (
            <div className="flex items-center gap-2 py-0.5">
              <span className="font-display tabular grid size-7 shrink-0 place-items-center rounded-full bg-soft-green text-[12px] font-semibold text-green-ink">
                {index + 1}
              </span>
              <input
                value={item.value}
                onChange={(e) => update(item.key, e.target.value)}
                placeholder={placeholder}
                maxLength={maxLength}
                disabled={disabled}
                aria-label={`${itemLabel} ${index + 1}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const next = [...items];
                    next.splice(index + 1, 0, newItem());
                    onChange(next);
                    requestAnimationFrame(() => {
                      const inputs = document.querySelectorAll<HTMLInputElement>(`[aria-label^="${itemLabel} "]`);
                      inputs[index + 1]?.focus();
                    });
                  }
                }}
                className="h-10 min-w-0 flex-1 rounded-xl border border-line-strong bg-panel px-3 text-sm text-text outline-none transition-[border-color,box-shadow] placeholder:text-subtle focus:border-green focus:ring-4 focus:ring-green/15 disabled:bg-surface-2"
              />
              {!disabled && (
                <IconButton label={`Retirer ${itemLabel.toLowerCase()} ${index + 1}`} tone="danger" onClick={() => onChange(items.filter((i) => i.key !== item.key))}>
                  <X />
                </IconButton>
              )}
            </div>
          )}
        />
      )}
      {!disabled && (
        <Button variant="ghost" size="sm" icon={<Plus className="size-3.5" />} onClick={() => onChange([...items, newItem()])}>
          {addLabel}
        </Button>
      )}
    </div>
  );
}
