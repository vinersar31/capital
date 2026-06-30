import type { Currency } from "./types";
import { IS_STATIC_EXPORT } from "./runtime";

/** Base currency the whole app normalizes to. */
export const BASE_CURRENCY: Currency = "RON";

/**
 * Exchange rates expressed as "how many RON for one unit of this currency".
 * Used as a sensible offline fallback; live rates are fetched at runtime.
 */
export const DEFAULT_RATES_TO_BASE: Record<Currency, number> = {
  RON: 1,
  EUR: 5.24,
};

export type RatesToBase = Record<Currency, number>;

export interface RateResult {
  rates: RatesToBase;
  /** Where the live rate came from: "BNR", "ECB", or "fallback". */
  source: string;
}

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
 * Fetch the live EUR→RON rate, preferring the **BNR** official daily reference
 * rate (via our own `/api/fx` route), then the keyless **Frankfurter/ECB** API
 * (works on static hosts), and finally an offline default — so the app never
 * gets stuck on a stale hard-coded number.
 */
export async function fetchRatesToBase(): Promise<RateResult> {
  // 1) BNR reference rate, proxied by our server route (skipped on static export).
  if (!IS_STATIC_EXPORT) {
    try {
      const res = await fetch("/api/fx", { cache: "no-store" });
      if (res.ok) {
        const data: { ok?: boolean; rate?: number; source?: string } = await res.json();
        if (data.ok && typeof data.rate === "number" && data.rate > 0) {
          return { rates: { RON: 1, EUR: data.rate }, source: data.source ?? "BNR" };
        }
      }
    } catch {
      /* fall through to the next source */
    }
  }

  // 2) Frankfurter (ECB reference rates) — keyless and CORS-enabled.
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=EUR&to=RON",
      { cache: "no-store" },
    );
    if (res.ok) {
      const data: { rates?: { RON?: number } } = await res.json();
      const eur = data.rates?.RON;
      if (typeof eur === "number" && eur > 0) {
        return { rates: { RON: 1, EUR: eur }, source: "ECB" };
      }
    }
  } catch {
    /* fall through to the offline fallback */
  }

  // 3) Offline fallback.
  return { rates: { ...DEFAULT_RATES_TO_BASE }, source: "fallback" };
}
