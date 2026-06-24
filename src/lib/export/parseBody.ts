import type { Asset, Snapshot } from "../types";

export interface ParsedExport {
  assets: Asset[];
  snapshots: Snapshot[];
  /** RON per 1 EUR. */
  eurRate: number;
}

export type ParseResult =
  | { ok: true; data: ParsedExport }
  | { ok: false; status: number; error: string };

/** Validate and normalize the JSON body shared by the export endpoints. */
export async function parseExportRequest(req: Request): Promise<ParseResult> {
  let body: { assets?: unknown; snapshots?: unknown; eurRate?: unknown };
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
  const eurRate = Number(body.eurRate) > 0 ? Number(body.eurRate) : 4.98;

  return { ok: true, data: { assets, snapshots, eurRate } };
}

export function reportFilename(): string {
  return `capital-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
}
