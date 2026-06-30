"use client";

import { Sparkles } from "lucide-react";
import { LiquidityCard } from "./LiquidityCard";
import { DebtCard } from "./DebtCard";
import { IncomeCard } from "./IncomeCard";

export function Insights() {
  return (
    <section className="space-y-4 sm:space-y-5">
      <header className="flex items-center gap-2">
        <Sparkles size={18} className="text-brand-400" />
        <h2 className="text-base font-semibold text-white">Insights</h2>
      </header>

      <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <LiquidityCard />
        <DebtCard />
        <IncomeCard />
      </div>
    </section>
  );
}
