"use client";

import { Scale } from "lucide-react";
import { useCapital } from "@/hooks/useCapital";
import { useCurrency } from "@/hooks/useCurrency";
import { debtMetrics } from "@/lib/calculations";
import { formatMoney, formatPercent } from "@/lib/format";

export function DebtCard() {
  const { assets } = useCapital();
  const { rates, display, baseToDisplay } = useCurrency();
  const debt = debtMetrics(assets, rates);

  return (
    <section className="card p-5">
      <header className="mb-3 flex items-center gap-2">
        <Scale size={16} className="text-rose-400" />
        <h3 className="text-sm font-semibold text-slate-200">Debt</h3>
      </header>

      {!debt.hasDebt ? (
        <p className="text-sm text-slate-500">No liabilities &mdash; debt-free.</p>
      ) : (
        <>
          <p className="text-2xl font-bold text-white tabular">
            {formatPercent(debt.debtToAsset)}
            <span className="ml-1 text-sm font-medium text-slate-500">
              of assets
            </span>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="stat-label text-slate-500">Owed</p>
              <p className="mt-0.5 text-sm font-semibold text-rose-300 tabular">
                {formatMoney(baseToDisplay(debt.liabilities), display)}
              </p>
            </div>
            <div>
              <p className="stat-label text-slate-500">Interest / yr</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-200 tabular">
                {debt.annualInterestCost > 0
                  ? formatMoney(baseToDisplay(debt.annualInterestCost), display)
                  : "\u2014"}
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
