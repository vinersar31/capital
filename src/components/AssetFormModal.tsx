"use client";

import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { useCapital } from "@/hooks/useCapital";
import { ASSET_META, PILLAR_META } from "@/lib/asset-meta";
import {
  ASSET_TYPES,
  CURRENCIES,
  isLiability,
  type Asset,
  type AssetDraft,
  type AssetType,
  type Currency,
  type PensionPillar,
} from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { Sparkline } from "./Sparkline";

interface Props {
  open: boolean;
  initial: Asset | null;
  onClose: () => void;
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-ink-850 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/40";
const labelClass = "mb-1 block text-xs font-medium text-slate-400";

function toNumber(value: string): number {
  return Number(value.replace(",", "."));
}

export function AssetFormModal({ open, initial, onClose }: Props) {
  const { addAsset, editAsset } = useCapital();

  const [name, setName] = useState("");
  const [type, setType] = useState<AssetType>("stock");
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState<Currency>("RON");
  const [institution, setInstitution] = useState("");
  const [pillar, setPillar] = useState<PensionPillar>("pilon2");
  const [quantity, setQuantity] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [costBasis, setCostBasis] = useState("");
  const [acquiredAt, setAcquiredAt] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setType(initial.type);
      setValue(String(initial.value));
      setCurrency(initial.currency);
      setInstitution(initial.institution ?? "");
      setPillar(initial.pillar ?? "pilon2");
      setQuantity(initial.quantity != null ? String(initial.quantity) : "");
      setInterestRate(initial.interestRate != null ? String(initial.interestRate) : "");
      setCostBasis(initial.costBasis != null ? String(initial.costBasis) : "");
      setAcquiredAt(initial.acquiredAt ?? "");
      setNotes(initial.notes ?? "");
    } else {
      setName("");
      setType("stock");
      setValue("");
      setCurrency("RON");
      setInstitution("");
      setPillar("pilon2");
      setQuantity("");
      setInterestRate("");
      setCostBasis("");
      setAcquiredAt("");
      setNotes("");
    }
    setError(null);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const showQuantity = type === "stock" || type === "bond";
  const showRate = type === "savings" || type === "bond" || type === "loan";
  const showPillar = type === "pension";
  const showCost = !isLiability(type);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const numericValue = toNumber(value);
    if (!name.trim()) {
      setError("Please enter a name.");
      return;
    }
    if (!Number.isFinite(numericValue) || numericValue < 0) {
      setError("Enter a valid amount (0 or more).");
      return;
    }

    const draft: AssetDraft = {
      name: name.trim(),
      type,
      value: numericValue,
      currency,
      institution: institution.trim() || undefined,
      pillar: showPillar ? pillar : undefined,
      quantity: showQuantity && quantity ? toNumber(quantity) : undefined,
      interestRate: showRate && interestRate ? toNumber(interestRate) : undefined,
      costBasis: showCost && costBasis ? toNumber(costBasis) : undefined,
      acquiredAt: showCost && acquiredAt ? acquiredAt : undefined,
      notes: notes.trim() || undefined,
    };

    try {
      setSaving(true);
      setError(null);
      if (initial) await editAsset(initial.id, draft);
      else await addAsset(draft);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this holding.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={initial ? "Edit holding" : "Add holding"}
        className="card relative z-10 max-h-[90vh] w-full max-w-lg animate-fade-in-up overflow-y-auto p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {initial ? "Edit holding" : "Add holding"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {initial?.history && initial.history.length >= 2 && (
            <div className="rounded-lg border border-white/5 bg-ink-850/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">
                  Value history
                </span>
                <span className="text-xs text-slate-500">
                  {initial.history.length} points
                </span>
              </div>
              <Sparkline
                values={initial.history.map((p) => p.value)}
                invert={initial.type === "loan"}
                width={320}
                height={44}
                strokeWidth={2}
                className="h-11 w-full"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500 tabular">
                <span>{formatMoney(initial.history[0].value, initial.currency)}</span>
                <span className="text-slate-300">
                  {formatMoney(
                    initial.history[initial.history.length - 1].value,
                    initial.currency,
                  )}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className={labelClass} htmlFor="asset-name">
              Name
            </label>
            <input
              id="asset-name"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. S&P 500 ETF, Mortgage, Pension Pillar III"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="asset-type">
                Category
              </label>
              <select
                id="asset-type"
                className={inputClass}
                value={type}
                onChange={(e) => setType(e.target.value as AssetType)}
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {ASSET_META[t].label}
                  </option>
                ))}
              </select>
            </div>
            {showPillar ? (
              <div>
                <label className={labelClass} htmlFor="asset-pillar">
                  Pension pillar
                </label>
                <select
                  id="asset-pillar"
                  className={inputClass}
                  value={pillar}
                  onChange={(e) => setPillar(e.target.value as PensionPillar)}
                >
                  <option value="pilon2">{PILLAR_META.pilon2.label}</option>
                  <option value="pilon3">{PILLAR_META.pilon3.label}</option>
                </select>
              </div>
            ) : (
              <div>
                <label className={labelClass} htmlFor="asset-institution">
                  {type === "property" ? "Location" : "Institution"}{" "}
                  <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  id="asset-institution"
                  className={inputClass}
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder={
                    type === "property" ? "City / address" : "Bank / broker / fund"
                  }
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className={labelClass} htmlFor="asset-value">
                {type === "loan"
                  ? "Amount owed"
                  : type === "property"
                    ? "Market value"
                    : "Value"}
              </label>
              <input
                id="asset-value"
                className={inputClass}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                inputMode="decimal"
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="asset-currency">
                Currency
              </label>
              <select
                id="asset-currency"
                className={inputClass}
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {showPillar && (
            <div>
              <label className={labelClass} htmlFor="asset-institution-pension">
                Institution <span className="text-slate-600">(optional)</span>
              </label>
              <input
                id="asset-institution-pension"
                className={inputClass}
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Fund manager (e.g. NN, Allianz)"
              />
            </div>
          )}

          {showCost && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="asset-cost">
                  {type === "property" ? "Purchase price" : "Invested"}{" "}
                  <span className="text-slate-600">({currency}, optional)</span>
                </label>
                <input
                  id="asset-cost"
                  className={inputClass}
                  value={costBasis}
                  onChange={(e) => setCostBasis(e.target.value)}
                  inputMode="decimal"
                  placeholder="Cost basis"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="asset-acquired">
                  Acquired <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  id="asset-acquired"
                  type="date"
                  className={inputClass}
                  value={acquiredAt}
                  onChange={(e) => setAcquiredAt(e.target.value)}
                />
              </div>
            </div>
          )}

          {(showQuantity || showRate) && (
            <div className="grid grid-cols-2 gap-3">
              {showQuantity && (
                <div>
                  <label className={labelClass} htmlFor="asset-quantity">
                    Units / shares <span className="text-slate-600">(optional)</span>
                  </label>
                  <input
                    id="asset-quantity"
                    className={inputClass}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    inputMode="decimal"
                    placeholder="0"
                  />
                </div>
              )}
              {showRate && (
                <div>
                  <label className={labelClass} htmlFor="asset-rate">
                    Interest rate % <span className="text-slate-600">(optional)</span>
                  </label>
                  <input
                    id="asset-rate"
                    className={inputClass}
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    inputMode="decimal"
                    placeholder="0.0"
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className={labelClass} htmlFor="asset-notes">
              Notes <span className="text-slate-600">(optional)</span>
            </label>
            <textarea
              id="asset-notes"
              className={`${inputClass} min-h-[64px] resize-y`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything worth remembering…"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : initial ? "Save changes" : "Add holding"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
