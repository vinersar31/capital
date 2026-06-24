"use client";

import { useState } from "react";
import { AlertCircle, Check, Loader2, Mail } from "lucide-react";
import clsx from "clsx";
import { useCapital } from "@/hooks/useCapital";
import { useCurrency } from "@/hooks/useCurrency";

type Status = "idle" | "sending" | "sent" | "error";

export function ExportButton() {
  const { assets, snapshots } = useCapital();
  const { eurRate } = useCurrency();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const send = async () => {
    setStatus("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assets, snapshots, eurRate }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        sentTo?: string;
      };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error ?? "Failed to send the report.");
        return;
      }
      setStatus("sent");
      setMessage(data.sentTo ? `Sent to ${data.sentTo}` : "Report sent");
      window.setTimeout(() => setStatus("idle"), 4000);
    } catch {
      setStatus("error");
      setMessage("Network error — is the server running?");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span
          className={clsx(
            "hidden max-w-[220px] truncate text-xs md:inline",
            status === "error" ? "text-rose-300" : "text-brand-300",
          )}
          title={message}
        >
          {message}
        </span>
      )}
      <button
        type="button"
        onClick={send}
        disabled={status === "sending"}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-ink-850 px-3.5 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-60"
        title="Email an Excel report"
      >
        {status === "sending" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : status === "sent" ? (
          <Check size={16} className="text-brand-400" />
        ) : status === "error" ? (
          <AlertCircle size={16} className="text-rose-400" />
        ) : (
          <Mail size={16} />
        )}
        <span className="hidden sm:inline">Email Excel</span>
      </button>
    </div>
  );
}
