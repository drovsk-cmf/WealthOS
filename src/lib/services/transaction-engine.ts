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
import { logSchemaError, transactionResultSchema, transferResultSchema, reversalResultSchema, editTransactionResultSchema, editTransferResultSchema } from "@/lib/schemas/rpc";
import { getCachedUserId } from "@/lib/supabase/cached-auth";
import { tryAdvanceStep } from "@/lib/hooks/use-setup-journey";

type TransactionType = Database["public"]["Enums"]["transaction_type"];
type EntrySource = Database["public"]["Enums"]["entry_source"];

// ─── Input types ────────────────────────────────────────────

export interface CreateTransactionInput {
  account_id: string;
  category_id?: string | null;
  category_source?: "manual" | "auto" | "import_auto" | null;
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

export interface EditTransactionInput extends CreateTransactionInput {
  original_transaction_id: string;
}

export interface EditTransactionResult {
  original_id: string;
  new_transaction_id: string;
  new_journal_entry_id: string | null;
  reversal_journal_id: string | null;
}

export interface EditTransferInput {
  original_transaction_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description?: string | null;
  date: string;
  is_paid: boolean;
}

export interface EditTransferResult {
  original_id: string;
  original_pair_id: string | null;
  new_from_transaction_id: string;
  new_to_transaction_id: string;
  new_journal_entry_id: string | null;
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
  const userId = await getCachedUserId(supabase);
  const { data, error } = await supabase.rpc("create_transaction_with_journal", {
    p_user_id: userId,
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
    // DT-006: Pass directly to RPC instead of separate UPDATEs
    p_family_member_id: input.family_member_id ?? undefined,
    p_category_source: input.category_source ?? undefined,
  });

  if (error) throw new Error(error.message);

  // RPC returns JSON
  const parsed = transactionResultSchema.safeParse(data);
  if (!parsed.success) {
    logSchemaError("create_transaction_with_journal", parsed);
    throw new Error("Resposta inválida ao criar transação.");
  }

  return parsed.data;
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
  const userId = await getCachedUserId(supabase);
  const { data, error } = await supabase.rpc("create_transfer_with_journal", {
    p_user_id: userId,
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
  const userId = await getCachedUserId(supabase);
  const { data, error } = await supabase.rpc("reverse_transaction", {
    p_user_id: userId,
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

/**
 * Edit a transaction (atomic reverse + re-create).
 * DT-012: Preserves append-only journal model while providing edit UX.
 */
export async function editTransaction(
  input: EditTransactionInput
): Promise<EditTransactionResult> {
  const supabase = createClient();
  const userId = await getCachedUserId(supabase);
  const { data, error } = await supabase.rpc("edit_transaction", {
    p_user_id: userId,
    p_transaction_id: input.original_transaction_id,
    p_account_id: input.account_id,
    p_category_id: input.category_id ?? undefined,
    p_type: input.type,
    p_amount: input.amount,
    p_description: input.description ?? undefined,
    p_date: input.date,
    p_is_paid: input.is_paid,
    p_notes: input.notes ?? undefined,
    p_tags: input.tags ?? undefined,
    p_family_member_id: input.family_member_id ?? undefined,
    p_category_source: input.category_source ?? undefined,
  });

  if (error) throw new Error(error.message);
  const parsed = editTransactionResultSchema.safeParse(data);
  if (!parsed.success) {
    logSchemaError("edit_transaction", parsed);
    throw new Error("Resposta inválida ao editar transação.");
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

export function useEditTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: editTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      tryAdvanceStep("categorize", queryClient);
    },
  });
}

/**
 * Edit a transfer (atomic reverse pair + re-create).
 * 3.4: Reverses both transactions in the pair and creates a new transfer.
 */
export async function editTransfer(
  input: EditTransferInput
): Promise<EditTransferResult> {
  const supabase = createClient();
  const userId = await getCachedUserId(supabase);
  const { data, error } = await supabase.rpc("edit_transfer", {
    p_user_id: userId,
    p_transaction_id: input.original_transaction_id,
    p_from_account_id: input.from_account_id,
    p_to_account_id: input.to_account_id,
    p_amount: input.amount,
    p_description: input.description ?? undefined,
    p_date: input.date,
    p_is_paid: input.is_paid,
  });

  if (error) throw new Error(error.message);
  const parsed = editTransferResultSchema.safeParse(data);
  if (!parsed.success) {
    logSchemaError("edit_transfer", parsed);
    throw new Error("Resposta inválida ao editar transferência.");
  }
  return parsed.data;
}

export function useEditTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: editTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
