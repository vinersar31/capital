"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Currency } from "@/lib/types";
import {
  BASE_CURRENCY,
  DEFAULT_RATES_TO_BASE,
  convert,
  fetchRatesToBase,
  type RatesToBase,
} from "@/lib/currency";

const DISPLAY_KEY = "capital.displayCurrency.v1";

interface CurrencyState {
  display: Currency;
  setDisplay: (currency: Currency) => void;
  rates: RatesToBase;
  ratesLive: boolean;
  /** Where the live rate came from (e.g. "BNR", "ECB"). */
  rateSource: string;
  /** EUR→RON rate currently in effect. */
  eurRate: number;
  /** Convert an amount from `from` into the active display currency. */
  toDisplay: (amount: number, from: Currency) => number;
  /** Convert an amount from `from` into base currency (RON). */
  toBaseCurrency: (amount: number, from: Currency) => number;
  /** Convert a base-currency (RON) amount into the display currency. */
  baseToDisplay: (amount: number) => number;
}

const CurrencyContext = createContext<CurrencyState | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [display, setDisplayState] = useState<Currency>(BASE_CURRENCY);
  const [rates, setRates] = useState<RatesToBase>(DEFAULT_RATES_TO_BASE);
  const [ratesLive, setRatesLive] = useState(false);
  const [rateSource, setRateSource] = useState("…");

  // Restore the saved display currency once on mount (client only).
  useEffect(() => {
    const saved = window.localStorage.getItem(DISPLAY_KEY);
    if (saved === "RON" || saved === "EUR") setDisplayState(saved);
  }, []);

  // Fetch live FX rates (BNR → ECB → offline fallback).
  useEffect(() => {
    let active = true;
    fetchRatesToBase().then(({ rates: next, source }) => {
      if (!active) return;
      setRates(next);
      setRateSource(source);
      setRatesLive(source !== "fallback");
    });
    return () => {
      active = false;
    };
  }, []);

  const setDisplay = useCallback((currency: Currency) => {
    setDisplayState(currency);
    window.localStorage.setItem(DISPLAY_KEY, currency);
  }, []);

  const toDisplay = useCallback(
    (amount: number, from: Currency) => convert(amount, from, display, rates),
    [display, rates],
  );

  const toBaseCurrency = useCallback(
    (amount: number, from: Currency) => convert(amount, from, BASE_CURRENCY, rates),
    [rates],
  );

  const baseToDisplay = useCallback(
    (amount: number) => convert(amount, BASE_CURRENCY, display, rates),
    [display, rates],
  );

  const value = useMemo<CurrencyState>(
    () => ({
      display,
      setDisplay,
      rates,
      ratesLive,
      rateSource,
      eurRate: rates.EUR,
      toDisplay,
      toBaseCurrency,
      baseToDisplay,
    }),
    [display, setDisplay, rates, ratesLive, rateSource, toDisplay, toBaseCurrency, baseToDisplay],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyState {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within a CurrencyProvider");
  return ctx;
}
