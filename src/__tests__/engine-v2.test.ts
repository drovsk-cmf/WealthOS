/**
 * Tests for Financial Engine v2 (State Machine + Dependency Graph)
 *
 * Covers:
 * - Zod schema validation (engineV2Schema)
 * - State helper functions (getStateInfo, classificationLabel, etc.)
 * - Edge cases (SEM_DADOS, extremes, conflict states)
 */

import { z } from "zod";
import { engineV2Schema } from "@/lib/schemas/rpc";
import {
  getStateInfo,
  classificationLabel,
  formatClassificationValue,
  classificationColor,
  ruleLabel,
} from "@/lib/hooks/use-engine-v2";
import type { EngineState, EngineClassification } from "@/lib/hooks/use-engine-v2";

// ─── Valid test data ───────────────────────────────────────

const validSemDados: z.infer<typeof engineV2Schema> = {
  state: "SEM_DADOS",
  classification_inputs: {
    reserve_ratio: 0, debt_stress: 0, savings_rate: 0,
    fi_progress: 0, income_cv: 0, base_months: 3, reserve_target: 0,
  },
  metrics: {
    avg_income: 0, avg_expense: 0, surplus: 0, burn_rate: 0,
    liquid_assets: 0, illiquid_assets: 0, total_debt: 0,
    debt_uncollateralized: 0, net_worth: 0, wacc_monthly: 0,
    hhi: 0, hhi_top_item: "", hhi_top_pct: 0,
    cdi_monthly: 1.2, cdi_annual: 15.4, months_analyzed: 0,
  },
  actions: [],
  actions_count: 0,
};

const validOtimizacao: z.infer<typeof engineV2Schema> = {
  state: "OTIMIZACAO",
  classification_inputs: {
    reserve_ratio: 1.32, debt_stress: 0.1, savings_rate: 18.5,
    fi_progress: 0.12, income_cv: 0.08, base_months: 3, reserve_target: 19440,
  },
  metrics: {
    avg_income: 12000, avg_expense: 9780, surplus: 2220, burn_rate: 9780,
    liquid_assets: 25000, illiquid_assets: 300000, total_debt: 280000,
    debt_uncollateralized: 5000, net_worth: 45000, wacc_monthly: 1.5,
    hhi: 0.65, hhi_top_item: "Apartamento Centro", hhi_top_pct: 78.2,
    cdi_monthly: 1.2, cdi_annual: 15.4, months_analyzed: 6,
  },
  actions: [
    { priority: 1, rule: "R02", action: "Quitar Cartão Nubank (3.5% a.m.)", impact_monthly: 175, rationale: "Custo acima do CDI." },
    { priority: 2, rule: "HHI", action: "Diversificar patrimônio", impact_monthly: 0, rationale: "HHI 0.65 (concentrado)." },
  ],
  actions_count: 2,
};

// ─── Schema Validation ─────────────────────────────────────

describe("engineV2Schema", () => {
  it("accepts SEM_DADOS state", () => {
    expect(engineV2Schema.safeParse(validSemDados).success).toBe(true);
  });

  it("accepts OTIMIZACAO with actions", () => {
    expect(engineV2Schema.safeParse(validOtimizacao).success).toBe(true);
  });

  it("accepts all 6 states", () => {
    const states: EngineState[] = ["SEM_DADOS", "CRISE", "SOBREVIVENCIA", "ESTABILIZACAO", "OTIMIZACAO", "CRESCIMENTO"];
    for (const s of states) {
      const data = { ...validSemDados, state: s };
      expect(engineV2Schema.safeParse(data).success).toBe(true);
    }
  });

  it("rejects invalid state", () => {
    const data = { ...validSemDados, state: "INVALID" };
    expect(engineV2Schema.safeParse(data).success).toBe(false);
  });

  it("rejects missing classification_inputs", () => {
    const { classification_inputs: _, ...incomplete } = validSemDados;
    expect(engineV2Schema.safeParse(incomplete).success).toBe(false);
  });

  it("rejects missing metrics", () => {
    const { metrics: _, ...incomplete } = validSemDados;
    expect(engineV2Schema.safeParse(incomplete).success).toBe(false);
  });

  it("accepts empty actions array", () => {
    expect(engineV2Schema.safeParse(validSemDados).success).toBe(true);
    expect(validSemDados.actions).toHaveLength(0);
  });

  it("accepts multiple actions", () => {
    const data = {
      ...validOtimizacao,
      actions: [
        ...validOtimizacao.actions,
        { priority: 3, rule: "SR", action: "Elevar poupança", impact_monthly: 500, rationale: "Teste" },
      ],
      actions_count: 3,
    };
    expect(engineV2Schema.safeParse(data).success).toBe(true);
  });

  it("validates action shape", () => {
    const badAction = { ...validOtimizacao, actions: [{ priority: 1 }] };
    expect(engineV2Schema.safeParse(badAction).success).toBe(false);
  });

  it("accepts negative values (surplus, net_worth)", () => {
    const data = {
      ...validOtimizacao,
      state: "CRISE" as const,
      metrics: { ...validOtimizacao.metrics, surplus: -3000, net_worth: -50000 },
    };
    expect(engineV2Schema.safeParse(data).success).toBe(true);
  });
});

