/**
 * Oniefy - Cost Centers Hooks (CEN-01, CEN-02)
 *
 * Basic CRUD. Default center ("Pessoal") can't be deleted.
 * Rateio (CEN-03) deferred to Fase 5.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { centerPnlSchema, centerExportSchema, allocateToCentersResultSchema, logSchemaError } from "@/lib/schemas/rpc";
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase
        .from("cost_centers")
        .select("*")
        .eq("user_id", user.id)
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cost_centers"] });
    },
  });
}

export function useUpdateCostCenter() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CostCenterUpdate & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase
        .from("cost_centers")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as CostCenter;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cost_centers"] });
    },
  });
}

export function useDeleteCostCenter() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      // RLS policy blocks delete of is_default=true
      const { error } = await supabase
        .from("cost_centers")
        .update({ is_active: false })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cost_centers"] });
    },
  });
}

// ═══ Phase 5: Advanced Center Hooks (CEN-03 to CEN-05) ═══════

// ─── Types ──────────────────────────────────────────────────────

export interface CenterPnl {
  center_id: string;
  center_name: string;
  center_type: string;
  period_from: string;
  period_to: string;
  total_income: number;
  total_expense: number;
  net_result: number;
  monthly: { month: string; income: number; expense: number }[];
}

export interface CenterExport {
  center: {
    id: string;
    name: string;
    type: string;
    color: string | null;
    created_at: string;
  };
  transactions: {
    id: string;
    date: string;
    type: string;
    amount: number;
    description: string | null;
    is_paid: boolean;
    center_percentage: number;
    center_amount: number;
    coa_name: string;
    group_type: string;
  }[];
  exported_at: string;
}

export interface AllocationInput {
  cost_center_id: string;
  percentage: number;
}

// ─── CEN-04: P&L by center ─────────────────────────────────────

export function useCenterPnl(
  centerId: string | null,
  dateFrom?: string,
  dateTo?: string
) {
  return useQuery({
    queryKey: ["cost_centers", "pnl", centerId, dateFrom, dateTo],
    enabled: !!centerId,
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<CenterPnl> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("get_center_pnl", {
        p_user_id: user.id,
        p_center_id: centerId!,
        ...(dateFrom && { p_date_from: dateFrom }),
        ...(dateTo && { p_date_to: dateTo }),
      });
      if (error) throw error;
      const parsed = centerPnlSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_center_pnl", parsed);
        return { center_id: centerId!, center_name: "", center_type: "", period_from: "", period_to: "", total_income: 0, total_expense: 0, net_result: 0, monthly: [] };
      }
      return parsed.data;
    },
  });
}

// ─── CEN-05: Export center data ─────────────────────────────────

export function useCenterExport() {
  return useMutation({
    mutationFn: async (centerId: string): Promise<CenterExport> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("get_center_export", {
        p_user_id: user.id,
        p_center_id: centerId,
      });
      if (error) throw error;
      const parsed = centerExportSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_center_export", parsed);
        throw new Error("Resposta inválida ao exportar centro.");
      }
      return parsed.data;
    },
  });
}

// ─── CEN-03: Allocate transaction to centers ────────────────────

export function useAllocateToCenters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      allocations,
    }: {
      transactionId: string;
      allocations: AllocationInput[];
    }) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("allocate_to_centers", {
        p_user_id: user.id,
        p_transaction_id: transactionId,
        p_allocations: JSON.stringify(allocations),
      });
      if (error) throw error;
      const parsed = allocateToCentersResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("allocate_to_centers", parsed);
        throw new Error("Resposta inválida ao alocar centros.");
      }
      return parsed.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cost_centers"] });
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

// ─── CEN-05: Client-side CSV helper ─────────────────────────────

function csvSafe(value: string): string {
  const escaped = value.replace(/"/g, '""');
  if (/^[=+\-@]/.test(escaped)) {
    return `"\t${escaped}"`;
  }
  return `"${escaped}"`;
}

export function exportToCsv(data: CenterExport): string {
  const header =
    "Data,Tipo,Descrição,Valor Total,% Centro,Valor Centro,Conta Contábil,Grupo,Pago";
  const rows = data.transactions.map((tx) =>
    [
      tx.date,
      tx.type === "income" ? "Receita" : "Despesa",
      csvSafe(tx.description || ""),
      tx.amount.toFixed(2),
      tx.center_percentage.toFixed(1),
      tx.center_amount.toFixed(2),
      csvSafe(tx.coa_name),
      tx.group_type,
      tx.is_paid ? "Sim" : "Não",
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

export function downloadFile(
  content: string,
  filename: string,
  type: string
) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
