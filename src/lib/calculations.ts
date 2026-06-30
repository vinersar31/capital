import type { Asset, AssetType, Currency } from "./types";
import { isLiability } from "./types";
import { toBase, type RatesToBase } from "./currency";
import { ASSET_META } from "./asset-meta";

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

export interface Mover {
  asset: Asset;
  /** Most recent recorded date (YYYY-MM-DD). */
  lastDate: string;
  /** Previous recorded date. */
  prevDate: string;
  /** Change in base currency (last − prev) in the holding's own direction. */
  deltaBase: number;
  /** Change as a fraction of the previous value. */
  deltaFraction: number;
  /** Effect on net worth (liabilities inverted): a shrinking loan is positive. */
  netEffect: number;
  isLiability: boolean;
}

/**
 * Biggest gainers / losers since each holding's previous recorded value. Uses
 * per-asset `history`; holdings with fewer than two points are skipped. Values
 * are converted at current rates (the rate at the time isn't stored).
 */
export function topMovers(assets: Asset[], rates: RatesToBase): Mover[] {
  const movers: Mover[] = [];
  for (const a of assets) {
    const h = a.history;
    if (!h || h.length < 2) continue;
    const last = h[h.length - 1];
    const prev = h[h.length - 2];
    const deltaBase =
      toBase(last.value, a.currency, rates) - toBase(prev.value, a.currency, rates);
    if (deltaBase === 0) continue;
    const liability = isLiability(a.type);
    movers.push({
      asset: a,
      lastDate: last.date,
      prevDate: prev.date,
      deltaBase,
      deltaFraction: prev.value
        ? (last.value - prev.value) / Math.abs(prev.value)
        : 0,
      netEffect: liability ? -deltaBase : deltaBase,
      isLiability: liability,
    });
  }
  return movers.sort((a, b) => b.netEffect - a.netEffect);
}

export interface IncomeItem {
  asset: Asset;
  /** Projected annual income in base currency. */
  annualIncome: number;
  /** annualIncome / cost basis (or value when no cost basis). */
  yieldOnCost: number;
}

export interface IncomeSummary {
  /** Total projected annual income, base currency. */
  annualIncome: number;
  /** annualIncome / 12. */
  monthlyIncome: number;
  /** Blended yield = annualIncome / total cost of income-bearing holdings. */
  yieldOnCost: number;
  count: number;
  items: IncomeItem[];
}

const INCOME_TYPES: AssetType[] = ["savings", "bond"];

/**
 * Projected passive income from interest-bearing holdings (savings + bonds),
 * with yield measured against cost basis where available.
 */
export function incomeSummary(
  assets: Asset[],
  rates: RatesToBase,
): IncomeSummary {
  const items: IncomeItem[] = [];
  let annualIncome = 0;
  let totalCost = 0;
  for (const a of assets) {
    if (!INCOME_TYPES.includes(a.type)) continue;
    const rate = a.interestRate;
    if (!rate || rate <= 0) continue;
    const valueBase = toBase(a.value, a.currency, rates);
    const income = valueBase * (rate / 100);
    if (income <= 0) continue;
    const costBase =
      typeof a.costBasis === "number" && a.costBasis > 0
        ? toBase(a.costBasis, a.currency, rates)
        : valueBase;
    annualIncome += income;
    totalCost += costBase;
    items.push({
      asset: a,
      annualIncome: income,
      yieldOnCost: costBase ? income / costBase : 0,
    });
  }
  return {
    annualIncome,
    monthlyIncome: annualIncome / 12,
    yieldOnCost: totalCost ? annualIncome / totalCost : 0,
    count: items.length,
    items: items.sort((a, b) => b.annualIncome - a.annualIncome),
  };
}

export interface ConcentrationStat {
  label: string;
  /** Share of total assets (0..1). */
  share: number;
}

export interface Concentration {
  topHolding: ConcentrationStat | null;
  topInstitution: ConcentrationStat | null;
  topCurrency: ConcentrationStat | null;
  /** Herfindahl-Hirschman Index across individual holdings (0..1). */
  hhi: number;
  /** Diversification score 0..100 (higher = more spread out). */
  score: number;
}

/** Concentration of assets (excludes loans). No thresholds — informational. */
export function concentration(
  assets: Asset[],
  rates: RatesToBase,
): Concentration {
  const holdings = assets.filter((a) => !isLiability(a.type));
  let total = 0;
  for (const a of holdings) total += toBase(a.value, a.currency, rates);
  if (total <= 0) {
    return {
      topHolding: null,
      topInstitution: null,
      topCurrency: null,
      hhi: 0,
      score: 0,
    };
  }

  let topHolding: ConcentrationStat | null = null;
  let hhi = 0;
  const byInstitution = new Map<string, number>();
  for (const a of holdings) {
    const base = toBase(a.value, a.currency, rates);
    const share = base / total;
    hhi += share * share;
    if (!topHolding || share > topHolding.share) {
      topHolding = { label: a.name, share };
    }
    if (a.institution) {
      byInstitution.set(
        a.institution,
        (byInstitution.get(a.institution) ?? 0) + base,
      );
    }
  }

  let topInstitution: ConcentrationStat | null = null;
  for (const [label, base] of byInstitution) {
    const share = base / total;
    if (!topInstitution || share > topInstitution.share) {
      topInstitution = { label, share };
    }
  }

  const exposure = currencyExposure(assets, rates);
  const topCurrency =
    exposure.length > 0
      ? { label: exposure[0].currency as string, share: exposure[0].value / total }
      : null;

  return {
    topHolding,
    topInstitution,
    topCurrency,
    hhi,
    score: Math.round((1 - hhi) * 100),
  };
}

export interface LiquiditySplit {
  accessible: number;
  locked: number;
  total: number;
  /** accessible / total (0..1). */
  accessibleFraction: number;
}

/** Split assets into "accessible now" vs "locked" (see asset-meta liquidity). */
export function liquiditySplit(
  assets: Asset[],
  rates: RatesToBase,
): LiquiditySplit {
  let accessible = 0;
  let locked = 0;
  for (const a of assets) {
    const liq = ASSET_META[a.type].liquidity;
    if (liq === "liability") continue;
    const base = toBase(a.value, a.currency, rates);
    if (liq === "accessible") accessible += base;
    else locked += base;
  }
  const total = accessible + locked;
  return {
    accessible,
    locked,
    total,
    accessibleFraction: total ? accessible / total : 0,
  };
}

export interface DebtMetrics {
  assets: number;
  liabilities: number;
  /** liabilities / assets (0 when no assets). */
  debtToAsset: number;
  /** Projected annual interest cost across loans, base currency. */
  annualInterestCost: number;
  hasDebt: boolean;
}

/** Leverage + carrying cost derived from loans and their interest rate. */
export function debtMetrics(assets: Asset[], rates: RatesToBase): DebtMetrics {
  const totals = computeTotals(assets, rates);
  let annualInterestCost = 0;
  for (const a of assets) {
    if (!isLiability(a.type)) continue;
    const rate = a.interestRate;
    if (!rate || rate <= 0) continue;
    annualInterestCost += toBase(a.value, a.currency, rates) * (rate / 100);
  }
  return {
    assets: totals.assets,
    liabilities: totals.liabilities,
    debtToAsset: totals.assets ? totals.liabilities / totals.assets : 0,
    annualInterestCost,
    hasDebt: totals.liabilities > 0,
  };
}
