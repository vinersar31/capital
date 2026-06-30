// Core domain types for the Capital dashboard.

/** Currencies supported by the app. "RON" is the Romanian Leu (LEI). */
export type Currency = "RON" | "EUR" | "USD";

export const CURRENCIES: Currency[] = ["RON", "EUR", "USD"];

/** High-level asset categories shown on the dashboard. */
export type AssetType =
  | "stock"
  | "bond"
  | "savings"
  | "property"
  | "pension"
  | "loan";

export const ASSET_TYPES: AssetType[] = [
  "stock",
  "bond",
  "savings",
  "property",
  "pension",
  "loan",
];

/** Romanian private-pension pillars. */
export type PensionPillar = "pilon2" | "pilon3";

/** A dated value of a single holding, in that holding's own currency. */
export interface ValuePoint {
  /** YYYY-MM-DD. */
  date: string;
  value: number;
}

/**
 * A single holding. For `loan` the `value` is the outstanding debt and is
 * treated as a liability (subtracted from net worth). Everything else is an
 * asset and is added to net worth.
 */
export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  /** Current value / amount, expressed in `currency`. */
  value: number;
  currency: Currency;
  /** Bank, broker or fund manager. */
  institution?: string;
  /** Only relevant when `type === "pension"`. */
  pillar?: PensionPillar;
  /** Optional number of shares/units (stocks/bonds). */
  quantity?: number;
  /** Optional annual interest rate in % (savings/bonds/loans). */
  interestRate?: number;
  /** Total amount invested / originally paid, in `currency`. Enables gain/loss. */
  costBasis?: number;
  /** Acquisition date (YYYY-MM-DD), used for holding period / returns. */
  acquiredAt?: string;
  notes?: string;
  /** Recorded value over time (own currency), oldest first. */
  history?: ValuePoint[];
  createdAt: number;
  updatedAt: number;
}

/** Shape used by create/edit forms (no server-managed fields). */
export type AssetDraft = Omit<Asset, "id" | "createdAt" | "updatedAt">;

/** A point-in-time record of total net worth (stored in base currency). */
export interface Snapshot {
  /** YYYY-MM-DD (one record per day, upserted). */
  date: string;
  /** Net worth in the base currency (RON). */
  netWorth: number;
}

export function isLiability(type: AssetType): boolean {
  return type === "loan";
}
