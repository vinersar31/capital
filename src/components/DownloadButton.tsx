"use client";

import { useState } from "react";
import { AlertCircle, Download, Loader2 } from "lucide-react";
import { useCapital } from "@/hooks/useCapital";
import { useCurrency } from "@/hooks/useCurrency";
import { reportFilename } from "@/lib/export/parseBody";

type Status = "idle" | "working" | "error";

export function DownloadButton() {
  const { assets, snapshots } = useCapital();
  const { eurRate } = useCurrency();
  const [status, setStatus] = useState<Status>("idle");

  const download = async () => {
    setStatus("working");
    try {
      // Generated client-side so it also works on static hosts (GitHub Pages).
      const { buildWorkbook } = await import("@/lib/export/workbook");
      const bytes = await buildWorkbook({ assets, snapshots, eurRate });
      const blob = new Blob([bytes as unknown as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = reportFilename();
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus("idle");
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <button
      type="button"
      onClick={download}
      disabled={status === "working"}
      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-ink-850 px-3.5 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-60"
      title="Download an Excel report"
    >
      {status === "working" ? (
        <Loader2 size={16} className="animate-spin" />
      ) : status === "error" ? (
        <AlertCircle size={16} className="text-rose-400" />
      ) : (
        <Download size={16} />
      )}
      <span className="hidden sm:inline">Download</span>
    </button>
  );
}
