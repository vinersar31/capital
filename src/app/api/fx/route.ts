import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// BNR (National Bank of Romania) official daily reference rates, served from
// their dedicated XML endpoint and updated each banking day shortly after 13:00
// (RO time). The EUR value is already "RON per 1 EUR" — exactly what we need.
const BNR_URL = "https://curs.bnr.ro/nbrfxrates.xml";
const TTL_MS = 60 * 60 * 1000; // cache 1h — BNR only updates once per business day
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

let cache: { rate: number; date: string; ts: number } | null = null;

/**
 * BNR publishes RON-based reference rates as:
 *   <Cube date="2026-06-29">
 *     <Rate currency="EUR">5.2430</Rate>
 *     ...
 * EUR never carries a `multiplier` attribute, so the value is the EUR→RON rate.
 */
function parseEurRon(xml: string): { rate: number; date: string } | null {
  const rateMatch = xml.match(/<Rate\s+currency="EUR"[^>]*>\s*([\d.]+)\s*<\/Rate>/);
  if (!rateMatch) return null;
  const rate = Number(rateMatch[1]);
  if (!Number.isFinite(rate) || rate <= 0) return null;
  const date = xml.match(/<Cube\s+date="(\d{4}-\d{2}-\d{2})"/)?.[1] ?? "";
  return { rate, date };
}

async function fetchBnrEurRon(): Promise<{ rate: number; date: string } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(BNR_URL, {
      headers: { "User-Agent": UA, Accept: "application/xml,text/xml" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return parseEurRon(await res.text());
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.ts < TTL_MS) {
    return NextResponse.json({
      ok: true,
      rate: cache.rate,
      date: cache.date,
      source: "BNR",
      cached: true,
    });
  }

  try {
    const parsed = await fetchBnrEurRon();
    if (parsed && parsed.rate > 0) {
      cache = { rate: parsed.rate, date: parsed.date, ts: now };
      return NextResponse.json({
        ok: true,
        rate: parsed.rate,
        date: parsed.date,
        source: "BNR",
      });
    }
    return NextResponse.json(
      { ok: false, error: "Could not read EUR/RON from BNR." },
      { status: 502 },
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Fetch failed" },
      { status: 502 },
    );
  }
}
