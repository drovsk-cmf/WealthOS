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
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select("*")
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

      // Fetch related accounts and categories in batch
      const accountIds = Array.from(new Set(txs.map((t) => t.account_id)));
      const categoryIds = Array.from(new Set(txs.map((t) => t.category_id).filter(Boolean))) as string[];

      const [{ data: accounts }, { data: categories }] = await Promise.all([
        supabase.from("accounts").select("id, name, color").in("id", accountIds),
        categoryIds.length > 0
          ? supabase.from("categories").select("id, name, icon, color").in("id", categoryIds)
          : Promise.resolve({ data: [] as { id: string; name: string; icon: string | null; color: string | null }[] }),
      ]);

      const accountMap = new Map(accounts?.map((a) => [a.id, a]) ?? []);
      const categoryMap = new Map(categories?.map((c) => [c.id, c]) ?? []);

      return txs.map((tx) => {
        const account = accountMap.get(tx.account_id);
        const category = tx.category_id ? categoryMap.get(tx.category_id) : null;
        return {
          ...tx,
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
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id!)
        .single();

      if (error) throw error;
      return data as TransactionWithRelations;
    },
  });
}
