"use client";

import { Copy, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { DAYS_OF_WEEK, type DayOfWeek, type OpeningHours } from "@/lib/api/contract";
import { cn } from "@/lib/cn";
import { DAY_LABELS } from "@/lib/format";
import { controlClass } from "./Input";
import { Switch } from "./Switch";

type OpeningHoursEditorProps = {
  value: OpeningHours[];
  onChange: (value: OpeningHours[]) => void;
  disabled?: boolean;
};

const DEFAULT_SLOT = { opensAt: "08:00", closesAt: "16:00" };

/** Horaires structurés : un interrupteur par jour, une ou plusieurs plages (ex. coupure à midi). */
export function OpeningHoursEditor({ value, onChange, disabled }: OpeningHoursEditorProps) {
  const byDay = (day: DayOfWeek) => value.filter((row) => row.dayOfWeek === day);
  const setDay = (day: DayOfWeek, rows: Omit<OpeningHours, "dayOfWeek">[]) => {
    const others = value.filter((row) => row.dayOfWeek !== day);
    const next = [...others, ...rows.map((r) => ({ dayOfWeek: day, ...r }))];
    onChange(next.sort((a, b) => DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek) || a.opensAt.localeCompare(b.opensAt)));
  };
  const copyToWeekdays = (day: DayOfWeek) => {
    const slots = byDay(day).map(({ opensAt, closesAt }) => ({ opensAt, closesAt }));
    const weekdays: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
    const keep = value.filter((row) => !weekdays.includes(row.dayOfWeek));
    onChange([...keep, ...weekdays.flatMap((d) => slots.map((s) => ({ dayOfWeek: d, ...s })))].sort((a, b) => DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek)));
  };

  return (
    <div className="divide-y divide-border overflow-hidden rounded-[18px] border border-border bg-card">
      {DAYS_OF_WEEK.map((day) => {
        const slots = byDay(day);
        const open = slots.length > 0;
        return (
          <div key={day} className="flex flex-wrap items-start gap-3 px-4 py-3 sm:flex-nowrap">
            <label className="flex w-36 shrink-0 items-center gap-3 pt-1.5">
              <Switch
                checked={open}
                disabled={disabled}
                onCheckedChange={(checked) => setDay(day, checked ? [DEFAULT_SLOT] : [])}
                aria-label={`${DAY_LABELS[day]} ouvert`}
              />
              <span className={cn("text-sm font-medium", open ? "text-foreground" : "text-muted-foreground")}>{DAY_LABELS[day]}</span>
            </label>
            <div className="min-w-0 flex-1 space-y-2">
              {!open && <p className="pt-2 text-sm text-subtle">Fermé</p>}
              <AnimatePresence initial={false}>
                {slots.map((slot, index) => (
                  <motion.div
                    key={`${day}-${index}`}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <input
                      type="time"
                      value={slot.opensAt.slice(0, 5)}
                      disabled={disabled}
                      aria-label={`${DAY_LABELS[day]} ouverture`}
                      onChange={(e) => setDay(day, slots.map((s, i) => (i === index ? { ...s, opensAt: e.target.value } : s)))}
                      className={cn(controlClass, "tabular h-9 w-[7.5rem]")}
                    />
                    <span className="text-muted-foreground">–</span>
                    <input
                      type="time"
                      value={slot.closesAt.slice(0, 5)}
                      disabled={disabled}
                      aria-label={`${DAY_LABELS[day]} fermeture`}
                      aria-invalid={slot.opensAt >= slot.closesAt || undefined}
                      onChange={(e) => setDay(day, slots.map((s, i) => (i === index ? { ...s, closesAt: e.target.value } : s)))}
                      className={cn(controlClass, "tabular h-9 w-[7.5rem]")}
                    />
                    {!disabled && (
                      <div className="flex items-center">
                        {index === slots.length - 1 && slots.length < 3 && (
                          <button
                            type="button"
                            onClick={() => setDay(day, [...slots, { opensAt: "14:00", closesAt: "17:00" }])}
                            className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
                            aria-label={`Ajouter une plage le ${DAY_LABELS[day].toLowerCase()}`}
                            title="Ajouter une plage"
                          >
                            <Plus className="size-4" />
                          </button>
                        )}
                        {slots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setDay(day, slots.filter((_, i) => i !== index))}
                            className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive-soft hover:text-destructive"
                            aria-label={`Retirer cette plage du ${DAY_LABELS[day].toLowerCase()}`}
                          >
                            <X className="size-4" />
                          </button>
                        )}
                        {day === "MONDAY" && index === 0 && (
                          <button
                            type="button"
                            onClick={() => copyToWeekdays(day)}
                            className="ml-1 flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                          >
                            <Copy className="size-3.5" aria-hidden /> Lun → Ven
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
