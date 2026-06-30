import { CURRENCIES, type Asset, type Snapshot } from "../types";
import { DEFAULT_RATES_TO_BASE, type RatesToBase } from "../currency";

export interface ParsedExport {
  assets: Asset[];
  snapshots: Snapshot[];
  /** RON per 1 unit of each currency. */
  rates: RatesToBase;
}

export type ParseResult =
  | { ok: true; data: ParsedExport }
  | { ok: false; status: number; error: string };

/** Validate the posted rate map, falling back to safe defaults. */
function parseRates(input: unknown): RatesToBase {
  const out: RatesToBase = { ...DEFAULT_RATES_TO_BASE };
  if (input && typeof input === "object") {
    const map = input as Record<string, unknown>;
    for (const c of CURRENCIES) {
      const v = Number(map[c]);
      if (Number.isFinite(v) && v > 0) out[c] = v;
    }
  }
  out.RON = 1;
  return out;
}

/** Validate and normalize the JSON body used by the export endpoint. */
export async function parseExportRequest(req: Request): Promise<ParseResult> {
  let body: { assets?: unknown; snapshots?: unknown; rates?: unknown };
  try {
    body = await req.json();
  } catch {
    return { ok: false, status: 400, error: "Invalid request body." };
  }

  if (!Array.isArray(body.assets)) {
    return { ok: false, status: 400, error: "Missing assets." };
  }
  if (body.assets.length > 5000) {
    return { ok: false, status: 413, error: "Too many records." };
  }

  const assets = body.assets as Asset[];
  const snapshots = Array.isArray(body.snapshots)
    ? (body.snapshots as Snapshot[])
    : [];
  const rates = parseRates(body.rates);

  return { ok: true, data: { assets, snapshots, rates } };
}

export function reportFilename(): string {
  return `capital-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
}
