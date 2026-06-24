import type { Asset, AssetType, Currency } from "./types";
import { isLiability } from "./types";
import { toBase, type RatesToBase } from "./currency";

export interface Totals {
  /** Sum of all non-liability holdings, in base currency. */
  assets: number;
  /** Sum of all liabilities (loans), as a positive number, in base currency. */
  liabilities: number;
  /** assets − liabilities, in base currency. */
  netWorth: number;
}

export function computeTotals(assets: Asset[], rates: RatesToBase): Totals {
  let assetTotal = 0;
  let liabilityTotal = 0;
  for (const a of assets) {
    const base = toBase(a.value, a.currency, rates);
    if (isLiability(a.type)) liabilityTotal += base;
    else assetTotal += base;
  }
  return {
    assets: assetTotal,
    liabilities: liabilityTotal,
    netWorth: assetTotal - liabilityTotal,
  };
}

export interface TypeBucket {
  type: AssetType;
  base: number;
  count: number;
}

/** Totals grouped by asset type (value in base currency). */
export function totalsByType(assets: Asset[], rates: RatesToBase): TypeBucket[] {
  const map = new Map<AssetType, TypeBucket>();
  for (const a of assets) {
    const bucket = map.get(a.type) ?? { type: a.type, base: 0, count: 0 };
    bucket.base += toBase(a.value, a.currency, rates);
    bucket.count += 1;
    map.set(a.type, bucket);
  }
  return [...map.values()];
}

export interface AllocationSlice {
  type: AssetType;
  value: number;
  count: number;
}

/** Allocation of assets only (excludes loans), in base currency. */
export function allocationByType(
  assets: Asset[],
  rates: RatesToBase,
): AllocationSlice[] {
  return totalsByType(assets, rates)
    .filter((b) => !isLiability(b.type))
    .map((b) => ({ type: b.type, value: b.base, count: b.count }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
}

export interface CurrencySlice {
  currency: Currency;
  value: number;
}

/** Asset exposure per currency (excludes loans), in base currency. */
export function currencyExposure(
  assets: Asset[],
  rates: RatesToBase,
): CurrencySlice[] {
  const map = new Map<Currency, number>();
  for (const a of assets) {
    if (isLiability(a.type)) continue;
    const prev = map.get(a.currency) ?? 0;
    map.set(a.currency, prev + toBase(a.value, a.currency, rates));
  }
  return [...map.entries()]
    .map(([currency, value]) => ({ currency, value }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
}

/** Change as a fraction (0.05 = +5%) between two values. */
export function changeFraction(current: number, previous: number): number {
  if (!previous) return 0;
  return (current - previous) / Math.abs(previous);
}
