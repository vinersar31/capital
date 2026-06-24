import type { Asset, AssetDraft, Snapshot } from "../types";

/** Storage abstraction shared by the cloud (Firestore) and local backends. */
export interface CapitalRepository {
  /** Subscribe to live asset updates. Returns an unsubscribe function. */
  subscribeAssets(
    onChange: (assets: Asset[]) => void,
    onError?: (error: unknown) => void,
  ): () => void;
  createAsset(draft: AssetDraft): Promise<void>;
  updateAsset(id: string, patch: Partial<AssetDraft>): Promise<void>;
  removeAsset(id: string): Promise<void>;
  listSnapshots(): Promise<Snapshot[]>;
  /** Upsert today's net-worth snapshot (value in base currency). */
  recordSnapshot(netWorth: number): Promise<void>;
}

export type RepositoryMode = "cloud" | "local";
