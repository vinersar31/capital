"use client";

import { useMemo, useState } from "react";
import { Check, Pencil, Plus, Trash2, Wallet, X } from "lucide-react";
import clsx from "clsx";
import { useCapital } from "@/hooks/useCapital";
import { useCurrency } from "@/hooks/useCurrency";
import { ASSET_META, PILLAR_META } from "@/lib/asset-meta";
import { ASSET_TYPES, isLiability, type Asset, type AssetType } from "@/lib/types";
import { assetGain } from "@/lib/calculations";
import { formatMoney, formatSignedPercent } from "@/lib/format";
import { AssetIcon } from "./AssetIcon";
import { AssetFormModal } from "./AssetFormModal";
import { Sparkline } from "./Sparkline";
import { ExportButton } from "./ExportButton";
import { DownloadButton } from "./DownloadButton";

type Filter = AssetType | "all";

export function AssetsPanel() {
  const { assets, deleteAsset } = useCapital();
  const { display, toDisplay, toBaseCurrency, baseToDisplay, rates } = useCurrency();

  const [filter, setFilter] = useState<Filter>("all");
  const [modal, setModal] = useState<{ open: boolean; initial: Asset | null }>({
    open: false,
    initial: null,
  });
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = filter === "all" ? assets : assets.filter((a) => a.type === filter);
    return [...list].sort(
      (a, b) =>
        toBaseCurrency(b.value, b.currency) - toBaseCurrency(a.value, a.currency),
    );
  }, [assets, filter, toBaseCurrency]);

  const filters: Filter[] = ["all", ...ASSET_TYPES];

  const subtitle = (asset: Asset): string => {
    const parts: string[] = [];
    if (asset.pillar) parts.push(PILLAR_META[asset.pillar].short);
    if (asset.institution) parts.push(asset.institution);
    if (asset.quantity != null) parts.push(`${asset.quantity} units`);
    if (asset.interestRate != null) parts.push(`${asset.interestRate}%`);
    return parts.join(" · ");
  };

  return (
    <section className="card p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-brand-400" />
          <h2 className="text-base font-semibold text-white">Holdings</h2>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-400">
            {assets.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <DownloadButton />
          <ExportButton />
          <button
            type="button"
            onClick={() => setModal({ open: true, initial: null })}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-brand-400"
          >
            <Plus size={16} />
            Add holding
          </button>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {filters.map((f) => {
          const count =
            f === "all" ? assets.length : assets.filter((a) => a.type === f).length;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === f
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
              )}
            >
              {f === "all" ? "All" : ASSET_META[f].label}
              <span className="ml-1.5 text-slate-500">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 divide-y divide-white/5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
              <Wallet size={22} className="text-slate-500" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-300">No holdings here yet</p>
              <p className="text-sm text-slate-500">
                Add your assets, savings, pensions and loans to track them.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModal({ open: true, initial: null })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5"
            >
              <Plus size={15} /> Add your first holding
            </button>
          </div>
        ) : (
          filtered.map((asset) => {
            const meta = ASSET_META[asset.type];
            const liability = isLiability(asset.type);
            const displayValue = toDisplay(asset.value, asset.currency);
            const gain = assetGain(asset, rates);
            const sub = subtitle(asset);
            return (
              <div
                key={asset.id}
                className="group flex items-center gap-3 py-3"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${meta.color}1f` }}
                >
                  <AssetIcon type={asset.type} className={`h-5 w-5 ${meta.text}`} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-100">
                    {asset.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {sub || meta.label}
                  </p>
                </div>

                {asset.history && asset.history.length >= 2 && (
                  <div className="hidden w-20 shrink-0 sm:block" title="Value history">
                    <Sparkline
                      values={asset.history.map((p) => p.value)}
                      invert={liability}
                      width={80}
                      height={28}
                      className="h-7 w-full"
                    />
                  </div>
                )}

                <div className="shrink-0 text-right">
                  <p
                    className={clsx(
                      "text-sm font-semibold tabular",
                      liability ? "text-rose-300" : "text-white",
                    )}
                  >
                    {liability ? "−" : ""}
                    {formatMoney(displayValue, display)}
                  </p>
                  {gain.hasCost ? (
                    <p
                      className={clsx(
                        "text-xs font-medium tabular",
                        gain.gain > 0
                          ? "text-brand-300"
                          : gain.gain < 0
                            ? "text-rose-300"
                            : "text-slate-500",
                      )}
                      title={`${gain.gain >= 0 ? "+" : "−"}${formatMoney(
                        Math.abs(baseToDisplay(gain.gain)),
                        display,
                      )} vs cost`}
                    >
                      {formatSignedPercent(gain.gainFraction)}
                    </p>
                  ) : (
                    asset.currency !== display && (
                      <p className="text-xs text-slate-500 tabular">
                        {formatMoney(asset.value, asset.currency)}
                      </p>
                    )
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {confirmingId === asset.id ? (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteAsset(asset.id);
                          setConfirmingId(null);
                        }}
                        className="rounded-md p-1.5 text-rose-300 transition-colors hover:bg-rose-500/15"
                        aria-label="Confirm delete"
                        title="Confirm delete"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/5"
                        aria-label="Cancel"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setModal({ open: true, initial: asset })}
                        className="rounded-md p-1.5 text-slate-400 opacity-0 transition-all hover:bg-white/5 hover:text-white focus:opacity-100 group-hover:opacity-100"
                        aria-label={`Edit ${asset.name}`}
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(asset.id)}
                        className="rounded-md p-1.5 text-slate-400 opacity-0 transition-all hover:bg-rose-500/15 hover:text-rose-300 focus:opacity-100 group-hover:opacity-100"
                        aria-label={`Delete ${asset.name}`}
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <AssetFormModal
        open={modal.open}
        initial={modal.initial}
        onClose={() => setModal({ open: false, initial: null })}
      />
    </section>
  );
}
