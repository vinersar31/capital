import type { Asset, Snapshot, ValuePoint } from "./types";

let counter = 0;
function id(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

/** Build ~7 months of plausible monthly history ending at the current value. */
function genHistory(
  current: number,
  seed: number,
  direction: "up" | "down",
): ValuePoint[] {
  const months = 7;
  const today = new Date();
  const spread = 0.1 + (seed % 4) * 0.03; // 10%..19%
  const points: ValuePoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const progress = (months - 1 - i) / (months - 1); // 0 oldest .. 1 newest
    const start = direction === "up" ? 1 - spread : 1 + spread;
    const factor = start + (1 - start) * progress;
    const wobble = 1 + Math.sin((i + seed) * 1.7) * 0.015;
    points.push({
      date: d.toISOString().slice(0, 10),
      value: Math.max(0, Math.round(current * factor * wobble)),
    });
  }
  points[points.length - 1] = {
    date: points[points.length - 1].date,
    value: current,
  };
  return points;
}

/** Seed holdings used in local mode so the dashboard isn't empty. */
export function sampleAssets(): Asset[] {
  const base: Omit<Asset, "createdAt" | "updatedAt">[] = [
    {
      id: id("stk"),
      name: "S&P 500 ETF (VUAA)",
      type: "stock",
      value: 9200,
      currency: "EUR",
      institution: "XTB",
      quantity: 95,
    },
    {
      id: id("stk"),
      name: "Nvidia",
      type: "stock",
      value: 6400,
      currency: "EUR",
      institution: "Trading 212",
      quantity: 42,
    },
    {
      id: id("bnd"),
      name: "Fidelis – Titluri de stat",
      type: "bond",
      value: 25000,
      currency: "RON",
      institution: "Ministerul Finanțelor",
      interestRate: 6.85,
    },
    {
      id: id("bnd"),
      name: "EUR Government Bond",
      type: "bond",
      value: 5000,
      currency: "EUR",
      institution: "BVB",
      interestRate: 4.2,
    },
    {
      id: id("sav"),
      name: "Savings account",
      type: "savings",
      value: 18500,
      currency: "RON",
      institution: "Banca Transilvania",
      interestRate: 5.0,
    },
    {
      id: id("sav"),
      name: "EUR pocket",
      type: "savings",
      value: 3200,
      currency: "EUR",
      institution: "Revolut",
    },
    {
      id: id("pen"),
      name: "Pension – Pillar II",
      type: "pension",
      value: 34000,
      currency: "RON",
      institution: "NN",
      pillar: "pilon2",
    },
    {
      id: id("pen"),
      name: "Pension – Pillar III",
      type: "pension",
      value: 9500,
      currency: "RON",
      institution: "NN",
      pillar: "pilon3",
    },
    {
      id: id("loan"),
      name: "Mortgage",
      type: "loan",
      value: 142000,
      currency: "RON",
      institution: "BCR",
      interestRate: 5.9,
    },
  ];

  return base.map((a, i) => ({
    ...a,
    history: genHistory(a.value, i, a.type === "loan" ? "down" : "up"),
    createdAt: now - (base.length - i) * DAY,
    updatedAt: now - i * DAY,
  }));
}

/**
 * Seed ~9 months of net-worth history (in base RON) so the trend chart is
 * populated. The most recent point is recomputed from live data on load.
 */
export function sampleSnapshots(): Snapshot[] {
  const series = [
    -8, // relative thousands offset from a baseline, gently trending up
    2, 9, 6, 15, 21, 28, 34, 41,
  ];
  const baseline = 95000; // RON
  const today = new Date();
  return series.map((delta, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (series.length - 1 - i), 1);
    const iso = d.toISOString().slice(0, 10);
    return {
      date: iso,
      netWorth: baseline + delta * 1000,
    };
  });
}
