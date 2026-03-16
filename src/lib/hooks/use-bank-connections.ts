/**
 * Oniefy - Bank Connections Hook (Phase 9B)
 *
 * CRUD for bank_connections + import orchestration.
 * Stories: BANK-01 (connect), BANK-04 (reconcile), BANK-05 (update), BANK-06 (disconnect)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { importBatchResultSchema, logSchemaError } from "@/lib/schemas/rpc";

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
  manual: "text-muted-foreground bg-muted",
};

export function useBankConnections() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["bank_connections"],
    staleTime: 5 * 60 * 1000, // 5 min
      queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase
        .from("bank_connections")
        .select("id, institution_name, institution_logo_url, is_active, sync_status, last_sync_at, created_at, updated_at")
        .eq("user_id", user.id)
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["bank_connections"] });
    },
  });
}

export function useDeactivateBankConnection() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { error } = await supabase
        .from("bank_connections")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["bank_connections"] });
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
        p_bank_connection_id: bankConnectionId || undefined,
        p_batch_id: batchId,
        p_transactions: JSON.stringify(transactions),
      });
      if (error) throw error;
      const parsed = importBatchResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("import_transactions_batch", parsed);
        return {
          status: "error",
          imported: 0,
          skipped: transactions.length,
          categorized: 0,
          matched: 0,
          batch_id: batchId,
        };
      }
      return parsed.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
      await queryClient.invalidateQueries({ queryKey: ["bank_connections"] });
    },
  });
}

/** UX-H2-05: Undo an import batch (soft-delete, 72h window) */
export function useUndoImportBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (batchId: string) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("undo_import_batch", {
        p_user_id: user.id,
        p_batch_id: batchId,
      });
      if (error) throw error;

      const result = data as { status: string; message?: string; undone_count?: number; batch_id?: string };
      if (result.status === "error") {
        throw new Error(result.message || "Erro ao desfazer importação.");
      }

      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["bank_connections"] });
    },
  });
}
