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

export interface AssetGain {
  /** True when a positive cost basis is set and gain/loss is meaningful. */
  hasCost: boolean;
  /** Current value in base currency. */
  valueBase: number;
  /** Cost basis in base currency. */
  costBase: number;
  /** valueBase − costBase (can be negative). */
  gain: number;
  /** gain / costBase (0 when no cost basis). */
  gainFraction: number;
}

/** Unrealized gain/loss for a single (non-liability) asset, in base currency. */
export function assetGain(asset: Asset, rates: RatesToBase): AssetGain {
  const valueBase = toBase(asset.value, asset.currency, rates);
  const hasCost =
    !isLiability(asset.type) &&
    typeof asset.costBasis === "number" &&
    asset.costBasis > 0;
  const costBase = hasCost
    ? toBase(asset.costBasis as number, asset.currency, rates)
    : 0;
  const gain = hasCost ? valueBase - costBase : 0;
  const gainFraction = hasCost && costBase ? gain / costBase : 0;
  return { hasCost, valueBase, costBase, gain, gainFraction };
}

export interface PortfolioGains {
  /** Current value of assets that have a cost basis, base currency. */
  value: number;
  /** Total invested (cost basis) of those assets, base currency. */
  cost: number;
  /** value − cost. */
  gain: number;
  /** gain / cost. */
  gainFraction: number;
  /** How many holdings contributed a cost basis. */
  count: number;
}

/** Aggregate unrealized gain/loss across every asset that has a cost basis. */
export function portfolioGains(
  assets: Asset[],
  rates: RatesToBase,
): PortfolioGains {
  let value = 0;
  let cost = 0;
  let count = 0;
  for (const a of assets) {
    const g = assetGain(a, rates);
    if (!g.hasCost) continue;
    value += g.valueBase;
    cost += g.costBase;
    count += 1;
  }
  const gain = value - cost;
  return { value, cost, gain, gainFraction: cost ? gain / cost : 0, count };
}
