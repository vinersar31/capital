"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Asset, AssetDraft, Snapshot, ValuePoint } from "@/lib/types";
import {
  createRepository,
  type CapitalRepository,
  type RepositoryMode,
} from "@/lib/repository";
import { computeTotals } from "@/lib/calculations";
import { todayISO } from "@/lib/date";
import { upsertPoint } from "@/lib/history";
import { useAuth } from "./useAuth";
import { useCurrency } from "./useCurrency";

interface CapitalState {
  assets: Asset[];
  snapshots: Snapshot[];
  loading: boolean;
  mode: RepositoryMode;
  error: string | null;
  addAsset: (draft: AssetDraft) => Promise<void>;
  editAsset: (id: string, draft: AssetDraft) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
}

const CapitalContext = createContext<CapitalState | undefined>(undefined);

export function CapitalProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { rates } = useCurrency();
  const uid = user?.uid ?? null;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<RepositoryMode>("local");
  const [error, setError] = useState<string | null>(null);

  const repoRef = useRef<CapitalRepository | null>(null);
  const lastRecorded = useRef<number | null>(null);

  // (Re)create the repository whenever the signed-in user changes.
  useEffect(() => {
    const { repo, mode: nextMode } = createRepository(uid);
    repoRef.current = repo;
    setMode(nextMode);
    setLoading(true);
    setError(null);
    lastRecorded.current = null;

    const unsubscribe = repo.subscribeAssets(
      (next) => {
        setAssets(next);
        setLoading(false);
      },
      (e) => {
        setError(e instanceof Error ? e.message : "Failed to load data");
        setLoading(false);
      },
    );

    repo.listSnapshots().then(setSnapshots).catch(() => undefined);

    return () => unsubscribe();
  }, [uid]);

  const netWorthBase = useMemo(
    () => computeTotals(assets, rates).netWorth,
    [assets, rates],
  );

  // Record today's net-worth snapshot (debounced, upserted by date).
  useEffect(() => {
    if (loading || !Number.isFinite(netWorthBase)) return;
    if (
      lastRecorded.current !== null &&
      Math.abs(lastRecorded.current - netWorthBase) < 1
    ) {
      return;
    }
    const repo = repoRef.current;
    if (!repo) return;

    const timer = setTimeout(() => {
      repo
        .recordSnapshot(netWorthBase)
        .then(() => {
          lastRecorded.current = netWorthBase;
          return repo.listSnapshots();
        })
        .then((next) => next && setSnapshots(next))
        .catch(() => undefined);
    }, 1200);

    return () => clearTimeout(timer);
  }, [netWorthBase, loading]);

  const value = useMemo<CapitalState>(
    () => ({
      assets,
      snapshots,
      loading,
      mode,
      error,
      addAsset: (draft) => {
        const history: ValuePoint[] = [
          { date: todayISO(), value: draft.value },
        ];
        return repoRef.current!.createAsset({ ...draft, history });
      },
      editAsset: (id, draft) => {
        const existing = assets.find((a) => a.id === id);
        const history = upsertPoint(existing?.history ?? [], {
          date: todayISO(),
          value: draft.value,
        });
        return repoRef.current!.updateAsset(id, { ...draft, history });
      },
      deleteAsset: (id) => repoRef.current!.removeAsset(id),
    }),
    [assets, snapshots, loading, mode, error],
  );

  return (
    <CapitalContext.Provider value={value}>{children}</CapitalContext.Provider>
  );
}

export function useCapital(): CapitalState {
  const ctx = useContext(CapitalContext);
  if (!ctx) throw new Error("useCapital must be used within a CapitalProvider");
  return ctx;
}
