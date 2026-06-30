import { describe, expect, it } from "vitest";
import type { Asset } from "../src/lib/types";
import type { RatesToBase } from "../src/lib/currency";
import {
  allocationByType,
  assetGain,
  changeFraction,
  computeTotals,
  currencyExposure,
  debtMetrics,
  incomeSummary,
  liquiditySplit,
  portfolioGains,
} from "../src/lib/calculations";

/** RON per unit: 1 EUR = 5 RON, 1 USD = 4 RON (round numbers for easy math). */
const rates: RatesToBase = { RON: 1, EUR: 5, USD: 4 };

let nextId = 0;
function makeAsset(partial: Partial<Asset> = {}): Asset {
  return {
    id: `a${nextId++}`,
    name: "asset",
    type: "stock",
    value: 0,
    currency: "RON",
    createdAt: 0,
    updatedAt: 0,
    ...partial,
  };
}

describe("computeTotals", () => {
  it("sums assets and liabilities in base currency", () => {
    const assets = [
      makeAsset({ type: "stock", value: 100, currency: "EUR" }), // 500 RON
      makeAsset({ type: "savings", value: 200, currency: "RON" }), // 200 RON
      makeAsset({ type: "loan", value: 50, currency: "USD" }), // 200 RON liability
    ];
    const t = computeTotals(assets, rates);
    expect(t.assets).toBe(700);
    expect(t.liabilities).toBe(200);
    expect(t.netWorth).toBe(500);
  });

  it("returns zeros for empty input", () => {
    expect(computeTotals([], rates)).toEqual({
      assets: 0,
      liabilities: 0,
      netWorth: 0,
    });
  });
});

describe("allocationByType", () => {
  it("excludes liabilities, drops zero and sorts by value desc", () => {
    const assets = [
      makeAsset({ type: "stock", value: 100, currency: "RON" }),
      makeAsset({ type: "savings", value: 300, currency: "RON" }),
      makeAsset({ type: "loan", value: 1000, currency: "RON" }),
    ];
    const alloc = allocationByType(assets, rates);
    expect(alloc.map((a) => a.type)).toEqual(["savings", "stock"]);
    expect(alloc[0].value).toBe(300);
  });
});

describe("currencyExposure", () => {
  it("aggregates per currency in base, excludes loans and sorts desc", () => {
    const assets = [
      makeAsset({ value: 100, currency: "EUR" }), // 500
      makeAsset({ value: 100, currency: "RON" }), // 100
      makeAsset({ value: 100, currency: "EUR" }), // 500 -> EUR total 1000
      makeAsset({ type: "loan", value: 100, currency: "USD" }), // excluded
    ];
    const exp = currencyExposure(assets, rates);
    expect(exp[0]).toEqual({ currency: "EUR", value: 1000 });
    expect(exp[1]).toEqual({ currency: "RON", value: 100 });
    expect(exp.find((e) => e.currency === "USD")).toBeUndefined();
  });
});

describe("changeFraction", () => {
  it("computes a signed fractional change", () => {
    expect(changeFraction(110, 100)).toBeCloseTo(0.1);
    expect(changeFraction(90, 100)).toBeCloseTo(-0.1);
  });
  it("returns 0 when the previous value is 0", () => {
    expect(changeFraction(100, 0)).toBe(0);
  });
});

describe("assetGain", () => {
  it("computes gain vs cost basis in base currency", () => {
    const a = makeAsset({
      type: "stock",
      value: 120,
      currency: "EUR",
      costBasis: 100,
    });
    const g = assetGain(a, rates);
    expect(g.hasCost).toBe(true);
    expect(g.valueBase).toBe(600);
    expect(g.costBase).toBe(500);
    expect(g.gain).toBe(100);
    expect(g.gainFraction).toBeCloseTo(0.2);
  });

  it("has no gain without a positive cost basis", () => {
    expect(assetGain(makeAsset({ value: 100, costBasis: 0 }), rates).hasCost).toBe(
      false,
    );
  });

  it("ignores cost basis on liabilities", () => {
    const a = makeAsset({ type: "loan", value: 100, costBasis: 80 });
    expect(assetGain(a, rates).hasCost).toBe(false);
  });
});

describe("portfolioGains", () => {
  it("aggregates only holdings that have a cost basis", () => {
    const assets = [
      makeAsset({ type: "stock", value: 120, costBasis: 100 }),
      makeAsset({ type: "savings", value: 50 }), // no cost basis -> ignored
    ];
    const p = portfolioGains(assets, rates);
    expect(p.count).toBe(1);
    expect(p.value).toBe(120);
    expect(p.cost).toBe(100);
    expect(p.gain).toBe(20);
    expect(p.gainFraction).toBeCloseTo(0.2);
  });
});

describe("incomeSummary", () => {
  it("projects income for savings and bonds, yielding on cost", () => {
    const assets = [
      makeAsset({
        type: "savings",
        value: 1000,
        currency: "RON",
        interestRate: 5,
        costBasis: 800,
      }), // income 50, cost 800
      makeAsset({ type: "bond", value: 100, currency: "EUR", interestRate: 4 }), // value 500, income 20, cost 500
      makeAsset({ type: "stock", value: 1000, interestRate: 10 }), // not income-bearing
    ];
    const s = incomeSummary(assets, rates);
    expect(s.count).toBe(2);
    expect(s.annualIncome).toBeCloseTo(70);
    expect(s.monthlyIncome).toBeCloseTo(70 / 12);
    expect(s.yieldOnCost).toBeCloseTo(70 / 1300);
  });

  it("ignores holdings without a positive rate", () => {
    expect(incomeSummary([makeAsset({ type: "savings", value: 1000 })], rates).count).toBe(
      0,
    );
  });
});

describe("liquiditySplit", () => {
  it("splits accessible (savings/stocks) vs locked (bonds/property/pension)", () => {
    const assets = [
      makeAsset({ type: "savings", value: 300, currency: "RON" }),
      makeAsset({ type: "stock", value: 200, currency: "RON" }),
      makeAsset({ type: "property", value: 1000, currency: "RON" }),
      makeAsset({ type: "pension", value: 500, currency: "RON" }),
      makeAsset({ type: "loan", value: 100, currency: "RON" }), // excluded
    ];
    const s = liquiditySplit(assets, rates);
    expect(s.accessible).toBe(500);
    expect(s.locked).toBe(1500);
    expect(s.total).toBe(2000);
    expect(s.accessibleFraction).toBeCloseTo(0.25);
  });
});

describe("debtMetrics", () => {
  it("computes the debt-to-asset ratio and annual interest cost", () => {
    const assets = [
      makeAsset({ type: "savings", value: 1000, currency: "RON" }),
      makeAsset({ type: "loan", value: 400, currency: "RON", interestRate: 10 }),
    ];
    const d = debtMetrics(assets, rates);
    expect(d.assets).toBe(1000);
    expect(d.liabilities).toBe(400);
    expect(d.debtToAsset).toBeCloseTo(0.4);
    expect(d.annualInterestCost).toBeCloseTo(40);
    expect(d.hasDebt).toBe(true);
  });

  it("reports no debt when there are no loans", () => {
    const d = debtMetrics([makeAsset({ type: "savings", value: 100 })], rates);
    expect(d.hasDebt).toBe(false);
    expect(d.debtToAsset).toBe(0);
  });
});
