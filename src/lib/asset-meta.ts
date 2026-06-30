import type { AssetType, PensionPillar } from "./types";

export interface AssetTypeMeta {
  label: string;
  plural: string;
  /** Tailwind text color class. */
  text: string;
  /** Hex color used by charts. */
  color: string;
  /** Lucide icon name handled in components. */
  icon:
    | "trending-up"
    | "landmark"
    | "piggy-bank"
    | "building"
    | "shield"
    | "credit-card";
  description: string;
  /** Whether the holding can be readily accessed, is locked, or is a liability. */
  liquidity: "accessible" | "locked" | "liability";
}

export const ASSET_META: Record<AssetType, AssetTypeMeta> = {
  stock: {
    label: "Stock",
    plural: "Stocks & ETFs",
    text: "text-sky-400",
    color: "#38bdf8",
    icon: "trending-up",
    description: "Shares, ETFs and equity funds",
    liquidity: "accessible",
  },
  bond: {
    label: "Bond",
    plural: "Bonds",
    text: "text-violet-400",
    color: "#a78bfa",
    icon: "landmark",
    description: "Government & corporate bonds",
    liquidity: "locked",
  },
  savings: {
    label: "Savings",
    plural: "Savings & Cash",
    text: "text-brand-400",
    color: "#34d399",
    icon: "piggy-bank",
    description: "Deposits, savings accounts & cash",
    liquidity: "accessible",
  },
  property: {
    label: "Property",
    plural: "Property & Real Estate",
    text: "text-orange-400",
    color: "#fb923c",
    icon: "building",
    description: "Apartments, houses & land (market value)",
    liquidity: "locked",
  },
  pension: {
    label: "Pension",
    plural: "Pension (Pillar II & III)",
    text: "text-amber-400",
    color: "#fbbf24",
    icon: "shield",
    description: "Private pension — Pilonul II & III",
    liquidity: "locked",
  },
  loan: {
    label: "Loan",
    plural: "Loans & Debt",
    text: "text-rose-400",
    color: "#fb7185",
    icon: "credit-card",
    description: "Mortgages, credit & liabilities",
    liquidity: "liability",
  },
};

export const PILLAR_META: Record<PensionPillar, { label: string; short: string }> = {
  pilon2: { label: "Pilonul II (mandatory)", short: "Pilon II" },
  pilon3: { label: "Pilonul III (voluntary)", short: "Pilon III" },
};
