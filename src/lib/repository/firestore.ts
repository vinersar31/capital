import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import type { Asset, AssetDraft, Snapshot } from "../types";
import type { CapitalRepository } from "./types";

/** Firestore rejects `undefined`; drop those keys before writing. */
function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key as keyof T] = value as T[keyof T];
  }
  return out;
}

/**
 * Cloud repository. Data lives under `users/{uid}/assets` and
 * `users/{uid}/snapshots` so it is isolated per signed-in user.
 */
export class FirestoreRepository implements CapitalRepository {
  constructor(
    private readonly db: Firestore,
    private readonly uid: string,
  ) {}

  private assetsCol() {
    return collection(this.db, "users", this.uid, "assets");
  }

  private snapshotsCol() {
    return collection(this.db, "users", this.uid, "snapshots");
  }

  subscribeAssets(
    onChange: (assets: Asset[]) => void,
    onError?: (error: unknown) => void,
  ): () => void {
    return onSnapshot(
      this.assetsCol(),
      (snap) => {
        const assets = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<Asset, "id">) }),
        );
        onChange(assets);
      },
      (error) => onError?.(error),
    );
  }

  async createAsset(draft: AssetDraft): Promise<void> {
    const ts = Date.now();
    await addDoc(this.assetsCol(), {
      ...clean(draft),
      createdAt: ts,
      updatedAt: ts,
    });
  }

  async updateAsset(id: string, patch: Partial<AssetDraft>): Promise<void> {
    await updateDoc(doc(this.assetsCol(), id), {
      ...clean(patch),
      updatedAt: Date.now(),
    });
  }

  async removeAsset(id: string): Promise<void> {
    await deleteDoc(doc(this.assetsCol(), id));
  }

  async listSnapshots(): Promise<Snapshot[]> {
    const snap = await getDocs(query(this.snapshotsCol(), orderBy("date")));
    return snap.docs.map((d) => d.data() as Snapshot);
  }

  async recordSnapshot(netWorth: number): Promise<void> {
    const date = new Date().toISOString().slice(0, 10);
    await setDoc(doc(this.snapshotsCol(), date), { date, netWorth });
  }
}
