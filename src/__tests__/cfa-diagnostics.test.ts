/**
 * Tests for CFA Diagnostics (Camada A + B)
 *
 * Covers:
 * - Zod schema validation (cfaDiagnosticsSchema)
 * - Helper functions (explanations, labels)
 * - Hook shape contract
 * - Edge cases (zeros, negatives, extremes)
 */

import { z } from "zod";
import { cfaDiagnosticsSchema } from "@/lib/schemas/rpc";
import {
  savingsRateExplanation,
  hhiExplanation,
  waccExplanation,
  debtToEquityExplanation,
  volatilityExplanation,
  dupontExplanation,
  warningLabel,
} from "@/lib/hooks/use-cfa-diagnostics";
import type { CfaDiagnostics } from "@/lib/hooks/use-cfa-diagnostics";

// ─── Schema Validation ─────────────────────────────────────

describe("cfaDiagnosticsSchema", () => {
  const validData: z.infer<typeof cfaDiagnosticsSchema> = {
    savings_rate: { value: 25.3, monthly_surplus: 3200, avg_income: 12600, avg_expense: 9400, months_analyzed: 6 },
    patrimony_hhi: { value: 0.2345, concentration: "moderate", top_item: "Nubank", top_pct: 45.2, total_patrimony: 150000 },
    wacc_personal: { value: 2.1, debt_count: 3, total_debt: 45000 },
    debt_to_equity: { value: 0.428, total_debt: 45000, net_worth: 105000 },
    working_capital: { value: 85000, current_assets: 100000, current_liabilities_30d: 15000 },
    breakeven: { monthly_value: 6500, fixed_expenses: 5200, variable_expenses: 4200, variable_pct: 44.7 },
    income_volatility: { cv: 0.22, mean: 12600, std_dev: 2772, months_analyzed: 12, risk_level: "moderate" },
    dupont_personal: { savings_margin: 0.254, asset_turnover: 1.008, equity_multiplier: 1.428, roe: 0.3656 },
    category_trends: [
      { cname: "Alimentação", color: "#2F7A68", m1: 1200, m2: 1350, m3: 1500, trend_pct: 25.0, direction: "up" },
    ],
    warning_signs: { burn_rising: false, nw_declining: false, runway_shrinking: false, savings_negative: false, count: 0 },
    monthly_history: [
      { month: "2026-01-01", income: 12000, expense: 9000, savings_rate: 25.0, net_worth: 100000, burn_rate: 9000, runway: 11.1 },
    ],
  };

  it("accepts valid complete data", () => {
    expect(cfaDiagnosticsSchema.safeParse(validData).success).toBe(true);
  });

  it("accepts empty arrays for trends and history", () => {
    const data = { ...validData, category_trends: [], monthly_history: [] };
    expect(cfaDiagnosticsSchema.safeParse(data).success).toBe(true);
  });

  it("accepts all concentration levels", () => {
    for (const c of ["critical", "high", "moderate", "diversified"] as const) {
      const data = { ...validData, patrimony_hhi: { ...validData.patrimony_hhi, concentration: c } };
      expect(cfaDiagnosticsSchema.safeParse(data).success).toBe(true);
    }
  });

  it("accepts all risk levels", () => {
    for (const r of ["critical", "high", "moderate", "low"] as const) {
      const data = { ...validData, income_volatility: { ...validData.income_volatility, risk_level: r } };
      expect(cfaDiagnosticsSchema.safeParse(data).success).toBe(true);
    }
  });

  it("accepts all trend directions", () => {
    for (const d of ["up", "down", "stable"] as const) {
      const data = { ...validData, category_trends: [{ ...validData.category_trends[0], direction: d }] };
      expect(cfaDiagnosticsSchema.safeParse(data).success).toBe(true);
    }
  });

  it("rejects invalid concentration", () => {
    const data = { ...validData, patrimony_hhi: { ...validData.patrimony_hhi, concentration: "unknown" } };
    expect(cfaDiagnosticsSchema.safeParse(data).success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const { savings_rate: _, ...incomplete } = validData;
    expect(cfaDiagnosticsSchema.safeParse(incomplete).success).toBe(false);
  });

  it("accepts warning_signs with all true", () => {
    const data = {
      ...validData,
      warning_signs: { burn_rising: true, nw_declining: true, runway_shrinking: true, savings_negative: true, count: 4 },
    };
    expect(cfaDiagnosticsSchema.safeParse(data).success).toBe(true);
  });

  it("accepts zero values everywhere", () => {
    const zeros: z.infer<typeof cfaDiagnosticsSchema> = {
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
    expect(cfaDiagnosticsSchema.safeParse(zeros).success).toBe(true);
  });
});

// ─── Savings Rate Explanation ──────────────────────────────

describe("savingsRateExplanation", () => {
  it("returns Excelente for 30%+", () => {
    const r = savingsRateExplanation(35);
    expect(r.label).toBe("Excelente");
    expect(r.color).toContain("verdant");
  });

  it("returns Saudável for 20-29%", () => {
    expect(savingsRateExplanation(25).label).toBe("Saudável");
  });

  it("returns Atenção for 10-19%", () => {
    expect(savingsRateExplanation(15).label).toBe("Atenção");
  });

  it("returns Crítico for 1-9%", () => {
    const r = savingsRateExplanation(5);
    expect(r.label).toBe("Crítico");
    expect(r.color).toContain("ember");
  });

  it("returns Negativo for 0 or negative", () => {
    expect(savingsRateExplanation(0).label).toBe("Negativo");
    expect(savingsRateExplanation(-10).label).toBe("Negativo");
  });
});

// ─── HHI Explanation ───────────────────────────────────────

describe("hhiExplanation", () => {
  it("critical for HHI > 0.5", () => {
    expect(hhiExplanation(0.6, "Imóvel", 78)).toContain("crítica");
  });

  it("high for 0.25 < HHI <= 0.5", () => {
    expect(hhiExplanation(0.35, "Nubank", 55)).toContain("alta");
  });

  it("moderate for 0.15 < HHI <= 0.25", () => {
    expect(hhiExplanation(0.2, "CDB", 40)).toContain("moderada");
  });

  it("diversified for HHI <= 0.15", () => {
    expect(hhiExplanation(0.1, "CDB", 20)).toContain("diversificado");
  });
});

// ─── WACC Explanation ──────────────────────────────────────

describe("waccExplanation", () => {
  it("handles zero (no debts)", () => {
    expect(waccExplanation(0)).toContain("Sem dívidas");
  });

  it("handles high WACC", () => {
    expect(waccExplanation(3.5)).toContain("Muito acima");
  });

  it("handles low WACC", () => {
    expect(waccExplanation(0.5)).toContain("Abaixo");
  });
});

// ─── D/E Explanation ───────────────────────────────────────

describe("debtToEquityExplanation", () => {
  it("zero means no leverage", () => {
    expect(debtToEquityExplanation(0)).toContain("Sem alavancagem");
  });

  it("< 0.3 is conservative", () => {
    expect(debtToEquityExplanation(0.2)).toContain("conservadora");
  });

  it("0.3-0.6 is moderate", () => {
    expect(debtToEquityExplanation(0.4)).toContain("moderada");
  });

  it("0.6-1.0 is elevated", () => {
    expect(debtToEquityExplanation(0.8)).toContain("elevada");
  });

  it(">= 1.0 is critical", () => {
    expect(debtToEquityExplanation(1.5)).toContain("crítica");
  });
});

// ─── Volatility Explanation ────────────────────────────────

describe("volatilityExplanation", () => {
  it("critical for CV > 0.5", () => {
    expect(volatilityExplanation(0.6)).toContain("crítica");
  });

  it("high for 0.3 < CV <= 0.5", () => {
    expect(volatilityExplanation(0.4)).toContain("alta");
  });

  it("moderate for 0.15 < CV <= 0.3", () => {
    expect(volatilityExplanation(0.2)).toContain("moderada");
  });

  it("low for CV <= 0.15", () => {
    expect(volatilityExplanation(0.1)).toContain("estável");
  });
});

// ─── DuPont Explanation ────────────────────────────────────

describe("dupontExplanation", () => {
  it("includes margin percentage", () => {
    const d = { savings_margin: 0.25, asset_turnover: 1.0, equity_multiplier: 1.2, roe: 0.3 };
    expect(dupontExplanation(d)).toContain("25.0%");
  });

  it("handles negative margin", () => {
    const d = { savings_margin: -0.1, asset_turnover: 0, equity_multiplier: 0, roe: 0 };
    expect(dupontExplanation(d)).toContain("negativa");
  });

  it("flags leverage > 1.5", () => {
    const d = { savings_margin: 0.2, asset_turnover: 1.0, equity_multiplier: 2.0, roe: 0.4 };
    expect(dupontExplanation(d)).toContain("alavancado");
  });
});

// ─── Warning Labels ────────────────────────────────────────

describe("warningLabel", () => {
  it("maps burn_rising", () => {
    expect(warningLabel("burn_rising")).toContain("Gastos crescendo");
  });

  it("maps nw_declining", () => {
    expect(warningLabel("nw_declining")).toContain("Patrimônio caindo");
  });

  it("maps runway_shrinking", () => {
    expect(warningLabel("runway_shrinking")).toContain("Fôlego");
  });

  it("maps savings_negative", () => {
    expect(warningLabel("savings_negative")).toContain("Gastando mais");
  });
});
