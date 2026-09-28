const LOCALE = "fr-FR";
const TIME_ZONE = "Africa/Dakar";

const xof = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});

const integer = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat(LOCALE, { style: "percent", maximumFractionDigits: 0 });

/** Montants XOF : entiers, jamais de décimales. */
export function formatXOF(amount: number): string {
  return xof.format(Math.round(amount));
}

export function formatNumber(value: number): string {
  return integer.format(value);
}

export function formatPercent(ratio: number): string {
  return percent.format(ratio);
}

export function formatDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...options }).format(new Date(value));
}

export function formatShortDate(value: string | Date): string {
  return formatDate(value, { day: "numeric", month: "short" });
}

export function formatDateTime(value: string | Date): string {
  return formatDate(value, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** « Lundi 28 septembre » — capitalisé pour les en-têtes. */
export function formatLongToday(now: Date = new Date()): string {
  const label = formatDate(now, { weekday: "long", day: "numeric", month: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const relative = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

export function formatRelative(value: string | Date, now: Date = new Date()): string {
  const seconds = (new Date(value).getTime() - now.getTime()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return "à l’instant";
}
<<<<<<< HEAD

/** Taille de fichier lisible (« 1,8 Mo »). */
export function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} o`;
  const units = ["Ko", "Mo", "Go"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(value)} ${units[unit]}`;
}

/** Date seule (AAAA-MM-JJ du backend) sans décalage de fuseau. */
export function formatDay(isoDate: string): string {
  return formatDate(`${isoDate.slice(0, 10)}T12:00:00Z`);
}

export const DAY_LABELS = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
} as const;

export const DAY_SHORT = {
  MONDAY: "Lun",
  TUESDAY: "Mar",
  WEDNESDAY: "Mer",
  THURSDAY: "Jeu",
  FRIDAY: "Ven",
  SATURDAY: "Sam",
  SUNDAY: "Dim",
} as const;

export const BILLING_PERIOD_LABELS = { MOIS: "mois", TRIMESTRE: "trimestre", ANNEE: "an" } as const;
export const BILLING_PERIOD_NAMES = { MOIS: "Mensuel", TRIMESTRE: "Trimestriel", ANNEE: "Annuel" } as const;

/** « Lun–Jeu 08:00–16:00 · Ven 08:00–13:00 » : regroupe les jours consécutifs aux mêmes horaires. */
export function summarizeOpeningHours(rows: { dayOfWeek: keyof typeof DAY_SHORT; opensAt: string; closesAt: string }[]): string {
  if (rows.length === 0) return "Horaires non renseignés";
  const order = Object.keys(DAY_SHORT) as (keyof typeof DAY_SHORT)[];
  const sorted = [...rows].sort((a, b) => order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek));
  const groups: { from: string; to: string; hours: string; last: number }[] = [];
  for (const row of sorted) {
    const hours = `${row.opensAt.slice(0, 5)}–${row.closesAt.slice(0, 5)}`;
    const index = order.indexOf(row.dayOfWeek);
    const prev = groups.at(-1);
    if (prev && prev.hours === hours && prev.last === index - 1) {
      prev.to = DAY_SHORT[row.dayOfWeek];
      prev.last = index;
    } else groups.push({ from: DAY_SHORT[row.dayOfWeek], to: DAY_SHORT[row.dayOfWeek], hours, last: index });
  }
  return groups.map((g) => `${g.from === g.to ? g.from : `${g.from}–${g.to}`} ${g.hours}`).join(" · ");
}
=======
>>>>>>> 939f032 (First Commit)
