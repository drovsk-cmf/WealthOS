/**
 * Oniefy - Budget Hooks (Phase 3)
 *
 * React Query hooks for budget CRUD operations.
 * Stories: ORC-01 (criar), ORC-02 (copiar mês anterior),
 *          ORC-03 (editar), ORC-04 (remover), ORC-06 (alertas)
 *
 * Budget month is stored as first-of-month DATE (e.g. '2026-03-01').
 * Each budget row = 1 category × 1 month × 1 user.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { budgetWithCategorySchema, logSchemaError } from "@/lib/schemas/rpc";
import { z } from "zod";
import type { Database } from "@/types/database";
import { getCachedUserId } from "@/lib/supabase/cached-auth";
import { tryAdvanceStep } from "@/lib/hooks/use-setup-journey";

type Budget = Database["public"]["Tables"]["budgets"]["Row"];
type BudgetInsert = Database["public"]["Tables"]["budgets"]["Insert"];
type BudgetUpdate = Database["public"]["Tables"]["budgets"]["Update"];
type AdjustmentIndex = Database["public"]["Enums"]["adjustment_index_type"];
type ApprovalStatus = Database["public"]["Enums"]["budget_approval_status"];

// ─── Input types ────────────────────────────────────────────────

export interface CreateBudgetInput {
  category_id: string;
  month: string; // ISO date YYYY-MM-DD (first of month)
  planned_amount: number;
  alert_threshold?: number; // default 80
  coa_id?: string | null;
  cost_center_id?: string | null;
  adjustment_index?: AdjustmentIndex | null;
  family_member_id?: string | null;
  approval_status?: ApprovalStatus; // default 'approved'
}

export interface UpdateBudgetInput {
  id: string;
  planned_amount?: number;
  alert_threshold?: number;
  coa_id?: string | null;
  cost_center_id?: string | null;
  adjustment_index?: AdjustmentIndex | null;
  family_member_id?: string | null;
}

export interface CopyBudgetInput {
  source_month: string; // ISO date YYYY-MM-DD
  target_month: string; // ISO date YYYY-MM-DD
  family_member_id?: string | null;
}

// ─── Labels ─────────────────────────────────────────────────────

export const ADJUSTMENT_INDEX_LABELS: Record<AdjustmentIndex, string> = {
  ipca: "IPCA",
  igpm: "IGP-M",
  inpc: "INPC",
  selic: "Selic",
  manual: "Manual",
  none: "Sem reajuste",
};

export const ADJUSTMENT_INDEX_OPTIONS: {
  value: AdjustmentIndex;
  label: string;
}[] = [
  { value: "none", label: "Sem reajuste" },
  { value: "manual", label: "Manual" },
  { value: "ipca", label: "IPCA (automático)" },
  { value: "igpm", label: "IGP-M (automático)" },
  { value: "inpc", label: "INPC (automático)" },
  { value: "selic", label: "Selic (automático)" },
];

// ─── Helpers ────────────────────────────────────────────────────

/** Returns first-of-month date string for a given Date or the current month */
export function toMonthKey(date?: Date): string {
  const d = date ?? new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Formats month key to display label (e.g. "Mar 2026") */
export function formatMonthLabel(monthKey: string): string {
  const d = new Date(monthKey + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

// ─── Queries ────────────────────────────────────────────────────

/** Fetch budgets for a given month, optionally filtered by family member */
export function useBudgets(month?: string, familyMemberId?: string | null) {
  const supabase = createClient();
  const monthKey = month ?? toMonthKey();

  return useQuery({
    queryKey: ["budgets", monthKey, familyMemberId],
    queryFn: async () => {
      const userId = await getCachedUserId(supabase);
      let query = supabase
        .from("budgets")
        .select(
          `
          *,
          categories!inner(name, icon, color, type)
        `
        )
        .eq("user_id", userId)
        .eq("month", monthKey)
        .neq("approval_status", "rejected")
        .order("planned_amount", { ascending: false });

      if (familyMemberId) {
        query = query.eq("family_member_id", familyMemberId);
      } else {
        query = query.is("family_member_id", null);
      }

      const { data, error } = await query;

      if (error) throw error;
      const parsed = z.array(budgetWithCategorySchema).safeParse(data);
      if (!parsed.success) {
        logSchemaError("budgets_with_categories", parsed);
        return [];
      }
      return parsed.data;
    },
  });
}

/** Fetch single budget by ID */
export function useBudget(id: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["budgets", "detail", id],
    enabled: !!id,
    queryFn: async () => {
      const userId = await getCachedUserId(supabase);
      const { data, error } = await supabase
        .from("budgets")
        .select("*, categories!inner(name, icon, color)")
        .eq("id", id!)
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      return data;
    },
  });
}

/** Check which months have budgets (for navigation) */
export function useBudgetMonths() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["budgets", "months"],
    staleTime: 10 * 60 * 1000, // 10 min
    queryFn: async () => {
      const userId = await getCachedUserId(supabase);
      // DT-019: Supabase PostgREST doesn't support DISTINCT.
      // Fetch only month column (minimal payload), dedup client-side.
      // Limit 500 covers ~40 categories × 12 months before dedup.
      const { data, error } = await supabase
        .from("budgets")
        .select("month")
        .eq("user_id", userId)
        .order("month", { ascending: false })
        .limit(500);

      if (error) throw error;

      // Deduplicate months
      const uniqueMonths = Array.from(new Set(data.map((b) => b.month)));
      return uniqueMonths;
    },
  });
}

// ─── Mutations ──────────────────────────────────────────────────

