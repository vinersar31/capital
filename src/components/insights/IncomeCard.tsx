"use client";

import { Coins } from "lucide-react";
import { useCapital } from "@/hooks/useCapital";
import { useCurrency } from "@/hooks/useCurrency";
import { incomeSummary } from "@/lib/calculations";
import { formatMoney, formatPercent } from "@/lib/format";

export function IncomeCard() {
  const { assets } = useCapital();
  const { rates, display, baseToDisplay } = useCurrency();
  const income = incomeSummary(assets, rates);

  return (
    <section className="card p-5">
      <header className="mb-3 flex items-center gap-2">
        <Coins size={16} className="text-brand-400" />
        <h3 className="text-sm font-semibold text-slate-200">Passive income</h3>
      </header>

      {income.count === 0 ? (
        <p className="text-sm text-slate-500">
          Add an interest rate to a savings or bond holding to project income.
        </p>
      ) : (
        <>
          <p className="text-2xl font-bold text-white tabular">
            {formatMoney(baseToDisplay(income.annualIncome), display)}
            <span className="ml-1 text-sm font-medium text-slate-500">/ year</span>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="stat-label text-slate-500">Monthly</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-200 tabular">
                {formatMoney(baseToDisplay(income.monthlyIncome), display)}
              </p>
            </div>
            <div>
              <p className="stat-label text-slate-500">Yield on cost</p>
              <p className="mt-0.5 text-sm font-semibold text-brand-300 tabular">
                {formatPercent(income.yieldOnCost)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            From {income.count} interest-bearing{" "}
            {income.count === 1 ? "holding" : "holdings"}.
          </p>
        </>
      )}
    </section>
  );
}
