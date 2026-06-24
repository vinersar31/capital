import type { Currency } from "./types";

/** Base currency the whole app normalizes to. */
export const BASE_CURRENCY: Currency = "RON";

/**
 * Exchange rates expressed as "how many RON for one unit of this currency".
 * Used as a sensible offline fallback; live rates are fetched at runtime.
 */
export const DEFAULT_RATES_TO_BASE: Record<Currency, number> = {
  RON: 1,
  EUR: 4.98,
};

export type RatesToBase = Record<Currency, number>;

/** Convert `amount` from one currency to another using RON-based rates. */
export function convert(
  amount: number,
  from: Currency,
  to: Currency,
  rates: RatesToBase,
): number {
  if (!Number.isFinite(amount)) return 0;
  const inBase = amount * (rates[from] ?? 1);
  return inBase / (rates[to] ?? 1);
}

/** Convert an amount to the base currency (RON). */
export function toBase(amount: number, from: Currency, rates: RatesToBase): number {
  return convert(amount, from, BASE_CURRENCY, rates);
}

/**
 * Fetch live EUR→RON rate from the keyless Frankfurter API (ECB data).
 * Falls back to the default rate on any error so the app keeps working offline.
 */
export async function fetchRatesToBase(): Promise<RatesToBase> {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=EUR&to=RON",
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: { rates?: { RON?: number } } = await res.json();
    const eur = data.rates?.RON;
    if (typeof eur === "number" && eur > 0) {
      return { RON: 1, EUR: eur };
    }
    throw new Error("Missing RON rate in response");
  } catch {
    return { ...DEFAULT_RATES_TO_BASE };
  }
}