// ─── getStateInfo ──────────────────────────────────────────

describe("getStateInfo", () => {
  it("returns info for all 6 states", () => {
    const states: EngineState[] = ["SEM_DADOS", "CRISE", "SOBREVIVENCIA", "ESTABILIZACAO", "OTIMIZACAO", "CRESCIMENTO"];
    for (const s of states) {
      const info = getStateInfo(s);
      expect(info.label).toBeTruthy();
      expect(info.description).toBeTruthy();
      expect(info.color).toBeTruthy();
      expect(info.icon).toBeTruthy();
    }
  });

  it("CRISE has ember color", () => {
    expect(getStateInfo("CRISE").color).toContain("ember");
  });

  it("CRESCIMENTO has teal color", () => {
    expect(getStateInfo("CRESCIMENTO").color).toContain("teal");
  });

  it("SEM_DADOS has muted color", () => {
    expect(getStateInfo("SEM_DADOS").color).toContain("muted");
  });
});

// ─── classificationLabel ───────────────────────────────────

describe("classificationLabel", () => {
  it("maps all known keys", () => {
    const keys: (keyof EngineClassification)[] = [
      "reserve_ratio", "debt_stress", "savings_rate",
      "fi_progress", "income_cv", "base_months", "reserve_target",
    ];
    for (const k of keys) {
      expect(classificationLabel(k).length).toBeGreaterThan(0);
    }
  });
});

// ─── formatClassificationValue ─────────────────────────────

describe("formatClassificationValue", () => {
  it("formats reserve_ratio as decimal", () => {
    expect(formatClassificationValue("reserve_ratio", 1.32)).toBe("1.32");
  });

  it("formats reserve_ratio 999 as infinity", () => {
    expect(formatClassificationValue("reserve_ratio", 999)).toBe("∞");
  });

  it("formats savings_rate as percentage", () => {
    expect(formatClassificationValue("savings_rate", 18.5)).toBe("18.5%");
  });

  it("formats fi_progress as percentage (x100)", () => {
    expect(formatClassificationValue("fi_progress", 0.12)).toBe("12.0%");
  });

  it("formats income_cv with 3 decimals", () => {
    expect(formatClassificationValue("income_cv", 0.245)).toBe("0.245");
  });

  it("formats base_months with unit", () => {
    expect(formatClassificationValue("base_months", 6)).toBe("6 meses");
  });

  it("formats reserve_target as BRL", () => {
    const result = formatClassificationValue("reserve_target", 19440);
    expect(result).toContain("19");
    expect(result).toContain("R$");
  });
});

// ─── classificationColor ───────────────────────────────────

describe("classificationColor", () => {
  it("reserve_ratio >= 1.5 is green", () => {
    expect(classificationColor("reserve_ratio", 2.0)).toContain("verdant");
  });

  it("reserve_ratio < 0.5 is red", () => {
    expect(classificationColor("reserve_ratio", 0.3)).toContain("ember");
  });

  it("debt_stress <= 0.3 is green", () => {
    expect(classificationColor("debt_stress", 0.1)).toContain("verdant");
  });

  it("debt_stress > 1.5 is red", () => {
    expect(classificationColor("debt_stress", 2.0)).toContain("ember");
  });

  it("savings_rate >= 20 is green", () => {
    expect(classificationColor("savings_rate", 25)).toContain("verdant");
  });

  it("savings_rate < 0 is red", () => {
    expect(classificationColor("savings_rate", -5)).toContain("ember");
  });
});

// ─── ruleLabel ─────────────────────────────────────────────

describe("ruleLabel", () => {
  it("maps known rules", () => {
    expect(ruleLabel("R02")).toContain("cara");
    expect(ruleLabel("R07")).toContain("emergência");
    expect(ruleLabel("HHI")).toContain("patrimonial");
    expect(ruleLabel("FI")).toContain("Independ");
    expect(ruleLabel("R02-CONFLICT")).toContain("usurária");
  });

  it("returns raw ID for unknown rules", () => {
    expect(ruleLabel("R99-UNKNOWN")).toBe("R99-UNKNOWN");
  });
});
