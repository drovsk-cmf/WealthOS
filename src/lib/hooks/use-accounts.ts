/**
 * Oniefy - Accounts Hooks (FIN-01, FIN-02, FIN-04, FIN-05)
 *
 * React Query hooks for CRUD operations on accounts table.
 * Auto-links accounts with chart_of_accounts based on type.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Account = Database["public"]["Tables"]["accounts"]["Row"];
type AccountInsert = Database["public"]["Tables"]["accounts"]["Insert"];
type AccountUpdate = Database["public"]["Tables"]["accounts"]["Update"];
type AccountType = Database["public"]["Enums"]["account_type"];

// Map account_type → chart_of_accounts internal_code
const COA_MAP: Record<AccountType, { code: string; tier: string }> = {
  checking: { code: "1.1.01", tier: "T1" },
  savings: { code: "1.1.02", tier: "T1" },
  cash: { code: "1.1.03", tier: "T1" },
  investment: { code: "1.2.01", tier: "T2" },
  credit_card: { code: "2.1.01", tier: "T1" },
};

// Labels for UI
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: "Conta Corrente",
  savings: "Poupança",
  cash: "Carteira Digital",
  investment: "Investimento",
  credit_card: "Cartão de Crédito",
};

export const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: "checking", label: "Conta Corrente" },
  { value: "savings", label: "Poupança" },
  { value: "cash", label: "Carteira Digital" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "investment", label: "Investimento" },
];

const PRESET_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

export { PRESET_COLORS };

// ─── Queries ────────────────────────────────────────────────

export function useAccounts() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Account[];
    },
  });
}

export function useAccount(id: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["accounts", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", id!)
        .single();

      if (error) throw error;
      return data as Account;
    },
  });
}

// ─── Mutations ──────────────────────────────────────────────

async function resolveCOA(
  supabase: ReturnType<typeof createClient>,
  accountType: AccountType
): Promise<string | null> {
  const mapping = COA_MAP[accountType];
  if (!mapping) return null;

  const { data } = await supabase
    .from("chart_of_accounts")
    .select("id")
    .eq("internal_code", mapping.code)
    .single();

  return data?.id ?? null;
}

export function useCreateAccount() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<AccountInsert, "user_id" | "coa_id" | "liquidity_tier">
    ) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      // Auto-link COA
      const coaId = await resolveCOA(supabase, input.type);
      const tier = COA_MAP[input.type]?.tier ?? "T1";

      const { data, error } = await supabase
        .from("accounts")
        .insert({
          ...input,
          user_id: user.id,
          coa_id: coaId,
          liquidity_tier: tier,
          current_balance: input.initial_balance ?? 0,
          projected_balance: input.initial_balance ?? 0,
        })
        .select()
        .single();

      if (error) throw error;

      // WKF-01: Auto-create workflow for this account
      try {
        await supabase.rpc("auto_create_workflow_for_account", {
          p_user_id: user.id,
          p_account_id: data.id,
          p_account_type: input.type,
          p_account_name: input.name,
        });
      } catch {
        console.warn("[Oniefy] Auto-create workflow failed for account", data.id);
      }

      return data as Account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

export function useUpdateAccount() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: AccountUpdate & { id: string }) => {
      // If type changed, re-link COA
      let coaId: string | null | undefined;
      let tier: string | undefined;
      if (updates.type) {
        coaId = await resolveCOA(supabase, updates.type);
        tier = COA_MAP[updates.type]?.tier ?? "T1";
      }

      const { data, error } = await supabase
        .from("accounts")
        .update({
          ...updates,
          ...(coaId !== undefined && { coa_id: coaId }),
          ...(tier !== undefined && { liquidity_tier: tier }),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeactivateAccount() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("accounts")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
