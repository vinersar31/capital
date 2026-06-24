import { getFirebase } from "../firebase";
import { FirestoreRepository } from "./firestore";
import { LocalRepository } from "./local";
import type { CapitalRepository, RepositoryMode } from "./types";

export type { CapitalRepository, RepositoryMode } from "./types";

/**
 * Pick the right backend: Firestore when Firebase is configured AND a user is
 * signed in, otherwise the local (browser) repository.
 */
export function createRepository(uid: string | null): {
  repo: CapitalRepository;
  mode: RepositoryMode;
} {
  const firebase = getFirebase();
  if (firebase && uid) {
    return { repo: new FirestoreRepository(firebase.db, uid), mode: "cloud" };
  }
  return { repo: new LocalRepository(), mode: "local" };
}
