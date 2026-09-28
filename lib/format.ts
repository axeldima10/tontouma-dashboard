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
