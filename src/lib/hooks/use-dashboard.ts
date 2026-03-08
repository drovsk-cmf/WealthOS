/**
 * WealthOS - Dashboard Hooks (Phase 3)
 *
 * React Query hooks for dashboard RPCs.
 * Stories: DASH-01 to DASH-12, CTB-05
 *
 * All hooks call SECURITY DEFINER RPCs that validate auth.uid().
 * Data is fetched client-side and cached by React Query (staleTime: 2min).
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// ─── Response Types ────────────────────────────────────────────

export interface DashboardSummary {
  total_current_balance: number;
  total_projected_balance: number;
  active_accounts: number;
  month_income: number;
  month_expense: number;
  month_start: string;
  month_end: string;
}

export interface BalanceSheet {
  liquid_assets: number;
  illiquid_assets: number;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
}

export interface SolvencyMetrics {
  tier1_total: number;
  tier2_total: number;
  tier3_total: number;
  tier4_total: number;
  total_patrimony: number;
  burn_rate: number;
  runway_months: number;
  lcr: number;
  months_analyzed: number;
}

export interface CategoryRank {
  category_name: string;
  icon: string | null;
  color: string | null;
  total: number;
  percentage: number;
}

export interface TopCategoriesResult {
  categories: CategoryRank[];
  total_expense: number;
  month: string;
}

export interface BalanceEvolutionPoint {
  month: string;
  balance: number;
  projected: number;
  income: number;
  expense: number;
}

export interface BalanceEvolutionResult {
  data: BalanceEvolutionPoint[];
  source: "snapshots" | "calculated";
  months_requested: number;
}

export interface BudgetItem {
  category_name: string;
  category_icon: string | null;
  category_color: string | null;
  budget_id: string;
  planned: number;
  alert_threshold: number;
  actual: number;
  remaining: number;
  pct_used: number;
  status: "ok" | "warning" | "exceeded";
}

export interface BudgetVsActualResult {
  items: BudgetItem[];
  total_planned: number;
  total_actual: number;
  total_remaining: number;
  pct_used: number;
  month: string;
  budget_count: number;
}

// ─── Shared config ─────────────────────────────────────────────

const STALE_TIME = 2 * 60 * 1000; // 2 minutes

async function getUserId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");
  return { supabase, userId: user.id };
}

// ─── 1. Dashboard Summary (DASH-01, DASH-02) ──────────────────

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    staleTime: STALE_TIME,
    queryFn: async (): Promise<DashboardSummary> => {
      const { supabase, userId } = await getUserId();
      const { data, error } = await supabase.rpc("get_dashboard_summary", {
        p_user_id: userId,
      });
      if (error) throw error;
      return data as unknown as DashboardSummary;
    },
  });
}

// ─── 2. Balance Sheet (CTB-05) ─────────────────────────────────

export function useBalanceSheet() {
  return useQuery({
    queryKey: ["dashboard", "balance-sheet"],
    staleTime: STALE_TIME,
    queryFn: async (): Promise<BalanceSheet> => {
      const { supabase, userId } = await getUserId();
      const { data, error } = await supabase.rpc("get_balance_sheet", {
        p_user_id: userId,
      });
      if (error) throw error;
      return data as unknown as BalanceSheet;
    },
  });
}

// ─── 3. Solvency Metrics (DASH-09 to DASH-12) ─────────────────

export function useSolvencyMetrics() {
  return useQuery({
    queryKey: ["dashboard", "solvency"],
    staleTime: STALE_TIME,
    queryFn: async (): Promise<SolvencyMetrics> => {
      const { supabase, userId } = await getUserId();
      const { data, error } = await supabase.rpc("get_solvency_metrics", {
        p_user_id: userId,
      });
      if (error) throw error;
      return data as unknown as SolvencyMetrics;
    },
  });
}

// ─── 4. Top Categories (DASH-03) ───────────────────────────────

export function useTopCategories(
  year?: number,
  month?: number,
  limit: number = 5
) {
  return useQuery({
    queryKey: ["dashboard", "top-categories", year, month, limit],
    staleTime: STALE_TIME,
    queryFn: async (): Promise<TopCategoriesResult> => {
      const { supabase, userId } = await getUserId();
      const { data, error } = await supabase.rpc("get_top_categories", {
        p_user_id: userId,
        ...(year !== undefined && { p_year: year }),
        ...(month !== undefined && { p_month: month }),
        p_limit: limit,
      });
      if (error) throw error;
      return data as unknown as TopCategoriesResult;
    },
  });
}

// ─── 5. Balance Evolution (DASH-07) ────────────────────────────

export function useBalanceEvolution(months: number = 6) {
  return useQuery({
    queryKey: ["dashboard", "evolution", months],
    staleTime: STALE_TIME,
    queryFn: async (): Promise<BalanceEvolutionResult> => {
      const { supabase, userId } = await getUserId();
      const { data, error } = await supabase.rpc("get_balance_evolution", {
        p_user_id: userId,
        p_months: months,
      });
      if (error) throw error;
      return data as unknown as BalanceEvolutionResult;
    },
  });
}

// ─── 6. Budget vs Actual (DASH-05, ORC-05) ─────────────────────

export function useBudgetVsActual(year?: number, month?: number) {
  return useQuery({
    queryKey: ["dashboard", "budget-vs-actual", year, month],
    staleTime: STALE_TIME,
    queryFn: async (): Promise<BudgetVsActualResult> => {
      const { supabase, userId } = await getUserId();
      const { data, error } = await supabase.rpc("get_budget_vs_actual", {
        p_user_id: userId,
        ...(year !== undefined && { p_year: year }),
        ...(month !== undefined && { p_month: month }),
      });
      if (error) throw error;
      return data as unknown as BudgetVsActualResult;
    },
  });
}
