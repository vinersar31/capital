"use client";

import clsx from "clsx";
import { useCurrency } from "@/hooks/useCurrency";
import { CURRENCIES } from "@/lib/types";

export function CurrencyToggle() {
  const { display, setDisplay } = useCurrency();
  return (
    <div
      className="inline-flex rounded-lg border border-white/10 bg-ink-850 p-0.5"
      role="group"
      aria-label="Display currency"
    >
      {CURRENCIES.map((currency) => (
        <button
          key={currency}
          type="button"
          onClick={() => setDisplay(currency)}
          aria-pressed={display === currency}
          className={clsx(
            "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
            display === currency
              ? "bg-brand-500 text-ink-950"
              : "text-slate-400 hover:text-slate-100",
          )}
        >
          {currency}
        </button>
      ))}
    </div>
  );
}
