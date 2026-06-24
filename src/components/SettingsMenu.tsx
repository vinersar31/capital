"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Send, Settings, TriangleAlert } from "lucide-react";
import clsx from "clsx";
import { useAutoEmail } from "@/hooks/useAutoEmail";

function monthLabel(key: string | null): string {
  if (!key) return "not yet";
  const date = new Date(`${key}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return key;
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function SettingsMenu() {
  const { enabled, setEnabled, lastSent, status, message, sendNow } =
    useAutoEmail();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const busy = status === "sending";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={clsx(
          "flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 transition-colors",
          open ? "bg-ink-800 text-white" : "bg-ink-850 text-slate-300 hover:text-white",
        )}
        title="Settings"
      >
        <Settings size={16} />
      </button>

      {open && (
        <div className="card absolute right-0 z-40 mt-2 w-72 animate-fade-in-up p-4">
          <p className="text-sm font-semibold text-white">Automation</p>

          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-200">
                Monthly auto-email
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Emails your Excel report once a month when you open the app.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled(!enabled)}
              className={clsx(
                "relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors",
                enabled ? "bg-brand-500" : "bg-white/10",
              )}
            >
              <span
                className={clsx(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                  enabled ? "translate-x-4" : "translate-x-0.5",
                )}
              />
            </button>
          </div>

          <div className="mt-3 border-t border-white/5 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Last sent: <span className="text-slate-300">{monthLabel(lastSent)}</span>
              </span>
              <button
                type="button"
                onClick={() => void sendNow()}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1 text-xs font-medium text-slate-200 transition-colors hover:bg-white/5 disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Send size={13} />
                )}
                Send now
              </button>
            </div>

            {message && (
              <p
                className={clsx(
                  "mt-2 flex items-center gap-1.5 text-xs",
                  status === "sent" && "text-brand-300",
                  status === "error" && "text-rose-300",
                  status === "skipped" && "text-amber-300",
                )}
              >
                {status === "sent" && <Check size={13} />}
                {(status === "error" || status === "skipped") && (
                  <TriangleAlert size={13} />
                )}
                {message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
