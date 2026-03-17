"use client";

/**
 * Cached auth.getUser() for hooks
 *
 * Problem: 80 hooks call auth.getUser() individually. On the Dashboard page,
 * 10+ hooks mount simultaneously, each making a separate roundtrip (~150ms each).
 * Total: ~1.5 seconds of redundant auth validation.
 *
 * Solution: Module-level cache with promise deduplication.
 * - First caller in a render cycle makes the real request
 * - Concurrent callers share the same in-flight promise
 * - Cached result is reused for 30 seconds
 * - Cache is cleared on logout via clearAuthCache()
 */

import type { SupabaseClient } from "@supabase/supabase-js";

let cachedPromise: Promise<string> | null = null;
let cachedUserId: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000; // 30 seconds

/**
 * Returns the authenticated user's ID.
 * Deduplicates concurrent calls and caches for 30s.
 * @throws Error("Sessão expirada.") if not authenticated
 */
export async function getCachedUserId(
  supabase: SupabaseClient
): Promise<string> {
  const now = Date.now();

  // Return cached value if fresh
  if (cachedUserId && now - cacheTimestamp < CACHE_TTL) {
    return cachedUserId;
  }

  // Deduplicate: if a request is already in flight, wait for it
  if (cachedPromise) return cachedPromise;

  // Make the real request (only one in-flight at a time)
  cachedPromise = (async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");
      cachedUserId = user.id;
      cacheTimestamp = Date.now();
      return user.id;
    } finally {
      cachedPromise = null;
    }
  })();

  return cachedPromise;
}

/** Clear cache on logout or session expiry */
export function clearAuthCache(): void {
  cachedUserId = null;
  cachedPromise = null;
  cacheTimestamp = 0;
}
