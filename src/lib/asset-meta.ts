import type { AssetType, PensionPillar } from "./types";

export interface AssetTypeMeta {
  label: string;
  plural: string;
  /** Tailwind text color class. */
  text: string;
  /** Hex color used by charts. */
  color: string;
  /** Lucide icon name handled in components. */
  icon: "trending-up" | "landmark" | "piggy-bank" | "shield" | "credit-card";
  description: string;
}

export const ASSET_META: Record<AssetType, AssetTypeMeta> = {
  stock: {
    label: "Stock",
    plural: "Stocks & ETFs",
    text: "text-sky-400",
    color: "#38bdf8",
    icon: "trending-up",
    description: "Shares, ETFs and equity funds",
  },
  bond: {
    label: "Bond",
    plural: "Bonds",
    text: "text-violet-400",
    color: "#a78bfa",
    icon: "landmark",
    description: "Government & corporate bonds",
  },
  savings: {
    label: "Savings",
    plural: "Savings & Cash",
    text: "text-brand-400",
    color: "#34d399",
    icon: "piggy-bank",
    description: "Deposits, savings accounts & cash",
  },
  pension: {
    label: "Pension",
    plural: "Pension (Pillar II & III)",
    text: "text-amber-400",
    color: "#fbbf24",
    icon: "shield",
    description: "Private pension — Pilonul II & III",
  },
  loan: {
    label: "Loan",
    plural: "Loans & Debt",
    text: "text-rose-400",
    color: "#fb7185",
    icon: "credit-card",
    description: "Mortgages, credit & liabilities",
  },
};

export const PILLAR_META: Record<PensionPillar, { label: string; short: string }> = {
  pilon2: { label: "Pilonul II (mandatory)", short: "Pilon II" },
  pilon3: { label: "Pilonul III (voluntary)", short: "Pilon III" },
};
