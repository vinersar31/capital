import { NextResponse } from "next/server";
import { buildWorkbook } from "@/lib/export/workbook";
import { parseExportRequest, reportFilename } from "@/lib/export/parseBody";
import { maskEmail, readSmtpConfig, sendExportEmail } from "@/lib/email/sendExport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const parsed = await parseExportRequest(req);
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: parsed.error },
      { status: parsed.status },
    );
  }

  try {
    const buffer = await buildWorkbook(parsed.data);
    await sendExportEmail(config, { buffer, filename: reportFilename() });
    return NextResponse.json({ ok: true, sentTo: maskEmail(config.to) });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed to send email." },
      { status: 500 },
    );
  }
}
