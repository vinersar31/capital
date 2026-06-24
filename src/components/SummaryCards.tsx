"use client";

import { useCapital } from "@/hooks/useCapital";
import { useCurrency } from "@/hooks/useCurrency";
import { computeTotals, totalsByType } from "@/lib/calculations";
import { ASSET_META } from "@/lib/asset-meta";
import { ASSET_TYPES, isLiability, type AssetType } from "@/lib/types";
import { formatMoney, formatPercent } from "@/lib/format";
import { AssetIcon } from "./AssetIcon";

export function SummaryCards() {
  const { assets } = useCapital();
  const { rates, display, baseToDisplay } = useCurrency();

  const buckets = totalsByType(assets, rates);
  const totals = computeTotals(assets, rates);

  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
      {ASSET_TYPES.map((type: AssetType, index) => {
        const meta = ASSET_META[type];
        const bucket = buckets.find((b) => b.type === type);
        const base = bucket?.base ?? 0;
        const count = bucket?.count ?? 0;
        const amount = baseToDisplay(base);
        const share = totals.assets > 0 ? base / totals.assets : 0;
        const liability = isLiability(type);

        return (
          <div
            key={type}
            className="card animate-fade-in-up p-4"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${meta.color}1f` }}
              >
                <AssetIcon type={type} className={`h-[18px] w-[18px] ${meta.text}`} />
              </span>
              <span className="text-xs text-slate-500">
                {count} {count === 1 ? "item" : "items"}
              </span>
            </div>

            <p className="mt-3 text-sm font-medium text-slate-400">{meta.plural}</p>
            <p className="mt-0.5 text-xl font-bold text-white tabular">
              {liability && base > 0 ? "−" : ""}
              {formatMoney(amount, display)}
            </p>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.max(share * 100, base > 0 ? 4 : 0))}%`,
                  backgroundColor: meta.color,
                }}
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              {liability ? "vs. assets " : ""}
              {formatPercent(share)} of assets
            </p>
          </div>
        );
      })}
    </section>
  );
}
