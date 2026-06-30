"use client";

import { Network } from "lucide-react";
import { useCapital } from "@/hooks/useCapital";
import { useCurrency } from "@/hooks/useCurrency";
import { concentration, type ConcentrationStat } from "@/lib/calculations";
import { formatPercent } from "@/lib/format";

function Row({
  label,
  stat,
}: {
  label: string;
  stat: ConcentrationStat | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-xs text-slate-500">{label}</span>
      {stat ? (
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className="truncate text-sm text-slate-300">{stat.label}</span>
          <span className="shrink-0 text-sm font-semibold text-slate-200 tabular">
            {formatPercent(stat.share)}
          </span>
        </span>
      ) : (
        <span className="text-sm text-slate-600">&mdash;</span>
      )}
    </div>
  );
}

export function DiversificationCard() {
  const { assets } = useCapital();
  const { rates } = useCurrency();
  const c = concentration(assets, rates);

  const scoreColor =
    c.score >= 66
      ? "text-brand-300"
      : c.score >= 33
        ? "text-amber-300"
        : "text-rose-300";

  return (
    <section className="card p-5">
      <header className="mb-3 flex items-center gap-2">
        <Network size={16} className="text-brand-400" />
        <h3 className="text-sm font-semibold text-slate-200">Diversification</h3>
      </header>

      {c.topHolding === null ? (
        <p className="text-sm text-slate-500">No assets to assess yet.</p>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold tabular ${scoreColor}`}>
              {c.score}
            </span>
            <span className="text-sm text-slate-500">/ 100 spread</span>
          </div>
          <div className="mt-4 space-y-2">
            <Row label="Largest holding" stat={c.topHolding} />
            <Row label="Top institution" stat={c.topInstitution} />
            <Row label="Top currency" stat={c.topCurrency} />
          </div>
        </>
      )}
    </section>
  );
}
