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

type Budget = Database["public"]["Tables"]["budgets"]["Row"];
type BudgetInsert = Database["public"]["Tables"]["budgets"]["Insert"];
type BudgetUpdate = Database["public"]["Tables"]["budgets"]["Update"];
type AdjustmentIndex = Database["public"]["Enums"]["adjustment_index_type"];

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
  { value: "ipca", label: "IPCA" },
  { value: "igpm", label: "IGP-M" },
  { value: "inpc", label: "INPC" },
  { value: "selic", label: "Selic" },
  { value: "manual", label: "Manual" },
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
      let query = supabase
        .from("budgets")
        .select(
          `
          *,
          categories!inner(name, icon, color, type)
        `
        )
        .eq("month", monthKey)
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
      const { data, error } = await supabase
        .from("budgets")
        .select("*, categories!inner(name, icon, color)")
        .eq("id", id!)
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("month")
        .order("month", { ascending: false });

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      // Check for duplicate (same category + month + member)
      let dupQuery = supabase
        .from("budgets")
        .select("id")
        .eq("user_id", user.id)
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
          user_id: user.id,
          category_id: input.category_id,
          month: input.month,
          planned_amount: input.planned_amount,
          alert_threshold: input.alert_threshold ?? 80,
          coa_id: input.coa_id ?? null,
          cost_center_id: input.cost_center_id ?? null,
          adjustment_index: input.adjustment_index ?? null,
          family_member_id: input.family_member_id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "budget-vs-actual"],
      });
    },
  });
}

/** ORC-03: Update budget amount or threshold */
export function useUpdateBudget() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateBudgetInput) => {
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

      const { data, error } = await supabase
        .from("budgets")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "budget-vs-actual"],
      });
    },
  });
}

/** ORC-04: Remove budget for a category */
export function useDeleteBudget() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({
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
    mutationFn: async ({ source_month, target_month }: CopyBudgetInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      // Check target month has no budgets
      const { data: existingTarget } = await supabase
        .from("budgets")
        .select("id")
        .eq("user_id", user.id)
        .eq("month", target_month)
        .limit(1);

      if (existingTarget && existingTarget.length > 0) {
        throw new Error(
          "O mês de destino já possui orçamentos. Remova-os antes de copiar."
        );
      }

      // Fetch source budgets
      const { data: sourceBudgets, error: fetchError } = await supabase
        .from("budgets")
        .select("category_id, planned_amount, alert_threshold, coa_id, cost_center_id, adjustment_index")
        .eq("user_id", user.id)
        .eq("month", source_month);

      if (fetchError) throw fetchError;
      if (!sourceBudgets || sourceBudgets.length === 0) {
        throw new Error("Nenhum orçamento encontrado no mês de origem.");
      }

      // Insert copies for target month
      const copies: BudgetInsert[] = sourceBudgets.map((b) => ({
        user_id: user.id,
        category_id: b.category_id,
        month: target_month,
        planned_amount: b.planned_amount,
        alert_threshold: b.alert_threshold,
        coa_id: b.coa_id,
        cost_center_id: b.cost_center_id,
        adjustment_index: b.adjustment_index,
      }));

      const { data, error } = await supabase
        .from("budgets")
        .insert(copies)
        .select();

      if (error) throw error;
      return data as Budget[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "budget-vs-actual"],
      });
    },
  });
}
