"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { exponentialBackoff } from "@/lib/utils/retry";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,  // 5 minutes (longer for offline)
            gcTime: 30 * 60 * 1000,     // 30 minutes cache retention
            retry: 2,                    // Up to 2 retries (3 total attempts)
            retryDelay: exponentialBackoff, // Exponential backoff + jitter (D11)
            networkMode: "offlineFirst", // Use cache when offline, fetch when online
          },
          mutations: {
            retry: 1,                    // 1 retry for mutations (conservative)
            retryDelay: exponentialBackoff,
            networkMode: "offlineFirst", // Queue mutations when offline
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
