import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOOGLE_URL = "https://www.google.com/finance/quote/EUR-RON";
const TTL_MS = 10 * 60 * 1000; // cache for 10 minutes
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

let cache: { rate: number; ts: number } | null = null;

/**
 * Google Finance embeds a time-series of price points in the page like:
 *   [[2026,6,22,23,58,null,null,[]],[5.237631,...]
 * The most recent point (last match) is the current EUR→RON price.
 */
function parseEurRon(html: string): number | null {
  const re = /\[20\d\d,\d{1,2},\d{1,2},\d{1,2},\d{1,2}[^[]*\[\]\],\[(\d+\.\d+),/g;
  let last: number | null = null;
  for (const match of html.matchAll(re)) {
    const n = Number(match[1]);
    if (Number.isFinite(n) && n > 0) last = n;
  }
  return last;
}

async function fetchGoogleEurRon(): Promise<number | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(GOOGLE_URL, {
      headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
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
      source: "Google Finance",
      cached: true,
    });
  }

  try {
    const rate = await fetchGoogleEurRon();
    if (rate && rate > 0) {
      cache = { rate, ts: now };
      return NextResponse.json({ ok: true, rate, source: "Google Finance" });
    }
    return NextResponse.json(
      { ok: false, error: "Could not read EUR/RON from Google Finance." },
      { status: 502 },
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Fetch failed" },
      { status: 502 },
    );
  }
}
