import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// BNR (National Bank of Romania) official daily reference rates, served from
// their dedicated XML endpoint and updated each banking day shortly after 13:00
// (RO time). Values are "RON per 1 unit", so EUR/USD are used as-is.
const BNR_URL = "https://curs.bnr.ro/nbrfxrates.xml";
const TTL_MS = 60 * 60 * 1000; // cache 1h — BNR only updates once per business day
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

let cache: { eur: number; usd: number; date: string; ts: number } | null = null;

/**
 * Read one currency's "RON per 1 unit" value from the BNR XML. BNR expresses
 * rates as RON per unit; some currencies carry a `multiplier` (e.g. 100) which
 * we divide back out. EUR and USD have no multiplier.
 */
function parseRate(xml: string, currency: string): number | null {
  const m = xml.match(
    new RegExp(`<Rate\\s+currency="${currency}"([^>]*)>\\s*([\\d.]+)\\s*</Rate>`),
  );
  if (!m) return null;
  const multiplier = Number(m[1].match(/multiplier="(\d+)"/)?.[1] ?? 1) || 1;
  const rate = Number(m[2]) / multiplier;
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

function parseRates(
  xml: string,
): { eur: number; usd: number; date: string } | null {
  const eur = parseRate(xml, "EUR");
  if (eur == null) return null;
  const usd = parseRate(xml, "USD") ?? 0;
  const date = xml.match(/<Cube\s+date="(\d{4}-\d{2}-\d{2})"/)?.[1] ?? "";
  return { eur, usd, date };
}

async function fetchBnrRates(): Promise<{
  eur: number;
  usd: number;
  date: string;
} | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(BNR_URL, {
      headers: { "User-Agent": UA, Accept: "application/xml,text/xml" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return parseRates(await res.text());
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(req: Request) {
  // A `?force=1` flag (sent by the manual "refresh" click) bypasses the cache.
  const force = new URL(req.url).searchParams.has("force");
  const now = Date.now();
  if (!force && cache && now - cache.ts < TTL_MS) {
    return NextResponse.json({
      ok: true,
      eur: cache.eur,
      usd: cache.usd,
      date: cache.date,
      source: "BNR",
      cached: true,
    });
  }

  try {
    const parsed = await fetchBnrRates();
    if (parsed && parsed.eur > 0) {
      cache = { eur: parsed.eur, usd: parsed.usd, date: parsed.date, ts: now };
      return NextResponse.json({
        ok: true,
        eur: parsed.eur,
        usd: parsed.usd,
        date: parsed.date,
        source: "BNR",
      });
    }
    return NextResponse.json(
      { ok: false, error: "Could not read rates from BNR." },
      { status: 502 },
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Fetch failed" },
      { status: 502 },
    );
  }
}