/** ORC-01: Create budget for a category in a month */
export function useCreateBudget() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBudgetInput) => {
      const userId = await getCachedUserId(supabase);
      // Check for duplicate (same category + month + member)
      let dupQuery = supabase
        .from("budgets")
        .select("id")
        .eq("user_id", userId)
        .eq("category_id", input.category_id)
        .eq("month", input.month);

      if (input.family_member_id) {
        dupQuery = dupQuery.eq("family_member_id", input.family_member_id);
      } else {
        dupQuery = dupQuery.is("family_member_id", null);
      }

      const { data: existing } = await dupQuery.maybeSingle();

      if (existing) {
        throw new Error("Já existe orçamento para esta categoria neste mês.");
      }

      const { data, error } = await supabase
        .from("budgets")
        .insert({
          user_id: userId,
          category_id: input.category_id,
          month: input.month,
          planned_amount: input.planned_amount,
          alert_threshold: input.alert_threshold ?? 80,
          coa_id: input.coa_id ?? null,
          cost_center_id: input.cost_center_id ?? null,
          adjustment_index: input.adjustment_index ?? null,
          family_member_id: input.family_member_id ?? null,
          approval_status: input.approval_status ?? "approved",
          proposed_at: input.approval_status === "proposed" ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Budget;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["budgets"] });
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "budget-vs-actual"],
      });
      tryAdvanceStep("create_budget", queryClient);
    },
  });
}

/** ORC-03: Update budget amount or threshold */
export function useUpdateBudget() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateBudgetInput) => {
      const userId = await getCachedUserId(supabase);
      const payload: BudgetUpdate = {};
      if (updates.planned_amount !== undefined)
        payload.planned_amount = updates.planned_amount;
      if (updates.alert_threshold !== undefined)
        payload.alert_threshold = updates.alert_threshold;
      if (updates.coa_id !== undefined) payload.coa_id = updates.coa_id;
      if (updates.cost_center_id !== undefined)
        payload.cost_center_id = updates.cost_center_id;
      if (updates.adjustment_index !== undefined)
        payload.adjustment_index = updates.adjustment_index;
      if (updates.family_member_id !== undefined)
        payload.family_member_id = updates.family_member_id;

      const { data, error } = await supabase
        .from("budgets")
        .update(payload)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return data as Budget;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["budgets"] });
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "budget-vs-actual"],
      });
    },
  });
}

/** Approve a proposed budget (titular action) */
export function useApproveBudget() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const userId = await getCachedUserId(supabase);
      const { data, error } = await supabase
        .from("budgets")
        .update({
          approval_status: "approved",
          decided_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId)
        .eq("approval_status", "proposed")
        .select()
        .single();

      if (error) throw error;
      return data as Budget;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["budgets"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "budget-vs-actual"] });
    },
  });
}

/** Reject a proposed budget (titular action) */
export function useRejectBudget() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const userId = await getCachedUserId(supabase);
      const { data, error } = await supabase
        .from("budgets")
        .update({
          approval_status: "rejected",
          decided_at: new Date().toISOString(),
          decision_notes: notes ?? null,
        })
        .eq("id", id)
        .eq("user_id", userId)
        .eq("approval_status", "proposed")
        .select()
        .single();

      if (error) throw error;
      return data as Budget;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["budgets"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "budget-vs-actual"] });
    },
  });
}

/** ORC-04: Remove budget for a category */
export function useDeleteBudget() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const userId = await getCachedUserId(supabase);
      const { error } = await supabase.from("budgets").delete().eq("id", id).eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["budgets"] });
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "budget-vs-actual"],
      });
    },
  });
}

/** ORC-02: Copy all budgets from one month to another */
export function useCopyBudgets() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ source_month, target_month, family_member_id }: CopyBudgetInput) => {
      const userId = await getCachedUserId(supabase);
      // Check target month has no budgets for this member scope
      let existingQuery = supabase
        .from("budgets")
        .select("id")
        .eq("user_id", userId)
        .eq("month", target_month)
        .limit(1);

      if (family_member_id) {
        existingQuery = existingQuery.eq("family_member_id", family_member_id);
      } else {
        existingQuery = existingQuery.is("family_member_id", null);
      }

      const { data: existingTarget } = await existingQuery;

      if (existingTarget && existingTarget.length > 0) {
        throw new Error(
          "O mês de destino já possui orçamentos. Remova-os antes de copiar."
        );
      }

      // Fetch source budgets for this member scope
      let sourceQuery = supabase
        .from("budgets")
        .select("category_id, planned_amount, alert_threshold, coa_id, cost_center_id, adjustment_index, family_member_id")
        .eq("user_id", userId)
        .eq("month", source_month);

      if (family_member_id) {
        sourceQuery = sourceQuery.eq("family_member_id", family_member_id);
      } else {
        sourceQuery = sourceQuery.is("family_member_id", null);
      }

      const { data: sourceBudgets, error: fetchError } = await sourceQuery;

      if (fetchError) throw fetchError;
      if (!sourceBudgets || sourceBudgets.length === 0) {
        throw new Error("Nenhum orçamento encontrado no mês de origem.");
      }

      // Insert copies for target month, preserving family_member_id
      const copies: BudgetInsert[] = sourceBudgets.map((b) => ({
        user_id: userId,
        category_id: b.category_id,
        month: target_month,
        planned_amount: b.planned_amount,
        alert_threshold: b.alert_threshold,
        coa_id: b.coa_id,
        cost_center_id: b.cost_center_id,
        adjustment_index: b.adjustment_index,
        family_member_id: b.family_member_id,
      }));

      const { data, error } = await supabase
        .from("budgets")
        .insert(copies)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["budgets"] });
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "budget-vs-actual"],
      });
    },
  });
}
