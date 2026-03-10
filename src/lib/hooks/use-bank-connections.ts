/**
 * Oniefy - Bank Connections Hook (Phase 9B)
 *
 * CRUD for bank_connections + import orchestration.
 * Stories: BANK-01 (connect), BANK-04 (reconcile), BANK-05 (update), BANK-06 (disconnect)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type BankConnection = Database["public"]["Tables"]["bank_connections"]["Row"];

export const SYNC_STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  syncing: "Sincronizando",
  error: "Erro",
  expired: "Expirada",
  manual: "Manual",
};

export const SYNC_STATUS_COLORS: Record<string, string> = {
  active: "text-verdant bg-verdant/15",
  syncing: "text-info-slate bg-info-slate/15",
  error: "text-terracotta bg-terracotta/15",
  expired: "text-burnished bg-burnished/15",
  manual: "text-gray-600 bg-gray-100",
};

export function useBankConnections() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["bank_connections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_connections")
        .select("*")
        .eq("is_active", true)
        .order("institution_name", { ascending: true });
      if (error) throw error;
      return data as BankConnection[];
    },
  });
}

export function useCreateBankConnection() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      institution_name: string;
      provider?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase
        .from("bank_connections")
        .insert({
          user_id: user.id,
          institution_name: input.institution_name,
          provider: input.provider || "manual",
          sync_status: "manual",
        })
        .select()
        .single();
      if (error) throw error;
      return data as BankConnection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank_connections"] });
    },
  });
}

export function useDeactivateBankConnection() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bank_connections")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank_connections"] });
    },
  });
}

export function useImportBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      accountId,
      bankConnectionId,
      transactions,
    }: {
      accountId: string;
      bankConnectionId: string | null;
      transactions: {
        date: string;
        amount: number;
        description: string;
        type?: string;
        external_id?: string;
      }[];
    }) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const batchId = crypto.randomUUID();

      const { data, error } = await supabase.rpc("import_transactions_batch", {
        p_user_id: user.id,
        p_account_id: accountId,
        p_bank_connection_id: bankConnectionId || null,
        p_batch_id: batchId,
        p_transactions: JSON.stringify(transactions),
      });
      if (error) throw error;
      return data as unknown as {
        status: string;
        imported: number;
        skipped: number;
        categorized: number;
        batch_id: string;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["bank_connections"] });
    },
  });
}
