import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BASE_CURRENCY,
  DEFAULT_RATES_TO_BASE,
  convert,
  fetchRatesToBase,
  toBase,
  type RatesToBase,
} from "../src/lib/currency";

const rates: RatesToBase = { RON: 1, EUR: 5, USD: 4 };

describe("convert", () => {
  it("returns the same amount within one currency", () => {
    expect(convert(100, "RON", "RON", rates)).toBe(100);
  });
  it("converts a foreign currency into the base", () => {
    expect(convert(10, "EUR", "RON", rates)).toBe(50);
    expect(convert(10, "USD", "RON", rates)).toBe(40);
  });
  it("converts the base into a foreign currency", () => {
    expect(convert(50, "RON", "EUR", rates)).toBe(10);
  });
  it("converts between two foreign currencies via the base", () => {
    expect(convert(8, "USD", "EUR", rates)).toBeCloseTo(6.4); // 8 * 4 / 5
  });
  it("guards against non-finite amounts", () => {
    expect(convert(Number.NaN, "EUR", "RON", rates)).toBe(0);
  });
});

describe("toBase", () => {
  it("normalizes an amount to RON", () => {
    expect(toBase(3, "EUR", rates)).toBe(15);
    expect(BASE_CURRENCY).toBe("RON");
  });
});

describe("fetchRatesToBase", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("falls back to the offline defaults when every source fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const res = await fetchRatesToBase();
    expect(res.source).toBe("fallback");
    expect(res.rates).toEqual(DEFAULT_RATES_TO_BASE);
  });
});
