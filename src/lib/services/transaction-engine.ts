/**
 * WealthOS - Transaction Engine (CTB-01, CTB-02)
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
    p_category_id: input.category_id ?? null,
    p_type: input.type,
    p_amount: input.amount,
    p_description: input.description ?? null,
    p_date: input.date,
    p_is_paid: input.is_paid,
    p_source: input.source ?? "manual",
    p_notes: input.notes ?? null,
    p_tags: input.tags ?? null,
    p_counterpart_coa_id: input.counterpart_coa_id ?? null,
  });

  if (error) throw new Error(error.message);

  // RPC returns JSON
  const result = data as unknown as TransactionResult;
  return result;
}

/**
 * Creates a transfer between two accounts.
 * Generates 2 transactions (expense on source, income on destination)
 * each with their own journal entries.
 */
export async function createTransfer(
  input: TransferInput
): Promise<{ from: TransactionResult; to: TransactionResult }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");

  const desc = input.description || "Transferência entre contas";

  // 1. Create outgoing transaction (expense on source)
  const { data: fromData, error: fromError } = await supabase.rpc(
    "create_transaction_with_journal",
    {
      p_user_id: user.id,
      p_account_id: input.from_account_id,
      p_category_id: null,
      p_type: "expense",
      p_amount: input.amount,
      p_description: desc,
      p_date: input.date,
      p_is_paid: input.is_paid,
      p_source: "manual",
      p_notes: null,
      p_tags: null,
      p_counterpart_coa_id: null,
    }
  );
  if (fromError) throw new Error(fromError.message);
  const fromResult = fromData as unknown as TransactionResult;

  // 2. Create incoming transaction (income on destination)
  const { data: toData, error: toError } = await supabase.rpc(
    "create_transaction_with_journal",
    {
      p_user_id: user.id,
      p_account_id: input.to_account_id,
      p_category_id: null,
      p_type: "income",
      p_amount: input.amount,
      p_description: desc,
      p_date: input.date,
      p_is_paid: input.is_paid,
      p_source: "manual",
      p_notes: null,
      p_tags: null,
      p_counterpart_coa_id: null,
    }
  );
  if (toError) throw new Error(toError.message);
  const toResult = toData as unknown as TransactionResult;

  // 3. Link transfer pair
  await supabase
    .from("transactions")
    .update({ transfer_pair_id: toResult.transaction_id, type: "transfer" as TransactionType })
    .eq("id", fromResult.transaction_id);

  await supabase
    .from("transactions")
    .update({ transfer_pair_id: fromResult.transaction_id, type: "transfer" as TransactionType })
    .eq("id", toResult.transaction_id);

  return { from: fromResult, to: toResult };
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
  return data as unknown as ReversalResult;
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
