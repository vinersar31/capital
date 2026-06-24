"use client";

import { PieChart as PieIcon } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useCapital } from "@/hooks/useCapital";
import { useCurrency } from "@/hooks/useCurrency";
import { allocationByType, computeTotals } from "@/lib/calculations";
import { ASSET_META } from "@/lib/asset-meta";
import { formatCompactMoney, formatMoney, formatPercent } from "@/lib/format";

interface TooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; payload: { share: number } }[];
}

export function AllocationChart() {
  const { assets } = useCapital();
  const { rates, display, baseToDisplay } = useCurrency();

  const totalAssets = computeTotals(assets, rates).assets;
  const slices = allocationByType(assets, rates).map((slice) => ({
    type: slice.type,
    name: ASSET_META[slice.type].plural,
    color: ASSET_META[slice.type].color,
    value: baseToDisplay(slice.value),
    share: totalAssets > 0 ? slice.value / totalAssets : 0,
  }));

  const Custom = ({ active, payload }: TooltipProps) => {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    return (
      <div className="rounded-lg border border-white/10 bg-ink-800/95 px-3 py-2 shadow-xl backdrop-blur">
        <p className="text-xs text-slate-300">{p.name}</p>
        <p className="text-sm font-semibold text-white tabular">
          {formatMoney(p.value, display)} · {formatPercent(p.payload.share)}
        </p>
      </div>
    );
  };

  return (
    <div className="card flex flex-col p-5">
      <header className="mb-2 flex items-center gap-2">
        <PieIcon size={16} className="text-sky-400" />
        <h2 className="text-sm font-semibold text-slate-200">Allocation</h2>
      </header>

      {slices.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-slate-500">
          Add assets to see your allocation.
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={2}
                  stroke="none"
                >
                  {slices.map((slice) => (
                    <Cell key={slice.type} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip content={<Custom />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-slate-500">Assets</span>
              <span className="text-lg font-bold text-white tabular">
                {formatCompactMoney(baseToDisplay(totalAssets), display)}
              </span>
            </div>
          </div>

          <ul className="w-full space-y-1.5">
            {slices.map((slice) => (
              <li
                key={slice.type}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-slate-300">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  {slice.name}
                </span>
                <span className="tabular text-slate-400">
                  {formatPercent(slice.share)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
