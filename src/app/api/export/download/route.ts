import { NextResponse } from "next/server";
import { buildWorkbook } from "@/lib/export/workbook";
import { parseExportRequest, reportFilename } from "@/lib/export/parseBody";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Build the .xlsx report and return it as a file download (no email). */
export async function POST(req: Request) {
  const parsed = await parseExportRequest(req);
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: parsed.error },
      { status: parsed.status },
    );
  }

  try {
    const buffer = await buildWorkbook(parsed.data);
    const filename = reportFilename();
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed to build the report." },
      { status: 500 },
    );
  }
}
