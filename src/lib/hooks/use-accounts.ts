/**
 * Oniefy - Accounts Hooks (FIN-01, FIN-02, FIN-04, FIN-05)
 *
 * React Query hooks for CRUD operations on accounts table.
 * Auto-links accounts with chart_of_accounts based on type.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { getCachedUserId } from "@/lib/supabase/cached-auth";
import { tryAdvanceStep } from "@/lib/hooks/use-setup-journey";

type Account = Database["public"]["Tables"]["accounts"]["Row"];
type AccountInsert = Database["public"]["Tables"]["accounts"]["Insert"];
type AccountUpdate = Database["public"]["Tables"]["accounts"]["Update"];
type AccountType = Database["public"]["Enums"]["account_type"];

// Map account_type → parent COA code for auto-creation of individual COA entries
export const COA_PARENT_MAP: Record<AccountType, { parentCode: string; tier: string }> = {
  checking: { parentCode: "1.1.01", tier: "T1" },
  savings: { parentCode: "1.1.02", tier: "T1" },
  cash: { parentCode: "1.1.03", tier: "T1" },
  investment: { parentCode: "1.2.01", tier: "T2" },
  credit_card: { parentCode: "2.1.01", tier: "T1" },
  loan: { parentCode: "2.2.03", tier: "T3" },
  financing: { parentCode: "2.2.01", tier: "T3" },
};

// Financing sub-types: user can pick which parent COA
export const FINANCING_SUBTYPES = [
  { value: "2.2.01", label: "Financiamento Imobiliário" },
  { value: "2.2.02", label: "Financiamento de Veículo" },
];

// Labels for UI
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: "Conta Corrente",
  savings: "Poupança",
  cash: "Carteira Digital",
  investment: "Investimento",
  credit_card: "Cartão de Crédito",
  loan: "Empréstimo",
  financing: "Financiamento",
};

export const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: "checking", label: "Conta Corrente" },
  { value: "savings", label: "Poupança" },
  { value: "cash", label: "Carteira Digital" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "investment", label: "Investimento" },
  { value: "loan", label: "Empréstimo" },
  { value: "financing", label: "Financiamento" },
];

export const LIQUIDITY_TIER_LABELS: Record<string, string> = {
  T1: "T1 - Liquidez imediata",
  T2: "T2 - Investimentos resgatáveis",
  T3: "T3 - Bens e financiamentos",
  T4: "T4 - Ilíquidos / restritos",
};

export const LIQUIDITY_TIER_OPTIONS = [
  { value: "T1", label: "T1 - Liquidez imediata" },
  { value: "T2", label: "T2 - Investimentos" },
  { value: "T3", label: "T3 - Bens / financiamentos" },
  { value: "T4", label: "T4 - Ilíquidos" },
];

const PRESET_COLORS = [
  "#56688F", "#2F7A68", "#A97824", "#A64A45", "#6F6678",
  "#A7794E", "#7E9487", "#241E29", "#4A7A6E", "#8B6B4A",
];

export { PRESET_COLORS };

// ─── Queries ────────────────────────────────────────────────

export function useAccounts() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["accounts"],
    staleTime: 5 * 60 * 1000, // 5 min
    queryFn: async () => {
      const userId = await getCachedUserId(supabase);
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function useAccount(id: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["accounts", id],
    enabled: !!id,
    queryFn: async () => {
      const userId = await getCachedUserId(supabase);
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", id!)
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      return data as Account;
    },
  });
}

// ─── Mutations ──────────────────────────────────────────────

export function useCreateAccount() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<AccountInsert, "user_id" | "coa_id"> & {
        coaParentCode?: string; // override parent (e.g. financing sub-type)
      }
    ) => {
      const userId = await getCachedUserId(supabase);
      const { coaParentCode, liquidity_tier: tierOverride, ...accountInput } = input;
      const mapping = COA_PARENT_MAP[accountInput.type];
      const parentCode = coaParentCode || mapping?.parentCode;
      const tier = tierOverride || mapping?.tier || "T1";

      // Auto-create individual COA entry under the parent.
      // COA must succeed before account creation to maintain consistency.
      let coaId: string | null = null;
      if (parentCode) {
        const { data: coaResult, error: coaError } = await supabase.rpc(
          "create_coa_child",
          {
            p_user_id: userId,
            p_parent_code: parentCode,
            p_display_name: accountInput.name,
          }
        );
        if (coaError) {
          throw new Error(
            "Não foi possível criar o plano de contas associado. Tente novamente."
          );
        }
        coaId = coaResult;
      }

      const { data, error } = await supabase
        .from("accounts")
        .insert({
          ...accountInput,
          user_id: userId,
          coa_id: coaId,
          liquidity_tier: tier,
          current_balance: accountInput.initial_balance ?? 0,
          projected_balance: accountInput.initial_balance ?? 0,
        })
        .select()
        .single();

      if (error) throw error;

      // WKF-01: Auto-create workflow for this account
      try {
        await supabase.rpc("auto_create_workflow_for_account", {
          p_user_id: userId,
          p_account_id: data.id,
          p_account_type: accountInput.type,
          p_account_name: accountInput.name,
        });
      } catch {
        if (process.env.NODE_ENV === "development") console.warn("[Oniefy] Auto-create workflow failed for account", data.id);
      }

      return data as Account;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
      await queryClient.invalidateQueries({ queryKey: ["workflows"] });
      await queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      tryAdvanceStep("create_accounts", queryClient);
    },
  });
}

export function useUpdateAccount() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: AccountUpdate & { id: string }) => {
      const userId = await getCachedUserId(supabase);
      // If type changed and no explicit tier override, update tier
      let tier: string | undefined = updates.liquidity_tier;
      if (!tier && updates.type) {
        tier = COA_PARENT_MAP[updates.type]?.tier ?? "T1";
      }

      const { data, error } = await supabase
        .from("accounts")
        .update({
          ...updates,
          ...(tier !== undefined && { liquidity_tier: tier }),
        })
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return data as Account;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeactivateAccount() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const userId = await getCachedUserId(supabase);
      const { error } = await supabase
        .from("accounts")
        .update({ is_active: false })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
