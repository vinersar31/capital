"use client";

import { ArrowDownRight, ArrowUpRight, Minus, TrendingDown, TrendingUp } from "lucide-react";
import clsx from "clsx";
import { useCapital } from "@/hooks/useCapital";
import { useCurrency } from "@/hooks/useCurrency";
import { changeFraction, computeTotals } from "@/lib/calculations";
import { formatMoney, formatSignedPercent } from "@/lib/format";

export function HeroTotal() {
  const { assets, snapshots } = useCapital();
  const { rates, display, baseToDisplay } = useCurrency();

  const totals = computeTotals(assets, rates);
  const netDisplay = baseToDisplay(totals.netWorth);
  const assetsDisplay = baseToDisplay(totals.assets);
  const liabilitiesDisplay = baseToDisplay(totals.liabilities);

  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const current = sorted.length ? sorted[sorted.length - 1].netWorth : totals.netWorth;
  const previous = sorted.length > 1 ? sorted[sorted.length - 2].netWorth : current;
  const change = changeFraction(current, previous);
  const changeAbs = baseToDisplay(current - previous);

  const direction = change > 0.0001 ? "up" : change < -0.0001 ? "down" : "flat";

  return (
    <section className="card animate-fade-in-up overflow-hidden p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="stat-label">Total capital</p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent tabular sm:text-6xl">
              {formatMoney(netDisplay, display)}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span
              className={clsx(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold",
                direction === "up" && "bg-brand-500/15 text-brand-300",
                direction === "down" && "bg-rose-500/15 text-rose-300",
                direction === "flat" && "bg-white/5 text-slate-400",
              )}
            >
              {direction === "up" && <ArrowUpRight size={15} />}
              {direction === "down" && <ArrowDownRight size={15} />}
              {direction === "flat" && <Minus size={15} />}
              {formatSignedPercent(change)}
            </span>
            <span className="text-sm text-slate-400">
              {changeAbs >= 0 ? "+" : "−"}
              {formatMoney(Math.abs(changeAbs), display)} since last update
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-xl border border-white/5 bg-ink-850/60 px-4 py-3">
            <div className="flex items-center gap-1.5 text-brand-300">
              <TrendingUp size={14} />
              <span className="stat-label text-brand-300/80">Assets</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-white tabular sm:text-xl">
              {formatMoney(assetsDisplay, display)}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-ink-850/60 px-4 py-3">
            <div className="flex items-center gap-1.5 text-rose-300">
              <TrendingDown size={14} />
              <span className="stat-label text-rose-300/80">Liabilities</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-white tabular sm:text-xl">
              {liabilitiesDisplay > 0 ? "−" : ""}
              {formatMoney(liabilitiesDisplay, display)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
