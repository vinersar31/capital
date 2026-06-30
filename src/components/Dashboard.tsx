"use client";

import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCapital } from "@/hooks/useCapital";
import { SignInScreen } from "./SignInScreen";
import { TopBar } from "./TopBar";
import { HeroTotal } from "./HeroTotal";
import { SummaryCards } from "./SummaryCards";
import { NetWorthChart } from "./charts/NetWorthChart";
import { AllocationChart } from "./charts/AllocationChart";
import { CurrencyChart } from "./charts/CurrencyChart";
import { AssetsPanel } from "./AssetsPanel";
import { Insights } from "./insights/Insights";

function Skeleton() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-white/5" />
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
      </div>
      <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-white/5" />
    </div>
  );
}

export function Dashboard() {
  const { configured, user, loading: authLoading } = useAuth();
  const { loading, error } = useCapital();

  // When Firebase is configured, require Google sign-in so the app shows YOUR
  // Firestore data — never local/sample data.
  if (configured && authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-brand-400" />
      </main>
    );
  }
  if (configured && !user) {
    return <SignInScreen />;
  }

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

            <NetWorthChart />

            <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
              <AllocationChart />
              <CurrencyChart />
            </div>

            <Insights />

            <AssetsPanel />
          </div>
        )}
      </div>

      <footer className="mt-10 pb-6 text-center text-xs text-slate-600">
        Capital · all amounts normalized to RON · EUR &amp; USD/RON from BNR
      </footer>
    </main>
  );
}
