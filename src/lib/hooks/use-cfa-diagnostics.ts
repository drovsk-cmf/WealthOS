/**
 * Oniefy - CFA Diagnostics Hook
 *
 * React Query hook for get_cfa_diagnostics RPC.
 * Returns 11 financial metrics: 6 Camada A (diagnósticos) + 5 Camada B (análises temporais).
 *
 * Conceitos CFA: Savings Rate, HHI (Markowitz), WACC, D/E, Working Capital,
 *                Breakeven, Income CV, DuPont Pessoal, Category Trends,
 *                Warning Signs (FRA R29), Monthly History.
 *
 * Ref: CFA-ONIEFY-MAPPING.md §2-3, PENDENCIAS-FUTURAS Camada A+B
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getCachedUserId } from "@/lib/supabase/cached-auth";
import { cfaDiagnosticsSchema, logSchemaError } from "@/lib/schemas/rpc";
import type { z } from "zod";

// ─── Types ─────────────────────────────────────────────────

export type CfaDiagnostics = z.infer<typeof cfaDiagnosticsSchema>;

export type ConcentrationLevel = "critical" | "high" | "moderate" | "diversified";
export type VolatilityLevel = "critical" | "high" | "moderate" | "low";
export type TrendDirection = "up" | "down" | "stable";

export interface CategoryTrendItem {
  cid?: string;
  cname: string;
  color?: string | null;
  m1: number;
  m2: number;
  m3: number;
  biggest?: number;
  trend_pct: number;
  direction: TrendDirection;
}

export interface WarningSignsData {
  burn_rising: boolean;
  nw_declining: boolean;
  runway_shrinking: boolean;
  savings_negative: boolean;
  count: number;
}

// ─── Empty state ───────────────────────────────────────────

const EMPTY_DIAGNOSTICS: CfaDiagnostics = {
  savings_rate: { value: 0, monthly_surplus: 0, avg_income: 0, avg_expense: 0, months_analyzed: 0 },
  patrimony_hhi: { value: 0, concentration: "diversified", top_item: "", top_pct: 0, total_patrimony: 0 },
  wacc_personal: { value: 0, debt_count: 0, total_debt: 0 },
  debt_to_equity: { value: 0, total_debt: 0, net_worth: 0 },
  working_capital: { value: 0, current_assets: 0, current_liabilities_30d: 0 },
  breakeven: { monthly_value: 0, fixed_expenses: 0, variable_expenses: 0, variable_pct: 0 },
  income_volatility: { cv: 0, mean: 0, std_dev: 0, months_analyzed: 0, risk_level: "low" },
  dupont_personal: { savings_margin: 0, asset_turnover: 0, equity_multiplier: 0, roe: 0 },
  category_trends: [],
  warning_signs: { burn_rising: false, nw_declining: false, runway_shrinking: false, savings_negative: false, count: 0 },
  monthly_history: [],
};

// ─── Hook ──────────────────────────────────────────────────

/**
 * Fetches CFA diagnostics (11 financial metrics).
 * staleTime: 10 min (data changes slowly, RPC is moderately expensive).
 */
export function useCfaDiagnostics() {
  return useQuery({
    queryKey: ["cfa", "diagnostics"],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<CfaDiagnostics> => {
      const supabase = createClient();
      const userId = await getCachedUserId(supabase);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)(
        "get_cfa_diagnostics",
        { p_user_id: userId },
      );
      if (error) throw error;
      const parsed = cfaDiagnosticsSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_cfa_diagnostics", parsed);
        return EMPTY_DIAGNOSTICS;
      }
      return parsed.data;
    },
  });
}

// ─── Helpers ───────────────────────────────────────────────

/** Savings rate interpretation */
export function savingsRateExplanation(rate: number): { label: string; color: string; text: string } {
  if (rate >= 30) return { label: "Excelente", color: "text-verdant-500", text: `Taxa de poupança de ${rate}%. Acima de 30% coloca você na faixa de acumulação acelerada.` };
  if (rate >= 20) return { label: "Saudável", color: "text-verdant-500", text: `Taxa de poupança de ${rate}%. Entre 20-30% é o padrão recomendado para construção de patrimônio.` };
  if (rate >= 10) return { label: "Atenção", color: "text-burnished-500", text: `Taxa de poupança de ${rate}%. Abaixo de 20% limita a velocidade de acumulação. Revise despesas discricionárias.` };
  if (rate > 0) return { label: "Crítico", color: "text-ember-500", text: `Taxa de poupança de ${rate}%. Abaixo de 10% indica pouca margem para imprevistos.` };
  return { label: "Negativo", color: "text-ember-500", text: "Você está gastando mais do que ganha. Burn rate excede a receita." };
}

