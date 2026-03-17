/**
 * useAutoCategory - UX-H2-01
 *
 * Debounced auto-categorization based on transaction description.
 * Calls auto_categorize_transaction RPC which matches against
 * user's historical categorization patterns.
 *
 * Returns a suggested category_id (or null) after 400ms debounce.
 * Fire-and-forget: never blocks the form.
 */

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { autoCategorizeTransactionSchema } from "@/lib/schemas/rpc";
import { getCachedUserId } from "@/lib/supabase/cached-auth";

interface AutoCategoryResult {
  suggestedCategoryId: string | null;
  isLoading: boolean;
}

export function useAutoCategory(
  description: string,
  enabled: boolean = true
): AutoCategoryResult {
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Reset if disabled or description too short
    const trimmed = description.trim();
    if (!enabled || trimmed.length < 3) {
      setSuggestedCategoryId(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      // Cancel previous in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const supabase = createClient();
        const userId = await getCachedUserId(supabase);
        if (!userId || controller.signal.aborted) return;

        const { data, error } = await supabase.rpc(
          "auto_categorize_transaction",
          {
            p_description: trimmed,
            p_user_id: userId,
          }
        );

        if (controller.signal.aborted) return;

        if (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[AutoCategory]", error.message);
          }
          setSuggestedCategoryId(null);
          setIsLoading(false);
          return;
        }

        const parsed = autoCategorizeTransactionSchema.safeParse(data);
        setSuggestedCategoryId(parsed.success ? parsed.data : null);
      } catch {
        // Silent fail
        setSuggestedCategoryId(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [description, enabled]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  return { suggestedCategoryId, isLoading };
}
