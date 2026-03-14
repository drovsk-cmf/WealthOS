"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,  // 5 minutes (longer for offline)
            gcTime: 30 * 60 * 1000,     // 30 minutes cache retention
            retry: 1,
            networkMode: "offlineFirst", // Use cache when offline, fetch when online
          },
          mutations: {
            networkMode: "offlineFirst", // Queue mutations when offline
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
