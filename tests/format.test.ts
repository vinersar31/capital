import { describe, expect, it } from "vitest";
import {
  formatMoney,
  formatPercent,
  formatSignedPercent,
} from "../src/lib/format";

describe("formatSignedPercent", () => {
  it("prefixes a plus sign for positive values", () => {
    expect(formatSignedPercent(0.05).startsWith("+")).toBe(true);
  });
  it("prefixes a minus sign (U+2212) for negative values", () => {
    expect(formatSignedPercent(-0.05).startsWith("\u2212")).toBe(true);
  });
  it("has no sign for zero", () => {
    const out = formatSignedPercent(0);
    expect(out.startsWith("+")).toBe(false);
    expect(out.startsWith("\u2212")).toBe(false);
  });
});

describe("formatPercent", () => {
  it("renders a percent string", () => {
    expect(formatPercent(0)).toContain("0");
    expect(formatPercent(0.5)).toContain("%");
  });
});

describe("formatMoney", () => {
  it("renders the amount", () => {
    expect(formatMoney(1000, "RON")).toMatch(/1/);
  });
  it("coerces a non-finite amount to zero", () => {
    expect(formatMoney(Number.NaN, "RON")).toContain("0");
  });
});
