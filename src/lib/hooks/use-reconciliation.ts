/**
 * Oniefy - Reconciliation Hooks (Camada 3)
 *
 * BANK-04: Manual reconciliation between pending bills and imported transactions.
 * Provides:
 *  - useUnmatchedImports: imported transactions not yet matched
 *  - usePendingUnmatched: pending/overdue transactions without a match
 *  - useMatchTransactions: manual pairing mutation
 *  - useReconciliationCandidates: find auto-match candidates for a given tx
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { matchTransactionsResultSchema, logSchemaError } from "@/lib/schemas/rpc";

export interface UnmatchedTransaction {
  id: string;
  description: string | null;
  amount: number;
  date: string;
  due_date: string | null;
  type: string;
  payment_status: string;
  account_id: string;
  account_name: string;
  category_name: string | null;
  source: string;
}

/**
 * Imported transactions that are paid but not matched to a pending one.
 * These are potential duplicates or new transactions from bank feeds.
 */
export function useUnmatchedImports(accountId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["reconciliation", "imports", accountId],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select(`
          id, description, amount, date, type, payment_status, account_id, source,
          accounts!inner(name)
        `)
        .eq("is_deleted", false)
        .eq("payment_status", "paid")
        .is("matched_transaction_id", null)
        .not("import_batch_id", "is", null)
        .order("date", { ascending: false })
        .limit(100);

      if (accountId) {
        query = query.eq("account_id", accountId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        description: row.description as string | null,
        amount: row.amount as number,
        date: row.date as string,
        due_date: null,
        type: row.type as string,
        payment_status: row.payment_status as string,
        account_id: row.account_id as string,
        account_name: (row.accounts as Record<string, unknown>)?.name as string ?? "",
        category_name: null,
        source: row.source as string,
      })) as UnmatchedTransaction[];
    },
  });
}

/**
 * Pending/overdue transactions without a match (candidates for reconciliation).
 */
export function usePendingUnmatched(accountId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["reconciliation", "pending", accountId],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select(`
          id, description, amount, date, due_date, type, payment_status, account_id, source,
          accounts!inner(name),
          categories(name)
        `)
        .eq("is_deleted", false)
        .in("payment_status", ["pending", "overdue"])
        .is("matched_transaction_id", null)
        .order("date", { ascending: true })
        .limit(100);

      if (accountId) {
        query = query.eq("account_id", accountId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        description: row.description as string | null,
        amount: row.amount as number,
        date: row.date as string,
        due_date: row.due_date as string | null,
        type: row.type as string,
        payment_status: row.payment_status as string,
        account_id: row.account_id as string,
        account_name: (row.accounts as Record<string, unknown>)?.name as string ?? "",
        category_name: (row.categories as Record<string, unknown>)?.name as string | null ?? null,
        source: row.source as string,
      })) as UnmatchedTransaction[];
    },
  });
}

/**
 * Mutation: manually match a pending transaction with an imported one.
 */
export function useMatchTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pendingId, importedId }: { pendingId: string; importedId: string }) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("match_transactions", {
        p_user_id: user.id,
        p_pending_id: pendingId,
        p_imported_id: importedId,
      });
      if (error) throw new Error(error.message);

      const parsed = matchTransactionsResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("match_transactions", parsed);
        throw new Error("Resposta inválida ao conciliar.");
      }
      return parsed.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliation"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
