"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden width="16" height="16">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.67-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.67 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

export function AuthButton() {
  const { user, configured, loading, signIn, signOutUser } = useAuth();

  if (!configured) {
    return (
      <span className="rounded-lg border border-white/10 bg-ink-850 px-3 py-1.5 text-xs font-medium text-slate-400">
        Local mode
      </span>
    );
  }

  if (loading) {
    return <div className="h-9 w-28 animate-pulse rounded-lg bg-white/5" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoURL}
            alt={user.displayName ?? "User"}
            className="h-8 w-8 rounded-full border border-white/10"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/20 text-sm font-semibold text-brand-300">
            {(user.displayName ?? user.email ?? "U").charAt(0).toUpperCase()}
          </div>
        )}
        <button
          type="button"
          onClick={signOutUser}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-ink-850 px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-ink-800 hover:text-white"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={signIn}
      className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
    >
      <GoogleIcon />
      <span>Sign in</span>
    </button>
  );
}
