"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { CurrencyProvider } from "@/hooks/useCurrency";
import { CapitalProvider } from "@/hooks/useCapital";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <CapitalProvider>{children}</CapitalProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}
