// Force module scope
export {};

/**
 * Tests: Motor JARVIS CFA - useJarvisScan hook + helper functions
 *
 * Covers:
 * - useJarvisScan: RPC call, schema validation, error handling, empty state
 * - sortFindings: severity ordering (critical > warning > info)
 * - getRuleLabel: all 11 rules + unknown fallback
 * - Schema validation: jarvisScanSchema with realistic payloads per rule
 *
 * Ref: CFA-ONIEFY-MAPPING.md §6, HANDOVER §30.10
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useJarvisScan,
  sortFindings,
  getRuleLabel,
  type JarvisFinding,
  type JarvisScanResult,
} from "@/lib/hooks/use-jarvis";
import { jarvisScanSchema, jarvisFindingSchema } from "@/lib/schemas/rpc";

// ─── Mocks ─────────────────────────────────────────────────────

const mockRpc = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    rpc: mockRpc,
  }),
}));

jest.mock("@/lib/supabase/cached-auth", () => ({
  getCachedUserId: jest.fn().mockResolvedValue("user-123"),
}));

// ─── Test fixtures ─────────────────────────────────────────────

const FINDING_R01: JarvisFinding = {
  rule_id: "R01",
  severity: "warning",
  title: '"Rico Invest" rende 0.29% a.m. (CDI: 1.20%)',
  description:
    'Retorno medio: R$ 43.33/mes (0.29% a.m.). CDI atual: 1.20% a.m. Classe: renda_fixa. No CDI renderia R$ 181.66/mes.',
  potential_savings_monthly: 138.33,
  affected_items: {
    account_id: "acc-invest",
    account_name: "Rico Invest",
    balance: 15130,
    yield_pct: 0.29,
    cdi_pct: 1.2,
    monthly_income: 43.33,
    investment_class: "renda_fixa",
    months_data: 3,
  },
};

const FINDING_R04: JarvisFinding = {
  rule_id: "R04",
  severity: "info",
  title: '"Civic 2022": TCO R$ 1966.67/mes',
  description:
    'Custo total de propriedade: R$ 1966.67/mes. Depreciacao: R$ 1000.00/mes. Despesas operacionais: R$ 966.67/mes (7 lancamentos em 3 meses). Peso na renda: 16.0%.',
  potential_savings_monthly: 0,
  affected_items: {
    asset_id: "asset-car",
    asset_name: "Civic 2022",
    category: "vehicle_auto",
    current_value: 80000,
    monthly_depreciation: 1000,
    monthly_expenses: 966.67,
    total_tco: 1966.67,
    months_data: 3,
    income_pct: 16.0,
  },
};

const FINDING_R02: JarvisFinding = {
  rule_id: "R02",
  severity: "critical",
  title: '"Emprestimo Pessoal" a 3.50% a.m.',
  description:
    "Divida de R$ 25000.00 com taxa de 3.50% a.m. (pre). Referencia CDI+5pp: 1.55% a.m. Candidata a renegociacao ou portabilidade.",
  potential_savings_monthly: 485.25,
  affected_items: {
    account_id: "acc-1",
    account_name: "Emprestimo Pessoal",
    balance: 25000,
    rate: 3.5,
    rate_type: "pre",
    threshold: 1.55,
    cdi_monthly: 1.2,
  },
};

const FINDING_R03: JarvisFinding = {
  rule_id: "R03",
  severity: "warning",
  title: '3 assinaturas em "Streaming"',
  description:
    '3 assinaturas na categoria "Streaming", somando R$ 115.70/mes',
  potential_savings_monthly: 57.85,
  affected_items: [
    { description: "Netflix", amount: 55.9 },
    { description: "Disney+", amount: 34.9 },
    { description: "HBO Max", amount: 24.9 },
  ],
};

const FINDING_R05: JarvisFinding = {
  rule_id: "R05",
  severity: "critical",
  title: '"Nubank Cartao": juros de R$ 630.00/mes',
  description:
    "Saldo devedor R$ 4500.00 a 14.00% a.m. Se mantido: +R$ 2156.28 em 3m, +R$ 6437.29 em 6m, +R$ 21267.16 em 12m.",
  potential_savings_monthly: 630.0,
  affected_items: {
    account_id: "acc-2",
    account_name: "Nubank Cartao",
    balance: 4500,
    rate: 14,
    cost_3m: 2156.28,
    cost_6m: 6437.29,
    cost_12m: 21267.16,
  },
};

const FINDING_R06: JarvisFinding = {
  rule_id: "R06",
  severity: "warning",
  title: '"Delivery" em escalada',
  description:
    "Crescimento de +30.0% e depois +30.8% em 3 meses consecutivos. Atual: R$ 850.00/mes (era R$ 500.00)",
  potential_savings_monthly: 350.0,
  affected_items: {
    category: "Delivery",
    current: 850,
    baseline: 500,
    growth_m1: 30.0,
    growth_m2: 30.8,
  },
};

const FINDING_R07: JarvisFinding = {
  rule_id: "R07",
  severity: "warning",
  title: "Runway de 3.2 meses",
  description:
    "Burn rate: R$ 8166.67/mes. Reserva liquida (T1+T2): R$ 26500.00. Meta minima: 6 meses = R$ 49000.02",
  potential_savings_monthly: 0,
  affected_items: {
    tier1_total: 11500,
    tier2_total: 15000,
    burn_rate: 8166.67,
    runway_months: 3.2,
  },
};

const FINDING_R08: JarvisFinding = {
  rule_id: "R08",
  severity: "info",
  title: '"Civic 2022" perde R$ 400.00/mes',
  description:
    "Depreciacao mensal: R$ 400.00. Rendimento mensal: R$ 0. Perda liquida: R$ 400.00/mes (valor atual: R$ 80000.00)",
  potential_savings_monthly: 400.0,
  affected_items: {
    asset_id: "asset-1",
    asset_name: "Civic 2022",
    category: "vehicle_auto",
    current_value: 80000,
    depreciation: 400,
    income: 0,
  },
};

const FINDING_R09: JarvisFinding = {
  rule_id: "R09",
  severity: "warning",
  title: '95.0% da renda em "Salario CLT"',
  description:
    'Nos ultimos 6 meses, R$ 34200.00 de R$ 36000.00 vieram de "Salario CLT". Se essa fonte parar, o impacto e imediato.',
  potential_savings_monthly: 0,
};

const FINDING_R10: JarvisFinding = {
  rule_id: "R10",
  severity: "warning",
  title: "3 meses com fluxo negativo",
  description:
    "3 dos ultimos 6 meses tiveram despesas > receitas. Saldo acumulado (3 meses): R$ -1500.00",
  potential_savings_monthly: 0,
  affected_items: [
    { month: "2026-02-01", income: 12000, expense: 13500, net: -1500 },
  ],
};

const FULL_SCAN_RESULT: JarvisScanResult = {
  scan_date: "2026-03-24T22:00:00.000000+00:00",
  findings_count: 10,
  findings: [
    FINDING_R01,
    FINDING_R02,
    FINDING_R03,
    FINDING_R04,
    FINDING_R05,
    FINDING_R06,
    FINDING_R07,
    FINDING_R08,
    FINDING_R09,
    FINDING_R10,
  ],
  summary: {
    total_potential_savings_monthly: 2661.43,
    projected_3m: 7984.29,
    projected_6m: 15968.58,
    projected_12m: 31937.16,
    critical_count: 2,
    warning_count: 5,
    info_count: 3,
  },
  solvency: {
    tier1_total: 11500,
    tier2_total: 15000,
    tier3_total: 80000,
    tier4_total: 0,
    total_patrimony: 106500,
    burn_rate: 8166.67,
    runway_months: 3.2,
    lcr: 0.54,
    months_analyzed: 3,
  },
};

const EMPTY_SCAN_RESULT = {
  scan_date: "2026-03-24T22:00:00.000000+00:00",
  findings_count: 0,
  findings: [],
  summary: {
    total_potential_savings_monthly: 0,
    projected_3m: 0,
    projected_6m: 0,
    projected_12m: 0,
    critical_count: 0,
    warning_count: 0,
    info_count: 0,
  },
  solvency: {
    tier1_total: 0,
    tier2_total: 0,
    tier3_total: 0,
    tier4_total: 0,
    total_patrimony: 0,
    burn_rate: 0,
    runway_months: 999,
    lcr: 999,
    months_analyzed: 0,
  },
};

// ─── Helpers ───────────────────────────────────────────────────

function qc() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function wrap(client: QueryClient) {
  return function W({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

// ═══════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════

describe("sortFindings", () => {
  it("sorts critical → warning → info", () => {
    const unsorted: JarvisFinding[] = [
      FINDING_R06, // warning
      FINDING_R08, // info
      FINDING_R02, // critical
      FINDING_R07, // warning
      FINDING_R05, // critical
    ];
    const sorted = sortFindings(unsorted);

    expect(sorted[0].severity).toBe("critical");
    expect(sorted[1].severity).toBe("critical");
    expect(sorted[2].severity).toBe("warning");
    expect(sorted[3].severity).toBe("warning");
    expect(sorted[4].severity).toBe("info");
  });

  it("handles empty array", () => {
    expect(sortFindings([])).toEqual([]);
  });

  it("handles single item", () => {
    const result = sortFindings([FINDING_R03]);
    expect(result).toHaveLength(1);
    expect(result[0].rule_id).toBe("R03");
  });

  it("does not mutate original array", () => {
    const original = [FINDING_R08, FINDING_R02];
    const sorted = sortFindings(original);
    expect(original[0].rule_id).toBe("R08"); // unchanged
    expect(sorted[0].rule_id).toBe("R02"); // critical first
  });
});

describe("getRuleLabel", () => {
  const expectedLabels: Record<string, string> = {
    R01: "Retorno abaixo da TMA",
    R02: "Dívida cara",
    R03: "Assinaturas",
    R03b: "Peso das assinaturas",
    R04: "TCO de veículo",
    R05: "Espiral de cartão",
    R06: "Categoria em escalada",
    R07: "Reserva de emergência",
    R08: "Ativo depreciando",
    R09: "Concentração de renda",
    R10: "Fluxo negativo",
  };

  it.each(Object.entries(expectedLabels))(
    "returns '%s' for rule %s",
    (ruleId, label) => {
      expect(getRuleLabel(ruleId)).toBe(label);
    }
  );

  it("returns rule_id as fallback for unknown rules", () => {
    expect(getRuleLabel("R99")).toBe("R99");
    expect(getRuleLabel("UNKNOWN")).toBe("UNKNOWN");
  });
});

describe("jarvisFindingSchema", () => {
  it("validates R01 finding (investment yield)", () => {
    const result = jarvisFindingSchema.safeParse(FINDING_R01);
    expect(result.success).toBe(true);
  });

  it("validates R02 finding (debt with rate)", () => {
    const result = jarvisFindingSchema.safeParse(FINDING_R02);
    expect(result.success).toBe(true);
  });

  it("validates R03 finding (subscriptions with array items)", () => {
    const result = jarvisFindingSchema.safeParse(FINDING_R03);
    expect(result.success).toBe(true);
  });

  it("validates R04 finding (vehicle TCO)", () => {
    const result = jarvisFindingSchema.safeParse(FINDING_R04);
    expect(result.success).toBe(true);
  });

  it("validates R05 finding (credit card spiral)", () => {
    const result = jarvisFindingSchema.safeParse(FINDING_R05);
    expect(result.success).toBe(true);
  });

  it("validates R09 finding (no affected_items)", () => {
    const result = jarvisFindingSchema.safeParse(FINDING_R09);
    expect(result.success).toBe(true);
  });

  it("validates finding with null affected_items", () => {
    const finding = { ...FINDING_R09, affected_items: null };
    const result = jarvisFindingSchema.safeParse(finding);
    expect(result.success).toBe(true);
  });

  it("rejects invalid severity", () => {
    const bad = { ...FINDING_R02, severity: "urgent" };
    const result = jarvisFindingSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects missing rule_id", () => {
    const { rule_id: _, ...bad } = FINDING_R02;
    const result = jarvisFindingSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});

describe("jarvisScanSchema", () => {
  it("validates full scan result with 10 findings", () => {
    const result = jarvisScanSchema.safeParse(FULL_SCAN_RESULT);
    expect(result.success).toBe(true);
  });

  it("validates empty scan result", () => {
    const result = jarvisScanSchema.safeParse(EMPTY_SCAN_RESULT);
    expect(result.success).toBe(true);
  });

  it("validates scan with null solvency", () => {
    const scan = { ...EMPTY_SCAN_RESULT, solvency: null };
    const result = jarvisScanSchema.safeParse(scan);
    expect(result.success).toBe(true);
  });

  it("validates summary projections are consistent", () => {
    const result = jarvisScanSchema.safeParse(FULL_SCAN_RESULT);
    expect(result.success).toBe(true);
    if (result.success) {
      const s = result.data.summary;
      expect(s.projected_3m).toBeCloseTo(s.total_potential_savings_monthly * 3, 0);
      expect(s.projected_6m).toBeCloseTo(s.total_potential_savings_monthly * 6, 0);
      expect(s.projected_12m).toBeCloseTo(s.total_potential_savings_monthly * 12, 0);
    }
  });

  it("validates severity counts sum to findings count", () => {
    const result = jarvisScanSchema.safeParse(FULL_SCAN_RESULT);
    expect(result.success).toBe(true);
    if (result.success) {
      const s = result.data.summary;
      expect(s.critical_count + s.warning_count + s.info_count).toBe(
        result.data.findings_count
      );
    }
  });
});

describe("useJarvisScan", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns full scan data on success", async () => {
    mockRpc.mockResolvedValue({ data: FULL_SCAN_RESULT, error: null });

    const client = qc();
    const { result } = renderHook(() => useJarvisScan(), {
      wrapper: wrap(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.findings_count).toBe(10);
    expect(result.current.data?.summary.total_potential_savings_monthly).toBe(2661.43);
    expect(result.current.data?.summary.critical_count).toBe(2);
    expect(result.current.data?.findings).toHaveLength(10);
  });

  it("calls RPC with correct arguments", async () => {
    mockRpc.mockResolvedValue({ data: EMPTY_SCAN_RESULT, error: null });

    const client = qc();
    renderHook(() => useJarvisScan(), { wrapper: wrap(client) });

    await waitFor(() => expect(mockRpc).toHaveBeenCalled());
    expect(mockRpc).toHaveBeenCalledWith("get_jarvis_scan", {
      p_user_id: "user-123",
    });
  });

  it("returns empty state on RPC error", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Forbidden", code: "42501" },
    });

    const client = qc();
    const { result } = renderHook(() => useJarvisScan(), {
      wrapper: wrap(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it("returns empty scan on schema validation failure", async () => {
    mockRpc.mockResolvedValue({
      data: { garbage: true },
      error: null,
    });

    const client = qc();
    const { result } = renderHook(() => useJarvisScan(), {
      wrapper: wrap(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.findings_count).toBe(0);
    expect(result.current.data?.findings).toEqual([]);
  });

  it("handles empty findings gracefully", async () => {
    mockRpc.mockResolvedValue({ data: EMPTY_SCAN_RESULT, error: null });

    const client = qc();
    const { result } = renderHook(() => useJarvisScan(), {
      wrapper: wrap(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.findings_count).toBe(0);
    expect(result.current.data?.summary.total_potential_savings_monthly).toBe(0);
  });
});

// ─── Rule-specific data validation ─────────────────────────────

describe("Rule data contracts", () => {
  it("R01: yield below CDI with rate comparison", () => {
    const items = FINDING_R01.affected_items as Record<string, unknown>;
    expect(items).toHaveProperty("yield_pct");
    expect(items).toHaveProperty("cdi_pct");
    expect(items).toHaveProperty("investment_class");
    expect(items).toHaveProperty("months_data");
    // Yield should be below CDI for this finding to exist
    expect(items.yield_pct).toBeLessThan(items.cdi_pct as number);
    expect(FINDING_R01.potential_savings_monthly).toBeGreaterThan(0);
  });

  it("R02: affected_items contains rate comparison data", () => {
    const items = FINDING_R02.affected_items as Record<string, unknown>;
    expect(items).toHaveProperty("rate");
    expect(items).toHaveProperty("threshold");
    expect(items).toHaveProperty("cdi_monthly");
    expect(items.rate).toBeGreaterThan(items.threshold as number);
  });

  it("R03: affected_items is array of subscriptions", () => {
    const items = FINDING_R03.affected_items as Array<Record<string, unknown>>;
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items[0]).toHaveProperty("description");
    expect(items[0]).toHaveProperty("amount");
  });

  it("R04: TCO includes depreciation + expenses", () => {
    const items = FINDING_R04.affected_items as Record<string, unknown>;
    expect(items).toHaveProperty("monthly_depreciation");
    expect(items).toHaveProperty("monthly_expenses");
    expect(items).toHaveProperty("total_tco");
    expect(items).toHaveProperty("income_pct");
    // TCO = depreciation + expenses
    expect(items.total_tco).toBeCloseTo(
      (items.monthly_depreciation as number) + (items.monthly_expenses as number),
      0
    );
  });

  it("R05: affected_items contains compound projection", () => {
    const items = FINDING_R05.affected_items as Record<string, unknown>;
    expect(items).toHaveProperty("cost_3m");
    expect(items).toHaveProperty("cost_6m");
    expect(items).toHaveProperty("cost_12m");
    // Compound: 12m cost should exceed 6m cost
    expect(items.cost_12m).toBeGreaterThan(items.cost_6m as number);
  });

  it("R06: affected_items shows growth trajectory", () => {
    const items = FINDING_R06.affected_items as Record<string, unknown>;
    expect(items).toHaveProperty("current");
    expect(items).toHaveProperty("baseline");
    expect(items).toHaveProperty("growth_m1");
    expect(items).toHaveProperty("growth_m2");
    // Both growth rates should exceed 20%
    expect(items.growth_m1).toBeGreaterThanOrEqual(20);
    expect(items.growth_m2).toBeGreaterThanOrEqual(20);
  });

  it("R08: net_loss = depreciation - income", () => {
    const items = FINDING_R08.affected_items as Record<string, number>;
    expect(items.depreciation - items.income).toBe(
      FINDING_R08.potential_savings_monthly
    );
  });

  it("R09: concentration pct > 80%", () => {
    expect(FINDING_R09.title).toMatch(/9[0-9]\.?\d*%/);
  });

  it("R10: negative months have negative net flow", () => {
    const items = FINDING_R10.affected_items as Array<Record<string, number>>;
    items.forEach((m) => expect(m.net).toBeLessThan(0));
  });
});
