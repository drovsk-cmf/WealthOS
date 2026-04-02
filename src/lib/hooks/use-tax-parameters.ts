/**
 * Oniefy - Tax Parameters Hook (E50)
 *
 * Fetches tax_parameters from Supabase for the requested year.
 * Returns typed parameter sets for IRPF, INSS, capital gains, etc.
 * Caches aggressively (parameters change at most once per year).
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { TaxParameterSet, TaxBracket, TaxLimits } from "@/lib/tax/types";

interface TaxParametersBundle {
  irpfMonthly: TaxParameterSet;
  irpfAnnual: TaxParameterSet;
  inssEmployee: TaxParameterSet;
  minimumWage: TaxParameterSet;
  capitalGains: TaxParameterSet;
  year: number;
}

/**
 * Fetch all tax parameters valid for a given date.
 * Returns a bundle with typed parameter sets for each calculation type.
 */
export function useTaxParameters(year?: number) {
  const supabase = createClient();
  const targetYear = year ?? new Date().getFullYear();
  // Use mid-year date for parameter lookup (avoids edge cases at year boundaries)
  const referenceDate = `${targetYear}-06-15`;

  return useQuery<TaxParametersBundle>({
    queryKey: ["tax_parameters", targetYear],
    staleTime: 1000 * 60 * 60 * 24, // 24h cache (params change at most yearly)
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tax_parameters")
        .select("parameter_type, valid_from, valid_until, brackets, limits, source_references")
        .or(`valid_until.is.null,valid_until.gte.${referenceDate}`)
        .lte("valid_from", referenceDate)
        .order("valid_from", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error(`Nenhum parâmetro fiscal encontrado para ${targetYear}`);
      }

      // Pick the most recent parameter set for each type
      const byType = new Map<string, TaxParameterSet>();
      for (const row of data) {
        if (!byType.has(row.parameter_type)) {
          byType.set(row.parameter_type, {
            parameter_type: row.parameter_type,
            valid_from: row.valid_from,
            valid_until: row.valid_until,
            brackets: (row.brackets ?? []) as unknown as TaxBracket[],
            limits: (row.limits ?? {}) as unknown as TaxLimits,
          });
        }
      }

      const get = (type: string): TaxParameterSet => {
        const p = byType.get(type);
        if (!p) throw new Error(`Parâmetro fiscal '${type}' não encontrado para ${targetYear}`);
        return p;
      };

      return {
        irpfMonthly: get("irpf_monthly"),
        irpfAnnual: get("irpf_annual"),
        inssEmployee: get("inss_employee"),
        minimumWage: get("minimum_wage"),
        capitalGains: get("capital_gains"),
        year: targetYear,
      };
    },
  });
}

/**
 * Shortcut: fetch only minimum wage value for a year.
 */
export function useMinimumWage(year?: number) {
  const { data, ...rest } = useTaxParameters(year);
  return {
    ...rest,
    data: data?.minimumWage.limits.value ?? null,
  };
}
