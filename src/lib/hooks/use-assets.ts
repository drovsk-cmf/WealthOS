/**
 * Oniefy - Assets Hooks (Phase 4)
 *
 * React Query hooks for asset (Patrimônio) operations.
 * Stories: PAT-01 (cadastrar), PAT-02 (editar), PAT-03 (excluir),
 *          PAT-04 (listar), PAT-05 (depreciar), PAT-06 (alertas seguro),
 *          PAT-07 (histórico de valor)
 *
 * Assets are linked to chart_of_accounts Group 1.2 (Bens e Investimentos).
 * Value changes recorded in asset_value_history.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { assetsSummarySchema, depreciateAssetResultSchema, logSchemaError } from "@/lib/schemas/rpc";
import type { Database } from "@/types/database";
import { getCachedUserId } from "@/lib/supabase/cached-auth";

type Asset = Database["public"]["Tables"]["assets"]["Row"];
type AssetInsert = Database["public"]["Tables"]["assets"]["Insert"];
type AssetCategory = Database["public"]["Enums"]["asset_category"];
type ValueChangeSource = Database["public"]["Enums"]["value_change_source"];
type AssetValueHistory = Database["public"]["Tables"]["asset_value_history"]["Row"];

// ─── Input types ────────────────────────────────────────────────

export interface CreateAssetInput {
  name: string;
  category: AssetCategory;
  acquisition_date: string;
  acquisition_value: number;
  current_value: number;
  depreciation_rate?: number;
  insurance_policy?: string | null;
  insurance_expiry?: string | null;
  notes_encrypted?: string | null;
  currency?: string;
}

export interface UpdateAssetInput {
  id: string;
  name?: string;
  category?: AssetCategory;
  current_value?: number;
  depreciation_rate?: number;
  insurance_policy?: string | null;
  insurance_expiry?: string | null;
  notes_encrypted?: string | null;
  currency?: string;
}

// ─── Labels ─────────────────────────────────────────────────────

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  real_estate: "Imóvel",
  vehicle: "Veículo",
  electronics: "Eletrônico",
  other: "Outro",
  restricted: "Restrito",
};

export const ASSET_CATEGORY_OPTIONS: { value: AssetCategory; label: string; description: string }[] = [
  { value: "real_estate", label: "Imóvel", description: "Casa, apartamento, terreno" },
  { value: "vehicle", label: "Veículo", description: "Carro, moto, barco" },
  { value: "electronics", label: "Eletrônico", description: "Notebook, celular, TV" },
  { value: "other", label: "Outro", description: "Jóias, arte, equipamentos" },
  { value: "restricted", label: "Restrito", description: "FGTS, previdência com carência" },
];

const ASSET_CATEGORY_COLORS: Record<AssetCategory, string> = {
  real_estate: "#56688F",
  vehicle: "#2F7A68",
  electronics: "#A97824",
  other: "#6F6678",
  restricted: "#7E9487",
};

export { ASSET_CATEGORY_COLORS };

// COA mapping: asset_category → chart_of_accounts internal_code (Group 1.2)
const COA_MAP: Record<AssetCategory, string> = {
  real_estate: "1.2.03",
  vehicle: "1.2.04",
  electronics: "1.2.05",
  other: "1.2.06",
  restricted: "1.2.07",
};

// ─── Summary type ───────────────────────────────────────────────

export interface AssetsSummary {
  total_value: number;
  total_acquisition: number;
  asset_count: number;
  by_category: { category: AssetCategory; count: number; total_value: number }[];
  expiring_insurance: { id: string; name: string; insurance_expiry: string; days_until_expiry: number }[];
  total_depreciation: number;
}

// ─── Queries ────────────────────────────────────────────────────

/** PAT-04: List all assets */
export function useAssets() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const userId = await getCachedUserId(supabase);
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("user_id", userId)
        .order("current_value", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Single asset by ID */
export function useAsset(id: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["assets", "detail", id],
    enabled: !!id,
    queryFn: async () => {
      const userId = await getCachedUserId(supabase);
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("id", id!)
        .eq("user_id", userId)
        .single();
      if (error) throw error;
      return data as Asset;
    },
  });
}

