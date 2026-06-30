"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IS_STATIC_EXPORT } from "@/lib/runtime";
import { useCapital } from "./useCapital";
import { useCurrency } from "./useCurrency";

const ENABLED_KEY = "capital.autoEmail.enabled.v1";
const LASTSENT_KEY = "capital.autoEmail.lastSent.v1";

export type AutoEmailStatus =
  | "idle"
  | "sending"
  | "sent"
  | "error"
  | "skipped";

/** Current month as "YYYY-MM". */
function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Opportunistic "monthly auto-email": when enabled, the first time the app is
 * opened in a new calendar month it emails the Excel report (if SMTP is set).
 * Disabled entirely in static-export builds (no server to send from).
 */
export function useAutoEmail() {
  const { assets, snapshots, loading } = useCapital();
  const { rates } = useCurrency();

  const [enabled, setEnabledState] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [status, setStatus] = useState<AutoEmailStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const attempted = useRef(false);

  // Restore persisted preference + last-sent month.
  useEffect(() => {
    const savedEnabled = window.localStorage.getItem(ENABLED_KEY);
    if (savedEnabled !== null) setEnabledState(savedEnabled === "true");
    setLastSent(window.localStorage.getItem(LASTSENT_KEY));
    setHydrated(true);
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    window.localStorage.setItem(ENABLED_KEY, String(value));
  }, []);

  const doSend = useCallback(async (): Promise<boolean> => {
    if (IS_STATIC_EXPORT) {
      setStatus("skipped");
      setMessage("Email needs a server deployment (e.g. Vercel).");
      return false;
    }
    setStatus("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assets, snapshots, rates }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        sentTo?: string;
      };
      if (res.ok && data.ok) {
        const month = currentMonthKey();
        window.localStorage.setItem(LASTSENT_KEY, month);
        setLastSent(month);
        setStatus("sent");
        setMessage(data.sentTo ? `Sent to ${data.sentTo}` : "Report sent");
        return true;
      }
      setStatus(res.status === 503 ? "skipped" : "error");
      setMessage(data.error ?? "Couldn't send the report.");
      return false;
    } catch {
      setStatus("error");
      setMessage("Network error while sending.");
      return false;
    }
  }, [assets, snapshots, rates]);

  // Fire once per session when a new month is due.
  useEffect(() => {
    if (IS_STATIC_EXPORT) return;
    if (!hydrated || loading || !enabled) return;
    if (attempted.current) return;
    if (!assets.length) return;
    if (lastSent === currentMonthKey()) return;
    attempted.current = true;
    void doSend();
  }, [hydrated, loading, enabled, assets.length, lastSent, doSend]);

  return { enabled, setEnabled, lastSent, status, message, sendNow: doSend };
}
