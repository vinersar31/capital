"use client";

import { ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";
import clsx from "clsx";
import { useCapital } from "@/hooks/useCapital";
import { useCurrency } from "@/hooks/useCurrency";
import { topMovers, type Mover } from "@/lib/calculations";
import { ASSET_META } from "@/lib/asset-meta";
import { formatMoney, formatSignedPercent } from "@/lib/format";
import { AssetIcon } from "../AssetIcon";

function MoverRow({ mover }: { mover: Mover }) {
  const { display, baseToDisplay } = useCurrency();
  const meta = ASSET_META[mover.asset.type];
  const positive = mover.netEffect >= 0;
  const effect = baseToDisplay(mover.netEffect);
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${meta.color}1f` }}
      >
        <AssetIcon
          type={mover.asset.type}
          className={`h-[18px] w-[18px] ${meta.text}`}
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-100">
          {mover.asset.name}
        </p>
        <p className="truncate text-xs text-slate-500">
          {mover.isLiability ? "Debt change" : meta.label}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={clsx(
            "text-sm font-semibold tabular",
            positive ? "text-brand-300" : "text-rose-300",
          )}
        >
          {effect >= 0 ? "+" : "−"}
          {formatMoney(Math.abs(effect), display)}
        </p>
        <p className="text-xs text-slate-500 tabular">
          {formatSignedPercent(mover.deltaFraction)}
        </p>
      </div>
    </div>
  );
}

export function TopMovers() {
  const { assets } = useCapital();
  const { rates } = useCurrency();
  const movers = topMovers(assets, rates);

  const gainers = movers.filter((m) => m.netEffect > 0).slice(0, 3);
  const losers = movers
    .filter((m) => m.netEffect < 0)
    .slice(-3)
    .reverse();

  return (
    <section className="card flex flex-col p-5">
      <header className="mb-1 flex items-center gap-2">
        <TrendingUp size={16} className="text-brand-400" />
        <h3 className="text-sm font-semibold text-slate-200">Top movers</h3>
        <span className="ml-auto text-xs text-slate-500">since last update</span>
      </header>

      {movers.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <TrendingUp size={26} className="text-slate-600" />
          <p className="max-w-[240px] text-sm text-slate-500">
            Update a holding&rsquo;s value to see what moved your net worth.
          </p>
        </div>
      ) : (
        <div className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <div>
            <p className="mb-1 flex items-center gap-1 text-xs font-medium text-brand-300">
              <ArrowUpRight size={13} /> Gainers
            </p>
            <div className="divide-y divide-white/5">
              {gainers.length ? (
                gainers.map((m) => <MoverRow key={m.asset.id} mover={m} />)
              ) : (
                <p className="py-3 text-xs text-slate-500">None yet.</p>
              )}
            </div>
          </div>
          <div>
            <p className="mb-1 flex items-center gap-1 text-xs font-medium text-rose-300">
              <ArrowDownRight size={13} /> Losers
            </p>
            <div className="divide-y divide-white/5">
              {losers.length ? (
                losers.map((m) => <MoverRow key={m.asset.id} mover={m} />)
              ) : (
                <p className="py-3 text-xs text-slate-500">None yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
