"use client";

import { Activity } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCapital } from "@/hooks/useCapital";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCompactMoney, formatMoney, formatMonth } from "@/lib/format";

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { date: string } }[];
}

export function NetWorthChart() {
  const { snapshots } = useCapital();
  const { display, baseToDisplay } = useCurrency();

  const data = [...snapshots]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({ date: s.date, value: baseToDisplay(s.netWorth) }));

  const Custom = ({ active, payload }: TooltipProps) => {
    if (!active || !payload?.length) return null;
    const point = payload[0];
    return (
      <div className="rounded-lg border border-white/10 bg-ink-800/95 px-3 py-2 shadow-xl backdrop-blur">
        <p className="text-xs text-slate-400">{formatMonth(point.payload.date)}</p>
        <p className="text-sm font-semibold text-white tabular">
          {formatMoney(point.value, display)}
        </p>
      </div>
    );
  };

  return (
    <div className="card flex flex-col p-5">
      <header className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-brand-400" />
          <h2 className="text-sm font-semibold text-slate-200">Net worth trend</h2>
        </div>
        <span className="text-xs text-slate-500">in {display}</span>
      </header>

      {data.length < 2 ? (
        <EmptyChart label="Net-worth history will appear as it is recorded." />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148,163,184,0.08)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => formatMonth(d)}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={(v) => formatCompactMoney(Number(v), display)}
              stroke="#64748b"
              fontSize={11}
              width={64}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<Custom />} cursor={{ stroke: "rgba(148,163,184,0.2)" }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#34d399"
              strokeWidth={2.5}
              fill="url(#netWorthFill)"
              dot={false}
              activeDot={{ r: 4, fill: "#34d399", stroke: "#0b1120", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-center">
      <Activity size={28} className="text-slate-600" />
      <p className="max-w-[220px] text-sm text-slate-500">{label}</p>
    </div>
  );
}
