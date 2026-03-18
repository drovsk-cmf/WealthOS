"use client";

import { useQuery, useMutation, useQueryClient, QueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getCachedUserId } from "@/lib/supabase/cached-auth";
import type { Json } from "@/types/database";

export interface SetupStep {
  step_key: string;
  step_order: number;
  title: string;
  description: string;
  status: "locked" | "available" | "in_progress" | "completed";
  completed_at: string | null;
  metadata: Record<string, unknown>;
}

export interface SetupJourneyData {
  steps: SetupStep[];
  total: number;
  completed: number;
  current_step: string | null;
  all_done: boolean;
  cutoff_date: string | null;
}

/**
 * Fetch setup journey progress. Auto-initializes on first call.
 */
export function useSetupJourney() {
  const supabase = createClient();

  return useQuery<SetupJourneyData>({
    queryKey: ["setup_journey"],
    queryFn: async () => {
      const userId = await getCachedUserId(supabase);
      const { data, error } = await supabase.rpc("get_setup_journey", {
        p_user_id: userId,
      });
      if (error) throw error;
      return data as unknown as SetupJourneyData;
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

/**
 * Advance a setup journey step (mark as completed, unlock next).
 */
export function useAdvanceStep() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      stepKey,
      metadata,
    }: {
      stepKey: string;
      metadata?: Record<string, unknown>;
    }) => {
      const userId = await getCachedUserId(supabase);
      const { data, error } = await supabase.rpc("advance_setup_journey", {
        p_user_id: userId,
        p_step_key: stepKey,
        p_metadata: (metadata ?? {}) as unknown as Json,
      });
      if (error) throw error;
      return data as unknown as {
        completed_step: string;
        total_steps: number;
        completed_count: number;
        next_step: string | null;
        all_done: boolean;
      };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["setup_journey"] });
    },
  });
}

/**
 * Set the cutoff date (step 1 action).
 */
export function useSetCutoffDate() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cutoffDate: string) => {
      const userId = await getCachedUserId(supabase);
      const { error } = await supabase
        .from("users_profile")
        .update({ cutoff_date: cutoffDate })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["setup_journey"] });
      await queryClient.invalidateQueries({ queryKey: ["user_profile"] });
    },
  });
}

// Step key → route mapping for navigation
export const STEP_ROUTES: Record<string, string> = {
  cutoff_date: "/settings",
  create_accounts: "/accounts",
  recurring_expenses: "/bills",
  import_statements: "/connections",
  import_card_bills: "/connections",
  categorize: "/transactions",
  create_budget: "/budgets",
};

/**
 * Fire-and-forget: advance a setup journey step if it's available.
 * Safe to call from any hook's onSuccess - never throws, never blocks.
 * Returns true if the step was advanced, false otherwise.
 */
export async function tryAdvanceStep(
  stepKey: string,
  queryClient?: QueryClient,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  try {
    const supabase = createClient();
    const userId = await getCachedUserId(supabase);
    const { data, error } = await supabase.rpc("advance_setup_journey", {
      p_user_id: userId,
      p_step_key: stepKey,
      p_metadata: (metadata ?? {}) as unknown as Json,
    });
    if (error || !data) return false;
    const result = data as unknown as { completed_step?: string };
    if (result.completed_step && queryClient) {
      queryClient.invalidateQueries({ queryKey: ["setup_journey"] });
    }
    return !!result.completed_step;
  } catch {
    return false; // never block the main action
  }
}
