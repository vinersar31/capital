"use client";

import { Cloud, HardDrive, LineChart, RefreshCw } from "lucide-react";
import { useCapital } from "@/hooks/useCapital";
import { useCurrency } from "@/hooks/useCurrency";
import { CurrencyToggle } from "./CurrencyToggle";
import { AuthButton } from "./AuthButton";
import { SettingsMenu } from "./SettingsMenu";

export function TopBar() {
  const { mode } = useCapital();
  const { eurRate, ratesLive, rateSource } = useCurrency();

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow">
          <LineChart className="h-6 w-6 text-ink-950" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Capital</h1>
          <p className="text-xs text-slate-400">Your complete net-worth dashboard</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-ink-850 px-2.5 py-1.5 text-xs text-slate-400"
          title={ratesLive ? `Live EUR/RON via ${rateSource}` : "Offline fallback rate"}
        >
          <RefreshCw
            size={12}
            className={ratesLive ? "text-brand-400" : "text-slate-500"}
          />
          1&nbsp;EUR&nbsp;=&nbsp;
          <span className="font-semibold text-slate-200 tabular">
            {eurRate.toFixed(2)}
          </span>
          &nbsp;RON
          {ratesLive && (
            <span className="hidden text-slate-500 lg:inline">· {rateSource}</span>
          )}
        </span>

        <span
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-ink-850 px-2.5 py-1.5 text-xs text-slate-400"
          title={
            mode === "cloud"
              ? "Synced to Firebase Firestore"
              : "Stored locally in this browser"
          }
        >
          {mode === "cloud" ? (
            <Cloud size={13} className="text-brand-400" />
          ) : (
            <HardDrive size={13} className="text-slate-500" />
          )}
          <span className="hidden md:inline">
            {mode === "cloud" ? "Cloud" : "Local"}
          </span>
        </span>

        <CurrencyToggle />
        <SettingsMenu />
        <AuthButton />
      </div>
    </header>
  );
}
