import { NextResponse } from "next/server";
import type { Asset, Snapshot } from "@/lib/types";
import { buildWorkbook } from "@/lib/export/workbook";
import { maskEmail, readSmtpConfig, sendExportEmail } from "@/lib/email/sendExport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ExportBody {
  assets?: unknown;
  snapshots?: unknown;
  eurRate?: unknown;
}

export async function POST(req: Request) {
  // Recipient + SMTP come only from server-side secrets.
  const config = readSmtpConfig();
  if (!config) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Email export isn't configured. Add EXPORT_EMAIL_TO and SMTP_* to .env.local, then restart the server.",
      },
      { status: 503 },
    );
  }

  let body: ExportBody;
  try {
    body = (await req.json()) as ExportBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.assets)) {
    return NextResponse.json({ ok: false, error: "Missing assets." }, { status: 400 });
  }
  if (body.assets.length > 5000) {
    return NextResponse.json({ ok: false, error: "Too many records." }, { status: 413 });
  }

  const assets = body.assets as Asset[];
  const snapshots = Array.isArray(body.snapshots)
    ? (body.snapshots as Snapshot[])
    : [];
  const eurRate = Number(body.eurRate) > 0 ? Number(body.eurRate) : 4.98;

  try {
    const buffer = await buildWorkbook({ assets, snapshots, eurRate });
    const filename = `capital-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
    await sendExportEmail(config, { buffer, filename });
    return NextResponse.json({ ok: true, sentTo: maskEmail(config.to) });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed to send email." },
      { status: 500 },
    );
  }
}
