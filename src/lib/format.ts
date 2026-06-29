import type { Currency } from "./types";

/** Format a money amount in the given currency using the Romanian locale. */
export function formatMoney(
  amount: number,
  currency: Currency,
  opts: { maximumFractionDigits?: number; minimumFractionDigits?: number } = {},
): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    minimumFractionDigits: opts.minimumFractionDigits ?? 0,
    maximumFractionDigits: opts.maximumFractionDigits ?? 0,
  }).format(value);
}

/** Compact money for tight spaces, e.g. "1,2 mil. RON". */
export function formatCompactMoney(amount: number, currency: Currency): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Plain compact number, e.g. "12,3K". */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("ro-RO", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(fraction: number, digits = 1): string {
  const value = Number.isFinite(fraction) ? fraction : 0;
  return new Intl.NumberFormat("ro-RO", {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** Signed percent with explicit + / − sign, e.g. "+3,4%". */
export function formatSignedPercent(fraction: number, digits = 1): string {
  const sign = fraction > 0 ? "+" : fraction < 0 ? "−" : "";
  return sign + formatPercent(Math.abs(fraction), digits);
}

export function formatDate(date: string | number | Date): string {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatMonth(date: string | number | Date): string {
  return new Intl.DateTimeFormat("ro-RO", {
    month: "short",
    year: "2-digit",
  }).format(new Date(date));
}

/** Full date + time, e.g. "28 iun. 2026, 14:30". */
export function formatDateTime(date: string | number | Date): string {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/** Human-friendly relative time, e.g. "just now", "5m ago", "3d ago". */
export function formatRelativeTime(date: number | Date): string {
  const then = date instanceof Date ? date.getTime() : date;
  const diff = Date.now() - then;
  if (!Number.isFinite(diff)) return "—";
  const sec = Math.round(diff / 1000);
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return formatDate(then);
}