/** PAT-04 + PAT-06: Assets summary (totals + insurance alerts) */
export function useAssetsSummary() {
  return useQuery({
    queryKey: ["assets", "summary"],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<AssetsSummary> => {
      const supabase = createClient();
      const userId = await getCachedUserId(supabase);
      const { data, error } = await supabase.rpc("get_assets_summary", {
        p_user_id: userId,
      });
      if (error) throw error;
      const parsed = assetsSummarySchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_assets_summary", parsed);
        return { total_value: 0, total_acquisition: 0, asset_count: 0, by_category: [], expiring_insurance: [], total_depreciation: 0 };
      }
      return parsed.data;
    },
  });
}

/** PAT-07: Value history for a specific asset */
export function useAssetValueHistory(assetId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["assets", "history", assetId],
    enabled: !!assetId,
    queryFn: async () => {
      const userId = await getCachedUserId(supabase);
      const { data, error } = await supabase
        .from("asset_value_history")
        .select("*")
        .eq("asset_id", assetId!)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AssetValueHistory[];
    },
  });
}

// ─── Mutations ──────────────────────────────────────────────────

async function resolveCOA(
  supabase: ReturnType<typeof createClient>,
  category: AssetCategory
): Promise<string | null> {
  const code = COA_MAP[category];
  if (!code) return null;
  const { data } = await supabase
    .from("chart_of_accounts")
    .select("id")
    .eq("internal_code", code)
    .single();
  return data?.id ?? null;
}

/** PAT-01: Create asset + link to COA */
export function useCreateAsset() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAssetInput) => {
      const userId = await getCachedUserId(supabase);
      const coaId = await resolveCOA(supabase, input.category);

      const { data, error } = await supabase
        .from("assets")
        .insert({
          user_id: userId,
          name: input.name,
          category: input.category,
          acquisition_date: input.acquisition_date,
          acquisition_value: input.acquisition_value,
          current_value: input.current_value,
          depreciation_rate: input.depreciation_rate ?? 0,
          insurance_policy: input.insurance_policy ?? null,
          insurance_expiry: input.insurance_expiry ?? null,
          notes_encrypted: input.notes_encrypted ?? null,
          coa_id: coaId,
        } as AssetInsert)
        .select()
        .single();

      if (error) throw error;

      // Record initial value in history
      await supabase.from("asset_value_history").insert({
        asset_id: data.id,
        user_id: userId,
        previous_value: 0,
        new_value: input.current_value,
        change_reason: "Cadastro inicial",
        change_source: "manual" as ValueChangeSource,
      });

      return data as Asset;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["assets"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** PAT-02: Update asset (with value history if value changed) */
export function useUpdateAsset() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateAssetInput) => {
      const userId = await getCachedUserId(supabase);
      // If category changed, re-link COA
      let coaId: string | null | undefined;
      if (updates.category) {
        coaId = await resolveCOA(supabase, updates.category);
      }

      // If current_value changed, record history
      if (updates.current_value !== undefined) {
        const { data: existing } = await supabase
          .from("assets")
          .select("current_value")
          .eq("id", id)
          .single();

        if (existing && Number(existing.current_value) !== updates.current_value) {
          await supabase.from("asset_value_history").insert({
            asset_id: id,
            user_id: userId,
            previous_value: existing.current_value,
            new_value: updates.current_value,
            change_reason: "Atualização manual",
            change_source: "manual" as ValueChangeSource,
          });
        }
      }

      const { data, error } = await supabase
        .from("assets")
        .update({
          ...updates,
          ...(coaId !== undefined && { coa_id: coaId }),
        })
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return data as Asset;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["assets"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** PAT-03: Delete asset */
export function useDeleteAsset() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const userId = await getCachedUserId(supabase);
      // Delete history first (FK constraint)
      await supabase.from("asset_value_history").delete().eq("asset_id", id).eq("user_id", userId);
      const { error } = await supabase.from("assets").delete().eq("id", id).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["assets"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** PAT-05: Trigger depreciation on an asset */
export function useDepreciateAsset() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetId: string) => {
      const userId = await getCachedUserId(supabase);
      const { data, error } = await supabase.rpc("depreciate_asset", {
        p_user_id: userId,
        p_asset_id: assetId,
      });
      if (error) throw error;
      const parsed = depreciateAssetResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("depreciate_asset", parsed);
        throw new Error("Resposta inválida ao depreciar ativo.");
      }
      return parsed.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["assets"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
