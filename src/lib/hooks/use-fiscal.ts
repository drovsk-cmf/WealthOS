/**
 * WealthOS - Fiscal Hooks (Phase 7)
 *
 * React Query hooks for fiscal module.
 * Stories: FIS-01 (rendimentos), FIS-02 (deduções), FIS-03 (bens/dívidas),
 *          FIS-04 (comprovantes), FIS-05 (relatório), FIS-06 (navegação anos)
 *
 * BONUS: Tax provisioning intelligence (multiple income sources scenario)
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// ─── Types ──────────────────────────────────────────────────────

export interface FiscalTreatmentGroup {
  tax_treatment: string;
  group_type: string;
  total_revenue: number;
  total_expense: number;
  entry_count: number;
  accounts: {
    coa_code: string;
    coa_name: string;
    total: number;
  }[];
}

export interface FiscalReportTotals {
  total_tributavel_revenue: number;
  total_isento_revenue: number;
  total_dedutivel_expense: number;
  total_transactions: number;
}

export interface FiscalReport {
  year: number;
  period_start: string;
  period_end: string;
  by_treatment: FiscalTreatmentGroup[];
  totals: FiscalReportTotals;
}

export interface FiscalProjection {
  year: number;
  months_elapsed: number;
  months_remaining: number;
  ytd_taxable_income: number;
  ytd_deductible_expenses: number;
  projected_annual_income: number;
  projected_annual_deductible: number;
  taxable_base: number;
  estimated_annual_tax: number;
  annual_reduction_applied: number;
  ytd_irrf_withheld: number;
  tax_gap: number;
  monthly_provision: number;
  disclaimer: string;
  status?: string;
  message?: string;
}

export interface TaxParameter {
  id: string;
  parameter_type: string;
  valid_from: string;
  valid_until: string | null;
  brackets: unknown[];
  limits: Record<string, unknown>;
  source_references: { source: string; url: string; date: string }[];
  updated_by: string;
}

// ─── Labels ─────────────────────────────────────────────────────

export const TAX_TREATMENT_LABELS: Record<string, string> = {
  tributavel: "Tributável",
  isento: "Isento / Não tributável",
  exclusivo_fonte: "Tributação exclusiva na fonte",
  ganho_capital: "Ganho de capital",
  dedutivel_integral: "Dedutível (integral)",
  dedutivel_limitado: "Dedutível (limitado)",
  nao_dedutivel: "Não dedutível",
  variavel: "Variável",
};

export const TAX_TREATMENT_COLORS: Record<string, string> = {
  tributavel: "#EF4444",
  isento: "#10B981",
  exclusivo_fonte: "#F59E0B",
  ganho_capital: "#8B5CF6",
  dedutivel_integral: "#3B82F6",
  dedutivel_limitado: "#06B6D4",
  nao_dedutivel: "#6B7280",
  variavel: "#EC4899",
};

// ─── Queries ────────────────────────────────────────────────────

/** FIS-01 to FIS-04, FIS-06: Fiscal report by tax_treatment */
export function useFiscalReport(year?: number) {
  return useQuery({
    queryKey: ["fiscal", "report", year],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<FiscalReport> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("get_fiscal_report", {
        p_user_id: user.id,
        ...(year !== undefined && { p_year: year }),
      });
      if (error) throw error;
      return data as unknown as FiscalReport;
    },
  });
}

/** TAX PROVISIONING INTELLIGENCE */
export function useFiscalProjection(year?: number) {
  return useQuery({
    queryKey: ["fiscal", "projection", year],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<FiscalProjection> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("get_fiscal_projection", {
        p_user_id: user.id,
        ...(year !== undefined && { p_year: year }),
      });
      if (error) throw error;
      return data as unknown as FiscalProjection;
    },
  });
}

/** Tax parameters for reference display */
export function useTaxParameters() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["fiscal", "parameters"],
    staleTime: 60 * 60 * 1000, // 1 hour
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tax_parameters")
        .select("*")
        .order("parameter_type")
        .order("valid_from", { ascending: false });
      if (error) throw error;
      return data as TaxParameter[];
    },
  });
}
