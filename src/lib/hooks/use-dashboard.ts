/**
 * Oniefy - Dashboard Hooks (Phase 3)
 *
 * React Query hooks for dashboard RPCs.
 * Stories: DASH-01 to DASH-12, CTB-05
 *
 * All hooks call SECURITY DEFINER RPCs that validate auth.uid().
 * Data is fetched client-side and cached by React Query (staleTime: 2min).
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getCachedUserId } from "@/lib/supabase/cached-auth";
import {
  balanceSheetSchema,
  balanceEvolutionResultSchema,
  budgetVsActualResultSchema,
  dashboardSummarySchema,
  logSchemaError,
  solvencyMetricsSchema,
  topCategoriesResultSchema,
} from "@/lib/schemas/rpc";

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
  family_member_id: string | null;
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
  const userId = await getCachedUserId(supabase);
  return { supabase, userId };
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
      const parsed = dashboardSummarySchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_dashboard_summary", parsed);
        return {
          total_current_balance: 0,
          total_projected_balance: 0,
          active_accounts: 0,
          month_income: 0,
          month_expense: 0,
          month_start: "",
          month_end: "",
        };
      }
      return parsed.data;
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
      const parsed = balanceSheetSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_balance_sheet", parsed);
        return {
          liquid_assets: 0,
          illiquid_assets: 0,
          total_assets: 0,
          total_liabilities: 0,
          net_worth: 0,
        };
      }
      return parsed.data;
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
      const parsed = solvencyMetricsSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_solvency_metrics", parsed);
        return {
          tier1_total: 0,
          tier2_total: 0,
          tier3_total: 0,
          tier4_total: 0,
          total_patrimony: 0,
          burn_rate: 0,
          runway_months: 0,
          lcr: 0,
          months_analyzed: 0,
        };
      }
      return parsed.data;
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
      const parsed = topCategoriesResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_top_categories", parsed);
        return { categories: [], total_expense: 0, month: "" };
      }
      return parsed.data;
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
      const parsed = balanceEvolutionResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_balance_evolution", parsed);
        return { data: [], source: "calculated" as const, months_requested: months };
      }
      return parsed.data;
    },
  });
}

// ─── 6. Budget vs Actual (DASH-05, ORC-05) ─────────────────────

export function useBudgetVsActual(year?: number, month?: number, familyMemberId?: string | null) {
  return useQuery({
    queryKey: ["dashboard", "budget-vs-actual", year, month, familyMemberId],
    staleTime: STALE_TIME,
    queryFn: async (): Promise<BudgetVsActualResult> => {
      const { supabase, userId } = await getUserId();
      const { data, error } = await supabase.rpc("get_budget_vs_actual", {
        p_user_id: userId,
        ...(year !== undefined && { p_year: year }),
        ...(month !== undefined && { p_month: month }),
        ...(familyMemberId && { p_family_member_id: familyMemberId }),
      });
      if (error) throw error;
      const parsed = budgetVsActualResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_budget_vs_actual", parsed);
        return { items: [], total_planned: 0, total_actual: 0, total_remaining: 0, pct_used: 0, month: "", budget_count: 0 };
      }
      return parsed.data;
    },
  });
}

// ─── Monthly Snapshots (for sparklines in SolvencyPanel) ─────────

export interface MonthlySnapshot {
  month: string;
  lcr: number | null;
  runway_months: number | null;
  burn_rate: number | null;
  total_balance: number;
  total_assets: number;
  tier1_total: number | null;
  tier2_total: number | null;
  tier3_total: number | null;
  tier4_total: number | null;
}

/** Fetch last N monthly snapshots for trend sparklines */
export function useMonthlySnapshots(months: number = 12) {
  return useQuery({
    queryKey: ["monthly_snapshots", months],
    staleTime: 10 * 60 * 1000, // 10 min
    queryFn: async (): Promise<MonthlySnapshot[]> => {
      const { supabase, userId } = await getUserId();
      const { data, error } = await supabase
        .from("monthly_snapshots")
        .select("month, lcr, runway_months, burn_rate, total_balance, total_assets, tier1_total, tier2_total, tier3_total, tier4_total")
        .eq("user_id", userId)
        .order("month", { ascending: true })
        .limit(months);

      if (error) throw error;
      return (data ?? []) as MonthlySnapshot[];
    },
  });
}

// ─── ALL-IN-ONE (single roundtrip) ────────────────────────────

export interface DashboardAllData {
  summary: DashboardSummary;
  balanceSheet: BalanceSheet;
  solvency: SolvencyMetrics;
  topCategories: TopCategoriesResult;
  evolution: BalanceEvolutionResult;
  budget: BudgetVsActualResult;
  attention: {
    uncategorized: number;
    overdue: number;
    dueSoon: number;
    recentImportCount: number;
    lastTransactionDaysAgo: number | undefined;
  };
}

/**
 * Single RPC that returns all dashboard data in one roundtrip.
 * Replaces 7+ parallel HTTP calls to Supabase.
 */
export function useDashboardAll() {
  return useQuery({
    queryKey: ["dashboard", "all"],
    staleTime: STALE_TIME,
    queryFn: async (): Promise<DashboardAllData> => {
      const { supabase, userId } = await getUserId();
      const { data, error } = await supabase.rpc("get_dashboard_all", {
        p_user_id: userId,
      });
      if (error) throw error;

      // Loose validation (budget items have flexible shape)
      const raw = data as Record<string, unknown>;

      const summary = dashboardSummarySchema.safeParse(raw.summary);
      const balanceSheet = balanceSheetSchema.safeParse(raw.balance_sheet);
      const solvency = solvencyMetricsSchema.safeParse(raw.solvency);
      const topCategories = topCategoriesResultSchema.safeParse(raw.top_categories);
      const evolution = balanceEvolutionResultSchema.safeParse(raw.evolution);

      if (!summary.success) logSchemaError("dashboard_all.summary", summary);
      if (!balanceSheet.success) logSchemaError("dashboard_all.balance_sheet", balanceSheet);
      if (!solvency.success) logSchemaError("dashboard_all.solvency", solvency);
      if (!topCategories.success) logSchemaError("dashboard_all.top_categories", topCategories);
      if (!evolution.success) logSchemaError("dashboard_all.evolution", evolution);

      const budget = raw.budget as BudgetVsActualResult;
      const attention = raw.attention as DashboardAllData["attention"];

      return {
        summary: summary.success ? summary.data : { total_current_balance: 0, total_projected_balance: 0, active_accounts: 0, month_income: 0, month_expense: 0, month_start: "", month_end: "" },
        balanceSheet: balanceSheet.success ? balanceSheet.data : { liquid_assets: 0, illiquid_assets: 0, total_assets: 0, total_liabilities: 0, net_worth: 0 },
        solvency: solvency.success ? solvency.data : { tier1_total: 0, tier2_total: 0, tier3_total: 0, tier4_total: 0, total_patrimony: 0, burn_rate: 0, runway_months: 0, lcr: 0, months_analyzed: 0 },
        topCategories: topCategories.success ? topCategories.data : { categories: [], total_expense: 0, month: "" },
        evolution: evolution.success ? evolution.data : { data: [], source: "calculated" as const, months_requested: 6 },
        budget: budget ?? { items: [], total_planned: 0, total_actual: 0, total_remaining: 0, pct_used: 0, month: "", budget_count: 0 },
        attention: attention ?? { uncategorized: 0, overdue: 0, dueSoon: 0, recentImportCount: 0, lastTransactionDaysAgo: undefined },
      };
    },
  });
}
