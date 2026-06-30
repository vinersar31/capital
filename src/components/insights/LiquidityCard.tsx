"use client";

import { Droplets } from "lucide-react";
import { useCapital } from "@/hooks/useCapital";
import { useCurrency } from "@/hooks/useCurrency";
import { liquiditySplit } from "@/lib/calculations";
import { formatMoney, formatPercent } from "@/lib/format";

export function LiquidityCard() {
  const { assets } = useCapital();
  const { rates, display, baseToDisplay } = useCurrency();
  const split = liquiditySplit(assets, rates);
  const lockedFraction = 1 - split.accessibleFraction;

  return (
    <section className="card p-5">
      <header className="mb-3 flex items-center gap-2">
        <Droplets size={16} className="text-sky-400" />
        <h3 className="text-sm font-semibold text-slate-200">Liquidity</h3>
      </header>

      {split.total === 0 ? (
        <p className="text-sm text-slate-500">No assets to assess yet.</p>
      ) : (
        <>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full bg-brand-400"
              style={{ width: `${split.accessibleFraction * 100}%` }}
            />
            <div
              className="h-full bg-amber-400"
              style={{ width: `${lockedFraction * 100}%` }}
            />
          </div>
          <div className="mt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-400" />
                Accessible
              </span>
              <span className="text-right text-sm font-semibold text-white tabular">
                {formatMoney(baseToDisplay(split.accessible), display)}
                <span className="ml-1.5 text-xs font-normal text-slate-500">
                  {formatPercent(split.accessibleFraction)}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                Locked
              </span>
              <span className="text-right text-sm font-semibold text-white tabular">
                {formatMoney(baseToDisplay(split.locked), display)}
                <span className="ml-1.5 text-xs font-normal text-slate-500">
                  {formatPercent(lockedFraction)}
                </span>
              </span>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
