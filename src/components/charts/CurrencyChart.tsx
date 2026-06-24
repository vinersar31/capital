"use client";

import { Coins } from "lucide-react";
import { useCapital } from "@/hooks/useCapital";
import { useCurrency } from "@/hooks/useCurrency";
import { currencyExposure } from "@/lib/calculations";
import { formatMoney, formatPercent } from "@/lib/format";
import type { Currency } from "@/lib/types";

const CURRENCY_COLOR: Record<Currency, string> = {
  RON: "#34d399",
  EUR: "#38bdf8",
};

const CURRENCY_LABEL: Record<Currency, string> = {
  RON: "Romanian Leu",
  EUR: "Euro",
};

export function CurrencyChart() {
  const { assets } = useCapital();
  const { rates, display, baseToDisplay } = useCurrency();

  const exposure = currencyExposure(assets, rates);
  const total = exposure.reduce((sum, e) => sum + e.value, 0);

  return (
    <div className="card flex flex-col p-5">
      <header className="mb-4 flex items-center gap-2">
        <Coins size={16} className="text-amber-400" />
        <h2 className="text-sm font-semibold text-slate-200">Currency exposure</h2>
      </header>

      {total === 0 ? (
        <div className="flex h-[180px] items-center justify-center text-sm text-slate-500">
          No asset exposure yet.
        </div>
      ) : (
        <>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5">
            {exposure.map((e) => (
              <div
                key={e.currency}
                style={{
                  width: `${(e.value / total) * 100}%`,
                  backgroundColor: CURRENCY_COLOR[e.currency],
                }}
                title={`${e.currency} ${formatPercent(e.value / total)}`}
              />
            ))}
          </div>

          <ul className="mt-5 space-y-3">
            {exposure.map((e) => (
              <li key={e.currency} className="flex items-center justify-between">
                <span className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: CURRENCY_COLOR[e.currency] }}
                  />
                  <span className="text-sm font-medium text-slate-200">
                    {e.currency}
                  </span>
                  <span className="text-xs text-slate-500">
                    {CURRENCY_LABEL[e.currency]}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-semibold text-white tabular">
                    {formatMoney(baseToDisplay(e.value), display)}
                  </span>
                  <span className="block text-xs text-slate-500 tabular">
                    {formatPercent(e.value / total)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