/** HHI interpretation */
export function hhiExplanation(hhi: number, topItem: string, topPct: number): string {
  if (hhi > 0.5) return `Concentração crítica: ${topItem} representa ${topPct}% do patrimônio. Se esse ativo sofrer perda, o impacto é desproporcional.`;
  if (hhi > 0.25) return `Concentração alta: ${topItem} representa ${topPct}% do patrimônio. Considere diversificar para reduzir risco de concentração.`;
  if (hhi > 0.15) return `Concentração moderada: ${topItem} é o maior item com ${topPct}%. Patrimônio razoavelmente distribuído.`;
  return `Patrimônio bem diversificado. Nenhum item domina a composição. HHI: ${hhi}.`;
}

/** WACC interpretation */
export function waccExplanation(wacc: number, cdiAnual?: number): string {
  const ref = cdiAnual ?? 14.25;
  const waccAnual = wacc * 12; // approximation if monthly
  if (wacc === 0) return "Sem dívidas com juros registradas.";
  if (waccAnual > ref * 1.5) return `Custo médio ponderado da dívida: ${wacc}% a.m. (~${waccAnual.toFixed(1)}% a.a.). Muito acima do CDI (${ref}%). Renegociação é prioridade.`;
  if (waccAnual > ref) return `Custo médio ponderado da dívida: ${wacc}% a.m. (~${waccAnual.toFixed(1)}% a.a.). Acima do CDI (${ref}%). Avalie portabilidade.`;
  return `Custo médio ponderado da dívida: ${wacc}% a.m. (~${waccAnual.toFixed(1)}% a.a.). Abaixo ou próximo do CDI (${ref}%). Custo controlado.`;
}

/** D/E interpretation */
export function debtToEquityExplanation(de: number): string {
  if (de === 0) return "Sem alavancagem. Todo o patrimônio é equity próprio.";
  if (de < 0.3) return `D/E de ${de}. Alavancagem conservadora. Boa capacidade de absorver choques.`;
  if (de < 0.6) return `D/E de ${de}. Alavancagem moderada. Monitorar se juros consomem mais de 15% da renda.`;
  if (de < 1.0) return `D/E de ${de}. Alavancagem elevada. Dívida se aproxima do valor do patrimônio líquido.`;
  return `D/E de ${de}. Alavancagem crítica: dívidas excedem o patrimônio líquido. Priorize desalavancagem.`;
}

/** Income volatility interpretation */
export function volatilityExplanation(cv: number): string {
  if (cv > 0.5) return `Volatilidade de renda crítica (CV ${cv}). Renda oscila mais de 50% entre meses. Reserva de emergência deve cobrir 6+ meses.`;
  if (cv > 0.3) return `Volatilidade de renda alta (CV ${cv}). Típico de profissional com renda variável. Reserva recomendada: 6 meses.`;
  if (cv > 0.15) return `Volatilidade de renda moderada (CV ${cv}). Alguma variação mensal, mas previsível. Reserva recomendada: 3-6 meses.`;
  return `Renda estável (CV ${cv}). Variação mínima entre meses. Reserva padrão de 3 meses é suficiente.`;
}

/** DuPont explanation */
export function dupontExplanation(d: CfaDiagnostics["dupont_personal"]): string {
  const parts: string[] = [];
  if (d.savings_margin > 0) parts.push(`Margem de poupança: ${(d.savings_margin * 100).toFixed(1)}%`);
  else parts.push("Margem de poupança negativa");
  parts.push(`Giro do ativo: ${d.asset_turnover.toFixed(2)}x`);
  if (d.equity_multiplier > 1.5) parts.push(`Multiplicador de equity: ${d.equity_multiplier.toFixed(2)}x (alavancado)`);
  else if (d.equity_multiplier > 0) parts.push(`Multiplicador de equity: ${d.equity_multiplier.toFixed(2)}x`);
  return parts.join(". ") + `.`;
}

/** Warning sign label */
export function warningLabel(key: keyof Omit<WarningSignsData, "count">): string {
  const labels: Record<string, string> = {
    burn_rising: "Gastos crescendo 3 meses seguidos",
    nw_declining: "Patrimônio caindo 3 meses seguidos",
    runway_shrinking: "Fôlego financeiro encolhendo",
    savings_negative: "Gastando mais que ganha (2+ de 3 meses)",
  };
  return labels[key] ?? key;
}
