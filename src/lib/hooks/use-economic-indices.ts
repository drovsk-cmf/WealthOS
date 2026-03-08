/**
 * WealthOS - Economic Indices Hooks (Phase 8)
 *
 * React Query hooks for economic indices.
 * Data comes from BCB SGS / IBGE SIDRA via API route + stored in Supabase.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// ─── Types ──────────────────────────────────────────────────────

export interface IndexDataPoint {
  index_type: string;
  reference_date: string;
  value: number;
  accumulated_12m: number | null;
  accumulated_year: number | null;
  source_primary: string;
  fetched_at: string;
}

export interface LatestIndex {
  index_type: string;
  reference_date: string;
  value: number;
  accumulated_12m: number | null;
  accumulated_year: number | null;
  source_primary: string;
}

export interface FetchResult {
  status: string;
  fetched_at: string;
  results: { index_type: string; inserted: number; errors: string[] }[];
  total_inserted: number;
}

// ─── Labels ─────────────────────────────────────────────────────

export const INDEX_TYPE_LABELS: Record<string, string> = {
  ipca: "IPCA",
  inpc: "INPC",
  igpm: "IGP-M",
  selic: "Selic",
  cdi: "CDI",
  tr: "TR",
  usd_brl: "Dólar (USD/BRL)",
  minimum_wage: "Salário Mínimo",
  ipca_food: "IPCA Alimentação",
  ipca_housing: "IPCA Habitação",
  ipca_transport: "IPCA Transportes",
  ipca_health: "IPCA Saúde",
  ipca_education: "IPCA Educação",
};

export const INDEX_TYPE_COLORS: Record<string, string> = {
  ipca: "#EF4444",
  inpc: "#F97316",
  igpm: "#F59E0B",
  selic: "#3B82F6",
  cdi: "#06B6D4",
  tr: "#8B5CF6",
  usd_brl: "#10B981",
  minimum_wage: "#EC4899",
};

export const INDEX_UNIT: Record<string, string> = {
  ipca: "% ao mês",
  inpc: "% ao mês",
  igpm: "% ao mês",
  selic: "% ao ano",
  cdi: "% ao ano",
  tr: "% ao mês",
  usd_brl: "R$/USD",
  minimum_wage: "R$",
};

// ─── Queries ────────────────────────────────────────────────────

/** Latest value per index type */
export function useLatestIndices() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["indices", "latest"],
    staleTime: 10 * 60 * 1000, // 10 min
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_index_latest");
      if (error) throw error;
      const result = data as unknown as { indices: LatestIndex[] };
      return result.indices ?? [];
    },
  });
}

/** Historical data for a specific index */
export function useIndexHistory(indexType: string | null, months: number = 12) {
  const supabase = createClient();
  const dateFrom = new Date();
  dateFrom.setMonth(dateFrom.getMonth() - months);

  return useQuery({
    queryKey: ["indices", "history", indexType, months],
    enabled: !!indexType,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_economic_indices", {
        p_index_type: indexType!,
        p_date_from: dateFrom.toISOString().slice(0, 10),
        p_limit: months + 2,
      });
      if (error) throw error;
      const result = data as unknown as { data: IndexDataPoint[] };
      return result.data ?? [];
    },
  });
}

// ─── Mutations ──────────────────────────────────────────────────

/** Trigger fetch from BCB APIs */
export function useFetchIndices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<FetchResult> => {
      const response = await fetch("/api/indices/fetch", { method: "POST" });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro ao buscar índices");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indices"] });
    },
  });
}
