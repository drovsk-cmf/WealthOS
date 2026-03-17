/**
 * Oniefy - Fiscal Hooks (Phase 7)
 *
 * React Query hooks for fiscal module.
 * Stories: FIS-01 (rendimentos), FIS-02 (deduções), FIS-03 (bens/dívidas),
 *          FIS-04 (comprovantes), FIS-05 (relatório), FIS-06 (navegação anos)
 *
 * BONUS: Tax provisioning intelligence (multiple income sources scenario)
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fiscalProjectionSchema, fiscalReportSchema, taxParameterSchema, logSchemaError } from "@/lib/schemas/rpc";
import { z } from "zod";
import { getCachedUserId } from "@/lib/supabase/cached-auth";

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
  tributavel: "#A64A45",
  isento: "#2F7A68",
  exclusivo_fonte: "#A97824",
  ganho_capital: "#6F6678",
  dedutivel_integral: "#56688F",
  dedutivel_limitado: "#56688F",
  nao_dedutivel: "#7E9487",
  variavel: "#A64A45",
};

// ─── Queries ────────────────────────────────────────────────────

/** FIS-01 to FIS-04, FIS-06: Fiscal report by tax_treatment */
export function useFiscalReport(year?: number) {
  return useQuery({
    queryKey: ["fiscal", "report", year],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<FiscalReport> => {
      const supabase = createClient();
      const userId = await getCachedUserId(supabase);
      const { data, error } = await supabase.rpc("get_fiscal_report", {
        p_user_id: userId,
        ...(year !== undefined && { p_year: year }),
      });
      if (error) throw error;
      const parsed = fiscalReportSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_fiscal_report", parsed);
        return {
          year: year ?? new Date().getFullYear(),
          period_start: "",
          period_end: "",
          by_treatment: [],
          totals: {
            total_tributavel_revenue: 0,
            total_isento_revenue: 0,
            total_dedutivel_expense: 0,
            total_transactions: 0,
          },
        };
      }
      return parsed.data;
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
      const userId = await getCachedUserId(supabase);
      const { data, error } = await supabase.rpc("get_fiscal_projection", {
        p_user_id: userId,
        ...(year !== undefined && { p_year: year }),
      });
      if (error) throw error;
      const parsed = fiscalProjectionSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_fiscal_projection", parsed);
        return {
          year: year ?? new Date().getFullYear(),
          months_elapsed: 0,
          months_remaining: 0,
          ytd_taxable_income: 0,
          ytd_deductible_expenses: 0,
          projected_annual_income: 0,
          projected_annual_deductible: 0,
          taxable_base: 0,
          estimated_annual_tax: 0,
          annual_reduction_applied: 0,
          ytd_irrf_withheld: 0,
          tax_gap: 0,
          monthly_provision: 0,
          disclaimer: "Dados indisponíveis no momento.",
          status: "error",
          message: "Resposta fiscal inválida.",
        };
      }
      return parsed.data;
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
        .select("id, parameter_type, valid_from, valid_until, brackets, limits, source_references, created_at")
        .order("parameter_type")
        .order("valid_from", { ascending: false });
      if (error) throw error;
      const parsed = z.array(taxParameterSchema).safeParse(data);
      if (!parsed.success) {
        logSchemaError("tax_parameters", parsed);
        return [];
      }
      return parsed.data;
    },
  });
}
