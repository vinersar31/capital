"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebase, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

interface AuthState {
  user: User | null;
  loading: boolean;
  /** Whether Firebase is configured at all. */
  configured: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const firebase = getFirebase();
    if (!firebase) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(firebase.auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const firebase = getFirebase();
    if (!firebase) return;
    try {
      setError(null);
      await signInWithPopup(firebase.auth, googleProvider);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    }
  };

  const signOutUser = async () => {
    const firebase = getFirebase();
    if (!firebase) return;
    await signOut(firebase.auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        configured: isFirebaseConfigured,
        error,
        signIn,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
