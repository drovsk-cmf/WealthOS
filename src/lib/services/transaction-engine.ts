/**
 * Oniefy - Transaction Engine (CTB-01, CTB-02)
 *
 * Client-side service that calls the Postgres function
 * create_transaction_with_journal() for atomic creation of
 * transaction + journal_entry + journal_lines.
 *
 * The accounting logic (debit/credit rules) lives in the database
 * function. This module provides a typed interface and React Query hooks.
 *
 * Ref: wealthos-estudo-tecnico-v2.0, seção 12
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { logSchemaError, transactionResultSchema, transferResultSchema, reversalResultSchema } from "@/lib/schemas/rpc";

type TransactionType = Database["public"]["Enums"]["transaction_type"];
type EntrySource = Database["public"]["Enums"]["entry_source"];

// ─── Input types ────────────────────────────────────────────

export interface CreateTransactionInput {
  account_id: string;
  category_id?: string | null;
  type: TransactionType;
  amount: number;
  description?: string | null;
  date: string;        // ISO date string YYYY-MM-DD
  is_paid: boolean;
  source?: EntrySource;
  notes?: string | null;
  tags?: string[] | null;
  counterpart_coa_id?: string | null;  // explicit COA override
  family_member_id?: string | null;
}

export interface TransferInput {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description?: string | null;
  date: string;
  is_paid: boolean;
}

export interface TransactionResult {
  transaction_id: string;
  journal_entry_id: string | null;
}

export interface TransferResult {
  from_transaction_id: string;
  to_transaction_id: string;
  journal_entry_id: string | null;
  amount: number;
}

export interface ReversalResult {
  reversed_transaction_id: string;
  reversal_journal_id: string | null;
}

// ─── Service functions ──────────────────────────────────────

/**
 * Creates a transaction with automatic journal entry generation.
 * Uses the Postgres RPC for atomicity.
 */
export async function createTransaction(
  input: CreateTransactionInput
): Promise<TransactionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");

  const { data, error } = await supabase.rpc("create_transaction_with_journal", {
    p_user_id: user.id,
    p_account_id: input.account_id,
    p_category_id: input.category_id ?? undefined,
    p_type: input.type,
    p_amount: input.amount,
    p_description: input.description ?? undefined,
    p_date: input.date,
    p_is_paid: input.is_paid,
    p_source: input.source ?? "manual",
    p_notes: input.notes ?? undefined,
    p_tags: input.tags ?? undefined,
    p_counterpart_coa_id: input.counterpart_coa_id ?? undefined,
  });

  if (error) throw new Error(error.message);

  // RPC returns JSON
  const parsed = transactionResultSchema.safeParse(data);
  if (!parsed.success) {
    logSchemaError("create_transaction_with_journal", parsed);
    throw new Error("Resposta inválida ao criar transação.");
  }
  const result = parsed.data;

  // Set family_member_id if provided (not part of the RPC, set after)
  if (input.family_member_id && result.transaction_id) {
    await supabase
      .from("transactions")
      .update({ family_member_id: input.family_member_id })
      .eq("id", result.transaction_id);
  }

  return result;
}

/**
 * Creates an atomic transfer between two accounts.
 * Uses the Postgres RPC for atomicity: single journal entry,
 * correct double-entry (D destination, C source), linked transfer_pair_id.
 */
export async function createTransfer(
  input: TransferInput
): Promise<TransferResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");

  const { data, error } = await supabase.rpc("create_transfer_with_journal", {
    p_user_id: user.id,
    p_from_account_id: input.from_account_id,
    p_to_account_id: input.to_account_id,
    p_amount: input.amount,
    p_description: input.description ?? "Transferência entre contas",
    p_date: input.date,
    p_is_paid: input.is_paid,
    p_source: "manual",
  });

  if (error) throw new Error(error.message);
  const parsed = transferResultSchema.safeParse(data);
  if (!parsed.success) {
    logSchemaError("create_transfer_with_journal", parsed);
    throw new Error("Resposta inválida ao criar transferência.");
  }
  return parsed.data;
}

/**
 * Reverses (estorna) a transaction.
 * Soft-deletes the transaction and creates reversal journal entries.
 */
export async function reverseTransaction(
  transactionId: string
): Promise<ReversalResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");

  const { data, error } = await supabase.rpc("reverse_transaction", {
    p_user_id: user.id,
    p_transaction_id: transactionId,
  });

  if (error) throw new Error(error.message);
  const parsed = reversalResultSchema.safeParse(data);
  if (!parsed.success) {
    logSchemaError("reverse_transaction", parsed);
    throw new Error("Resposta inválida ao estornar transação.");
  }
  return parsed.data;
}

// ─── React Query Hooks ──────────────────────────────────────

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useReverseTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reverseTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
