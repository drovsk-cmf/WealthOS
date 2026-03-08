/**
 * WealthOS - Cost Centers Hooks (CEN-01, CEN-02)
 *
 * Basic CRUD. Default center ("Pessoal") can't be deleted.
 * Rateio (CEN-03) deferred to Fase 5.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type CostCenter = Database["public"]["Tables"]["cost_centers"]["Row"];
type CostCenterInsert = Database["public"]["Tables"]["cost_centers"]["Insert"];
type CostCenterUpdate = Database["public"]["Tables"]["cost_centers"]["Update"];
type CenterType = Database["public"]["Enums"]["center_type"];

export const CENTER_TYPE_LABELS: Record<CenterType, string> = {
  cost_center: "Centro de Custo",
  profit_center: "Centro de Lucro",
  neutral: "Neutro",
};

export const CENTER_TYPE_OPTIONS: { value: CenterType; label: string; desc: string }[] = [
  { value: "cost_center", label: "Centro de Custo", desc: "Acompanha apenas despesas" },
  { value: "profit_center", label: "Centro de Lucro", desc: "Acompanha receitas e despesas" },
  { value: "neutral", label: "Neutro", desc: "Agrupamento sem classificação" },
];

export function useCostCenters() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["cost_centers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cost_centers")
        .select("*")
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as CostCenter[];
    },
  });
}

export function useCreateCostCenter() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<CostCenterInsert, "user_id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase
        .from("cost_centers")
        .insert({ ...input, user_id: user.id, is_default: false })
        .select()
        .single();

      if (error) throw error;
      return data as CostCenter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost_centers"] });
    },
  });
}

export function useUpdateCostCenter() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CostCenterUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("cost_centers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as CostCenter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost_centers"] });
    },
  });
}

export function useDeleteCostCenter() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // RLS policy blocks delete of is_default=true
      const { error } = await supabase
        .from("cost_centers")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost_centers"] });
    },
  });
}
