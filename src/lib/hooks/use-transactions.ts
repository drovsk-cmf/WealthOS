/**
 * Oniefy - Transaction Hooks (FIN-08, FIN-09, FIN-10)
 *
 * React Query hooks for querying transactions.
 * Mutations are in transaction-engine.ts (Lote 2.3).
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type TransactionType = Database["public"]["Enums"]["transaction_type"];

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  paymentStatus?: "pending" | "overdue" | "paid" | "cancelled";
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  showDeleted?: boolean;
  limit?: number;
  offset?: number;
}

export interface TransactionWithRelations extends Transaction {
  account_name?: string;
  account_color?: string | null;
  category_name?: string | null;
  category_icon?: string | null;
  category_color?: string | null;
}

export function useTransactions(filters: TransactionFilters = {}) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["transactions", filters],
    staleTime: 5 * 60 * 1000, // 5 min
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      let query = supabase
        .from("transactions")
        .select("id, description, amount, date, type, is_paid, payment_status, account_id, category_id, family_member_id, is_deleted, matched_transaction_id, recurrence_id, notes, created_at, accounts(name, color), categories(name, icon, color)")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (!filters.showDeleted) {
        query = query.eq("is_deleted", false);
      }
      if (filters.accountId) {
        query = query.eq("account_id", filters.accountId);
      }
      if (filters.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }
      if (filters.type) {
        query = query.eq("type", filters.type);
      }
      if (filters.paymentStatus) {
        query = query.eq("payment_status", filters.paymentStatus);
      }
      if (filters.dateFrom) {
        query = query.gte("date", filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte("date", filters.dateTo);
      }
      if (filters.search) {
        query = query.ilike("description", `%${filters.search}%`);
      }

      const limit = filters.limit ?? 50;
      const offset = filters.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      const { data: txs, error } = await query;
      if (error) throw error;
      if (!txs || txs.length === 0) return [] as TransactionWithRelations[];

      // D6.02: Relations already fetched via inline JOIN
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return txs.map((tx: any) => {
        const account = tx.accounts as { name: string; color: string | null } | null;
        const category = tx.categories as { name: string; icon: string | null; color: string | null } | null;
        const { accounts: _a, categories: _c, ...rest } = tx;
        return {
          ...rest,
          account_name: account?.name ?? "?",
          account_color: account?.color ?? null,
          category_name: category?.name ?? null,
          category_icon: category?.icon ?? null,
          category_color: category?.color ?? null,
        } as TransactionWithRelations;
      });
    },
  });
}

export function useTransaction(id: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["transactions", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id!)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as TransactionWithRelations;
    },
  });
}
