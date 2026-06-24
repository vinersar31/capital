import type { Asset, AssetDraft, Snapshot } from "../types";
import type { CapitalRepository } from "./types";

const ASSETS_KEY = "capital.assets.v1";
const SNAPS_KEY = "capital.snapshots.v1";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Browser-only repository backed by localStorage. Seeds sample data on first
 * use so the dashboard is populated even before Firebase is configured.
 */
export class LocalRepository implements CapitalRepository {
  private listeners = new Set<(assets: Asset[]) => void>();

  private readAssets(): Asset[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(ASSETS_KEY);
      return raw ? (JSON.parse(raw) as Asset[]) : [];
    } catch {
      return [];
    }
  }

  private writeAssets(assets: Asset[]): void {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
    }
    this.listeners.forEach((listener) => listener(assets));
  }

  subscribeAssets(onChange: (assets: Asset[]) => void): () => void {
    this.listeners.add(onChange);
    onChange(this.readAssets());

    const handler = (event: StorageEvent) => {
      if (event.key === ASSETS_KEY) onChange(this.readAssets());
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handler);
    }

    return () => {
      this.listeners.delete(onChange);
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handler);
      }
    };
  }

  async createAsset(draft: AssetDraft): Promise<void> {
    const assets = this.readAssets();
    const ts = Date.now();
    assets.push({ ...draft, id: newId(), createdAt: ts, updatedAt: ts });
    this.writeAssets(assets);
  }

  async updateAsset(id: string, patch: Partial<AssetDraft>): Promise<void> {
    const assets = this.readAssets().map((asset) =>
      asset.id === id ? { ...asset, ...patch, updatedAt: Date.now() } : asset,
    );
    this.writeAssets(assets);
  }

  async removeAsset(id: string): Promise<void> {
    this.writeAssets(this.readAssets().filter((asset) => asset.id !== id));
  }

  async listSnapshots(): Promise<Snapshot[]> {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(SNAPS_KEY);
      return raw ? (JSON.parse(raw) as Snapshot[]) : [];
    } catch {
      return [];
    }
  }

  async recordSnapshot(netWorth: number): Promise<void> {
    if (typeof window === "undefined") return;
    const snaps = await this.listSnapshots();
    const date = todayISO();
    const idx = snaps.findIndex((s) => s.date === date);
    if (idx >= 0) snaps[idx] = { date, netWorth };
    else snaps.push({ date, netWorth });
    snaps.sort((a, b) => a.date.localeCompare(b.date));
    window.localStorage.setItem(SNAPS_KEY, JSON.stringify(snaps));
  }
}
