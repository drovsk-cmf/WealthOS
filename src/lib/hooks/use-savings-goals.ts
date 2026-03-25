/**
 * Oniefy - Savings Goals Hooks (E6)
 *
 * React Query hooks for savings_goals CRUD.
 * Computed fields: progress %, monthly savings needed, months remaining.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getCachedUserId } from "@/lib/supabase/cached-auth";
import type { Database } from "@/types/database";

type SavingsGoal = Database["public"]["Tables"]["savings_goals"]["Row"];

export interface SavingsGoalWithProgress extends SavingsGoal {
  progress_pct: number;
  remaining_amount: number;
  monthly_savings_needed: number | null; // null if no target_date
  months_remaining: number | null;
}

function enrichGoal(goal: SavingsGoal): SavingsGoalWithProgress {
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const progress = goal.target_amount > 0
    ? Math.min(100, (goal.current_amount / goal.target_amount) * 100)
    : 0;

  let monthsRemaining: number | null = null;
  let monthlySavings: number | null = null;

  if (goal.target_date) {
    const now = new Date();
    const target = new Date(goal.target_date + "T12:00:00");
    const diffMs = target.getTime() - now.getTime();
    monthsRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30.44)));
    monthlySavings = monthsRemaining > 0 ? remaining / monthsRemaining : remaining;
  }

  return {
    ...goal,
    progress_pct: progress,
    remaining_amount: remaining,
    monthly_savings_needed: monthlySavings,
    months_remaining: monthsRemaining,
  };
}

async function getUserId() {
  const supabase = createClient();
  const userId = await getCachedUserId(supabase);
  return { supabase, userId };
}

// ─── List ───────────────────────────────────────────────────────

export function useSavingsGoals() {
  return useQuery({
    queryKey: ["savings_goals"],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<SavingsGoalWithProgress[]> => {
      const { supabase, userId } = await getUserId();
      const { data, error } = await supabase
        .from("savings_goals")
        .select("*")
        .eq("user_id", userId)
        .order("is_completed", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(enrichGoal);
    },
  });
}

// ─── Create ─────────────────────────────────────────────────────

export interface CreateGoalInput {
  name: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string | null;
  icon?: string;
  color?: string;
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      const { supabase, userId } = await getUserId();
      const { data, error } = await supabase
        .from("savings_goals")
        .insert({
          user_id: userId,
          name: input.name,
          target_amount: input.target_amount,
          current_amount: input.current_amount ?? 0,
          target_date: input.target_date ?? null,
          icon: input.icon ?? "target",
          color: input.color ?? "#56688F",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savings_goals"] });
    },
  });
}

// ─── Update ─────────────────────────────────────────────────────

export interface UpdateGoalInput {
  id: string;
  name?: string;
  target_amount?: number;
  current_amount?: number;
  target_date?: string | null;
  icon?: string;
  color?: string;
  is_completed?: boolean;
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateGoalInput) => {
      const { supabase } = await getUserId();
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("savings_goals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savings_goals"] });
    },
  });
}

// ─── Delete ─────────────────────────────────────────────────────

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { supabase } = await getUserId();
      const { error } = await supabase
        .from("savings_goals")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savings_goals"] });
    },
  });
}
