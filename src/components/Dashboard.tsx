"use client";

import { AlertTriangle } from "lucide-react";
import { useCapital } from "@/hooks/useCapital";
import { TopBar } from "./TopBar";
import { HeroTotal } from "./HeroTotal";
import { SummaryCards } from "./SummaryCards";
import { NetWorthChart } from "./charts/NetWorthChart";
import { AllocationChart } from "./charts/AllocationChart";
import { CurrencyChart } from "./charts/CurrencyChart";
import { AssetsPanel } from "./AssetsPanel";

function Skeleton() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-2xl bg-white/5 lg:col-span-2" />
        <div className="h-80 animate-pulse rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}

export function Dashboard() {
  const { loading, error } = useCapital();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <TopBar />

      {error && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <Skeleton />
        ) : (
          <div className="space-y-4 sm:space-y-5">
            <HeroTotal />
            <SummaryCards />

            <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <NetWorthChart />
              </div>
              <AllocationChart />
            </div>

            <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <AssetsPanel />
              </div>
              <CurrencyChart />
            </div>
          </div>
        )}
      </div>

      <footer className="mt-10 pb-6 text-center text-xs text-slate-600">
        Capital · all amounts normalized to RON · FX rates from the European
        Central Bank
      </footer>
    </main>
  );
}
