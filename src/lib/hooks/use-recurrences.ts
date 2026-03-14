/**
 * Oniefy - Recurrences Hooks (Phase 4)
 *
 * React Query hooks for recurrence (Contas a Pagar) operations.
 * Stories: CAP-01 (criar), CAP-02 (editar), CAP-03 (encerrar),
 *          CAP-04 (listar pendentes), CAP-05 (pagar/gerar próxima),
 *          CAP-06 (alertas de vencimento)
 *
 * Recurrences use template_transaction (JSONB) to store the
 * transaction blueprint. Each cycle generates a pending transaction.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Recurrence = Database["public"]["Tables"]["recurrences"]["Row"];
type RecurrenceInsert = Database["public"]["Tables"]["recurrences"]["Insert"];
type Frequency = Database["public"]["Enums"]["recurrence_frequency"];
type AdjustmentIndex = Database["public"]["Enums"]["adjustment_index_type"];

// ─── Input types ────────────────────────────────────────────────

export interface CreateRecurrenceInput {
  frequency: Frequency;
  interval_count?: number;
  start_date: string; // ISO YYYY-MM-DD
  end_date?: string | null;
  adjustment_index?: AdjustmentIndex | null;
  adjustment_rate?: number | null;
  coa_id?: string | null;
  cost_center_id?: string | null;
  template: {
    account_id: string;
    category_id?: string | null;
    type: "expense" | "income";
    amount: number;
    description?: string | null;
  };
}

export interface UpdateRecurrenceInput {
  id: string;
  frequency?: Frequency;
  interval_count?: number;
  end_date?: string | null;
  adjustment_index?: AdjustmentIndex | null;
  adjustment_rate?: number | null;
  template?: Partial<CreateRecurrenceInput["template"]>;
}

// ─── Labels ─────────────────────────────────────────────────────

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: "Diária",
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
};

export const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "monthly", label: "Mensal" },
  { value: "weekly", label: "Semanal" },
  { value: "yearly", label: "Anual" },
  { value: "daily", label: "Diária" },
];

// ─── Queries ────────────────────────────────────────────────────

/** List all recurrences (active + inactive) */
export function useRecurrences(activeOnly: boolean = true) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["recurrences", activeOnly],
    queryFn: async () => {
      let query = supabase
        .from("recurrences")
        .select("*")
        .order("next_due_date", { ascending: true });

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Recurrence[];
    },
  });
}

/** Single recurrence by ID */
export function useRecurrence(id: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["recurrences", "detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurrences")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Recurrence;
    },
  });
}

/**
 * CAP-04: Pending transactions from recurrences.
 * These are transactions with is_paid=false linked to a recurrence.
 */
export function usePendingBills() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["bills", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          id, description, amount, date, type, is_paid,
          recurrence_id,
          accounts!inner(name, color),
          categories(name, icon, color)
        `)
        .eq("is_paid", false)
        .eq("is_deleted", false)
        .not("recurrence_id", "is", null)
        .order("date", { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        description: row.description as string | null,
        amount: row.amount as number,
        date: row.date as string,
        type: row.type as string,
        is_paid: row.is_paid as boolean,
        recurrence_id: row.recurrence_id as string,
        account_name: (row.accounts as Record<string, unknown>)?.name as string ?? "",
        account_color: (row.accounts as Record<string, unknown>)?.color as string | null ?? null,
        category_name: (row.categories as Record<string, unknown>)?.name as string | null ?? null,
        category_icon: (row.categories as Record<string, unknown>)?.icon as string | null ?? null,
        category_color: (row.categories as Record<string, unknown>)?.color as string | null ?? null,
      }));
    },
  });
}

// ─── Mutations ──────────────────────────────────────────────────

/** CAP-01: Create recurrence + first pending transaction */
export function useCreateRecurrence() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRecurrenceInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      // 1. Create recurrence record
      const { data: rec, error: recErr } = await supabase
        .from("recurrences")
        .insert({
          user_id: user.id,
          frequency: input.frequency,
          interval_count: input.interval_count ?? 1,
          start_date: input.start_date,
          end_date: input.end_date ?? null,
          next_due_date: input.start_date,
          template_transaction: input.template as unknown as Record<string, unknown>,
          is_active: true,
          coa_id: input.coa_id ?? null,
          cost_center_id: input.cost_center_id ?? null,
          adjustment_index: input.adjustment_index ?? null,
          adjustment_rate: input.adjustment_rate ?? null,
        } as RecurrenceInsert)
        .select()
        .single();

      if (recErr) throw recErr;

      // 2. Create first pending transaction
      const { data: txData, error: txErr } = await supabase.rpc(
        "create_transaction_with_journal",
        {
          p_user_id: user.id,
          p_account_id: input.template.account_id,
          p_category_id: input.template.category_id ?? undefined,
          p_type: input.template.type,
          p_amount: input.template.amount,
          p_description: input.template.description ?? undefined,
          p_date: input.start_date,
          p_is_paid: false,
          p_source: "system",
          p_notes: undefined,
          p_tags: undefined,
          p_counterpart_coa_id: undefined,
        }
      );

      if (txErr) throw txErr;
      const txResult = txData as unknown as { transaction_id: string };

      // 3. Link transaction to recurrence
      await supabase
        .from("transactions")
        .update({ recurrence_id: rec.id })
        .eq("id", txResult.transaction_id);

      return rec as Recurrence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurrences"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** CAP-02: Update recurrence template or schedule */
export function useUpdateRecurrence() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, template, ...updates }: UpdateRecurrenceInput) => {
      // If template fields are being updated, merge with existing
      const payload: Record<string, unknown> = { ...updates };

      if (template) {
        const { data: existing } = await supabase
          .from("recurrences")
          .select("template_transaction")
          .eq("id", id)
          .single();

        if (existing) {
          payload.template_transaction = {
            ...(existing.template_transaction as Record<string, unknown>),
            ...template,
          };
        }
      }

      const { data, error } = await supabase
        .from("recurrences")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Recurrence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurrences"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}

/** CAP-03: Deactivate (encerrar) a recurrence */
export function useDeactivateRecurrence() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("recurrences")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurrences"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}

/** CAP-05: Pay a pending bill and generate next occurrence */
export function usePayBill() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      // 1. Mark transaction as paid
      const { data: tx, error: txErr } = await supabase
        .from("transactions")
        .update({ is_paid: true })
        .eq("id", transactionId)
        .select("recurrence_id")
        .single();

      if (txErr) throw txErr;

      // 2. If linked to recurrence, generate next occurrence
      let nextResult = null;
      if (tx.recurrence_id) {
        const { data, error } = await supabase.rpc("generate_next_recurrence", {
          p_user_id: user.id,
          p_recurrence_id: tx.recurrence_id,
        });
        if (error) throw error;
        nextResult = data;
      }

      return { transactionId, nextResult };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
