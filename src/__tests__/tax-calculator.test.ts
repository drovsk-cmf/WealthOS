/**
 * Oniefy - Tax Calculator Tests (E50)
 *
 * Tests using real 2025 and 2026 parameters from tax_parameters table.
 * Ref: docs/TAX-ENGINE-SPEC.md §6.1
 */

import {
  calculateINSS,
  calculateMonthlyIRPF,
  calculateAnnualIRPF,
  calculateCapitalGains,
  calculateFixedIncomeTax,
  calculateCLTNetSalary,
} from "@/lib/tax/calculator";
import type { TaxParameterSet } from "@/lib/tax/types";

/* ------------------------------------------------------------------ */
/*  Test fixtures: real parameters from tax_parameters table           */
/* ------------------------------------------------------------------ */

const IRPF_MONTHLY_2025: TaxParameterSet = {
  parameter_type: "irpf_monthly",
  valid_from: "2025-05-01",
  valid_until: "2025-12-31",
  brackets: [
    { min: 0, max: 2428.80, rate: 0, deduction: 0 },
    { min: 2428.81, max: 2826.65, rate: 7.5, deduction: 182.16 },
    { min: 2826.66, max: 3751.05, rate: 15, deduction: 394.16 },
    { min: 3751.06, max: 4664.68, rate: 22.5, deduction: 675.49 },
    { min: 4664.69, max: 99999999, rate: 27.5, deduction: 908.73 },
  ],
  limits: {
    dependent_deduction_monthly: 189.59,
    simplified_discount_monthly: 607.20,
  },
};

const IRPF_MONTHLY_2026: TaxParameterSet = {
  parameter_type: "irpf_monthly",
  valid_from: "2026-01-01",
  valid_until: null,
  brackets: [
    { min: 0, max: 2428.80, rate: 0, deduction: 0 },
    { min: 2428.81, max: 2826.65, rate: 7.5, deduction: 182.16 },
    { min: 2826.66, max: 3751.05, rate: 15, deduction: 394.16 },
    { min: 3751.06, max: 4664.68, rate: 22.5, deduction: 675.49 },
    { min: 4664.69, max: 99999999, rate: 27.5, deduction: 908.73 },
  ],
  limits: {
    dependent_deduction_monthly: 189.59,
    simplified_discount_monthly: 607.20,
    reduction_threshold_full: 5000,
    reduction_threshold_partial: 7350,
    reduction_flat: 312.89,
    reduction_formula_factor: 0.133145,
    reduction_formula_constant: 978.62,
    education_deduction_annual_per_person: 3561.50,
  },
};

const IRPF_ANNUAL_2025: TaxParameterSet = {
  parameter_type: "irpf_annual",
  valid_from: "2025-01-01",
  valid_until: "2025-12-31",
  brackets: [
    { min: 0, max: 27110.40, rate: 0, deduction: 0 },
    { min: 27110.41, max: 33919.80, rate: 7.5, deduction: 2033.28 },
    { min: 33919.81, max: 45012.60, rate: 15, deduction: 4577.28 },
    { min: 45012.61, max: 55976.16, rate: 22.5, deduction: 7953.24 },
    { min: 55976.17, max: 99999999, rate: 27.5, deduction: 10752.00 },
  ],
  limits: {
    simplified_discount_annual: 16754.34,
  },
};

const IRPF_ANNUAL_2026: TaxParameterSet = {
  parameter_type: "irpf_annual",
  valid_from: "2026-01-01",
  valid_until: null,
  brackets: [
    { min: 0, max: 27110.40, rate: 0, deduction: 0 },
    { min: 27110.41, max: 33919.80, rate: 7.5, deduction: 2033.28 },
    { min: 33919.81, max: 45012.60, rate: 15, deduction: 4577.28 },
    { min: 45012.61, max: 55976.16, rate: 22.5, deduction: 7953.24 },
    { min: 55976.17, max: 99999999, rate: 27.5, deduction: 10752.00 },
  ],
  limits: {
    simplified_discount_annual: 17640,
    annual_exemption: 60000,
    annual_reduction_flat: 3754.68,
    annual_reduction_threshold_full: 60000,
    annual_reduction_threshold_partial: 88200,
    annual_reduction_formula_factor: 0.133145,
    annual_reduction_formula_constant: 11743.44,
  },
};

const INSS_2025: TaxParameterSet = {
  parameter_type: "inss_employee",
  valid_from: "2025-01-01",
  valid_until: "2025-12-31",
  brackets: [
    { min: 0, max: 1518.00, rate: 7.5 },
    { min: 1518.01, max: 2793.88, rate: 9 },
    { min: 2793.89, max: 4190.83, rate: 12 },
    { min: 4190.84, max: 8157.41, rate: 14 },
  ],
  limits: { ceiling: 8157.41 },
};

const MIN_WAGE_2025: TaxParameterSet = {
  parameter_type: "minimum_wage",
  valid_from: "2025-01-01",
  valid_until: "2025-12-31",
  brackets: [],
  limits: { value: 1518 },
};

const CAPITAL_GAINS: TaxParameterSet = {
  parameter_type: "capital_gains",
  valid_from: "2016-01-01",
  valid_until: null,
  brackets: [
    { min: 0, max: 5000000, rate: 15 },
    { min: 5000000.01, max: 10000000, rate: 17.5 },
    { min: 10000000.01, max: 30000000, rate: 20 },
    { min: 30000000.01, max: 99999999999, rate: 22.5 },
  ],
  limits: {
    stock_monthly_exemption: 20000,
    crypto_monthly_exemption: 35000,
  },
};

/* ================================================================== */
/*  Tests                                                              */
/* ================================================================== */

describe("Tax Calculator — INSS", () => {
  test("CLT R$ 1.518 (minimum wage): 7.5% flat", () => {
    const r = calculateINSS({ grossSalary: 1518, type: "employee" }, INSS_2025.brackets, INSS_2025.limits);
    expect(r.inss).toBeCloseTo(113.85, 1);
  });

  test("CLT R$ 3.000: progressive brackets", () => {
    const r = calculateINSS({ grossSalary: 3000, type: "employee" }, INSS_2025.brackets, INSS_2025.limits);
    // 1518 * 7.5% + (2793.88-1518.01) * 9% + (3000-2793.89) * 12%
    const expected = 1518 * 0.075 + (2793.88 - 1518) * 0.09 + (3000 - 2793.88) * 0.12;
    expect(r.inss).toBeCloseTo(expected, 0);
  });

  test("CLT R$ 5.000: hits 4th bracket", () => {
    const r = calculateINSS({ grossSalary: 5000, type: "employee" }, INSS_2025.brackets, INSS_2025.limits);
    expect(r.inss).toBeGreaterThan(400);
    expect(r.inss).toBeLessThan(600);
  });

  test("CLT R$ 15.000 (above ceiling): capped at ceiling", () => {
    const r = calculateINSS({ grossSalary: 15000, type: "employee" }, INSS_2025.brackets, INSS_2025.limits);
    const rCeiling = calculateINSS({ grossSalary: 8157.41, type: "employee" }, INSS_2025.brackets, INSS_2025.limits);
    expect(r.inss).toBeCloseTo(rCeiling.inss, 2);
  });

  test("Individual 20%: capped at ceiling", () => {
    const r = calculateINSS({ grossSalary: 10000, type: "individual" }, INSS_2025.brackets, INSS_2025.limits);
    expect(r.inss).toBeCloseTo(8157.41 * 0.2, 1);
  });

  test("Individual reduced 11%: over minimum wage", () => {
    const r = calculateINSS(
      { grossSalary: 5000, type: "individual_reduced" },
      INSS_2025.brackets,
      { ...INSS_2025.limits, value: 1518 }
    );
    expect(r.inss).toBeCloseTo(1518 * 0.11, 1);
  });
});

describe("Tax Calculator — Monthly IRPF (2025)", () => {
  test("CLT R$ 2.000: isento (below threshold after INSS)", () => {
    const r = calculateMonthlyIRPF(
      { grossSalary: 2000, dependents: 0 },
      IRPF_MONTHLY_2025, INSS_2025, MIN_WAGE_2025
    );
    expect(r.irpf).toBe(0);
  });

  test("CLT R$ 5.000 with 2 dependents", () => {
    const r = calculateMonthlyIRPF(
      { grossSalary: 5000, dependents: 2 },
      IRPF_MONTHLY_2025, INSS_2025, MIN_WAGE_2025
    );
    // INSS ~428, dep deduction 379.18, base ~4192.82
    expect(r.inss).toBeGreaterThan(400);
    expect(r.dependentDeduction).toBeCloseTo(379.18, 1);
    expect(r.irpf).toBeGreaterThan(0);
    expect(r.irpf).toBeLessThan(300);
    expect(r.netSalary).toBeLessThan(5000);
    expect(r.effectiveRate).toBeGreaterThan(0);
  });

  test("CLT R$ 8.000 no dependents: higher bracket", () => {
    const r = calculateMonthlyIRPF(
      { grossSalary: 8000, dependents: 0 },
      IRPF_MONTHLY_2025, INSS_2025, MIN_WAGE_2025
    );
    expect(r.irpf).toBeGreaterThan(500);
    expect(r.effectiveRate).toBeGreaterThan(5);
  });

  test("CLT R$ 30.000 no dependents: top bracket", () => {
    const r = calculateMonthlyIRPF(
      { grossSalary: 30000, dependents: 0 },
      IRPF_MONTHLY_2025, INSS_2025, MIN_WAGE_2025
    );
    expect(r.irpf).toBeGreaterThan(5000);
    expect(r.effectiveRate).toBeGreaterThan(15);
  });

  test("precomputedINSS is used when provided", () => {
    const r = calculateMonthlyIRPF(
      { grossSalary: 5000, dependents: 0, precomputedINSS: 500 },
      IRPF_MONTHLY_2025, INSS_2025, MIN_WAGE_2025
    );
    expect(r.inss).toBe(500);
  });
});

describe("Tax Calculator — Monthly IRPF (2026, Lei 15.270)", () => {
  test("R$ 5.000/mês: isenção total", () => {
    const r = calculateMonthlyIRPF(
      { grossSalary: 5000, dependents: 0, precomputedINSS: 0 },
      IRPF_MONTHLY_2026, INSS_2025, MIN_WAGE_2025
    );
    // Taxable base = 5000, which is <= threshold_full (5000)
    // Full reduction should zero the tax
    expect(r.irpf).toBe(0);
    expect(r.reduction).toBeGreaterThan(0);
  });

  test("R$ 6.500/mês: redução parcial", () => {
    const r = calculateMonthlyIRPF(
      { grossSalary: 6500, dependents: 0, precomputedINSS: 0 },
      IRPF_MONTHLY_2026, INSS_2025, MIN_WAGE_2025
    );
    // Taxable base = 6500, between 5000 and 7350
    expect(r.reduction).toBeGreaterThan(0);
    expect(r.irpf).toBeGreaterThan(0);
    expect(r.irpf).toBeLessThan(r.irpfBeforeReduction);
  });

  test("R$ 10.000/mês: sem redução (acima do threshold)", () => {
    const r = calculateMonthlyIRPF(
      { grossSalary: 10000, dependents: 0, precomputedINSS: 0 },
      IRPF_MONTHLY_2026, INSS_2025, MIN_WAGE_2025
    );
    // Taxable base = 10000, above 7350
    expect(r.reduction).toBe(0);
    expect(r.irpf).toBe(r.irpfBeforeReduction);
  });
});

describe("Tax Calculator — Annual IRPF Projection", () => {
  test("Low income: simplified model is better", () => {
    const r = calculateAnnualIRPF(
      {
        totalTaxableIncome: 60000,
        totalINSSPaid: 5000,
        dependents: 0,
        healthExpenses: 1000,
        educationExpenses: 500,
        pgblContributions: 0,
        alimonyPaid: 0,
        irWithheld: 3000,
      },
      IRPF_ANNUAL_2025
    );
    expect(r.bestModel).toBe("simplified");
    expect(r.simplifiedDiscount).toBeCloseTo(12000, -2); // 20% of 60k
  });

  test("High deductions: complete model is better", () => {
    const r = calculateAnnualIRPF(
      {
        totalTaxableIncome: 120000,
        totalINSSPaid: 9000,
        dependents: 2,
        healthExpenses: 15000,
        educationExpenses: 10000,
        pgblContributions: 14400, // 12% of 120k
        alimonyPaid: 0,
        irWithheld: 15000,
      },
      IRPF_ANNUAL_2025
    );
    expect(r.bestModel).toBe("complete");
    expect(r.deductionsComplete.total).toBeGreaterThan(r.simplifiedDiscount);
  });

  test("Positive balance = tax due", () => {
    const r = calculateAnnualIRPF(
      {
        totalTaxableIncome: 200000,
        totalINSSPaid: 9000,
        dependents: 0,
        healthExpenses: 0,
        educationExpenses: 0,
        pgblContributions: 0,
        alimonyPaid: 0,
        irWithheld: 5000,
      },
      IRPF_ANNUAL_2025
    );
    expect(r.balance).toBeGreaterThan(0); // tax due
  });

  test("Negative balance = refund", () => {
    const r = calculateAnnualIRPF(
      {
        totalTaxableIncome: 60000,
        totalINSSPaid: 5000,
        dependents: 2,
        healthExpenses: 10000,
        educationExpenses: 5000,
        pgblContributions: 0,
        alimonyPaid: 0,
        irWithheld: 8000,
      },
      IRPF_ANNUAL_2025
    );
    expect(r.balance).toBeLessThan(0); // refund
  });
});

describe("Tax Calculator — Capital Gains", () => {
  test("Stock sales <= R$ 20.000: exempt", () => {
    const r = calculateCapitalGains(
      { gain: 3000, totalSalesInMonth: 18000, type: "stock" },
      CAPITAL_GAINS
    );
    expect(r.isExempt).toBe(true);
    expect(r.tax).toBe(0);
  });

  test("Stock sales > R$ 20.000 with gain: 15% tax", () => {
    const r = calculateCapitalGains(
      { gain: 3000, totalSalesInMonth: 25000, type: "stock" },
      CAPITAL_GAINS
    );
    expect(r.isExempt).toBe(false);
    expect(r.rate).toBe(15);
    expect(r.tax).toBeCloseTo(450, 1);
    expect(r.darfCode).toBe("6015");
  });

  test("Day trade: 20% tax", () => {
    const r = calculateCapitalGains(
      { gain: 1000, totalSalesInMonth: 50000, type: "stock_daytrade" },
      CAPITAL_GAINS
    );
    expect(r.rate).toBe(20);
    expect(r.tax).toBeCloseTo(200, 1);
    expect(r.darfCode).toBe("8468");
  });

  test("FII capital gain: 20% tax", () => {
    const r = calculateCapitalGains(
      { gain: 5000, totalSalesInMonth: 100000, type: "fii" },
      CAPITAL_GAINS
    );
    expect(r.rate).toBe(20);
    expect(r.tax).toBeCloseTo(1000, 1);
  });

  test("Crypto below exemption: exempt", () => {
    const r = calculateCapitalGains(
      { gain: 2000, totalSalesInMonth: 30000, type: "crypto" },
      CAPITAL_GAINS
    );
    expect(r.isExempt).toBe(true);
  });
});

describe("Tax Calculator — Fixed Income", () => {
  test("CDB 400 days: 17.5%", () => {
    const r = calculateFixedIncomeTax(1000, 400);
    expect(r.rate).toBe(17.5);
    expect(r.tax).toBeCloseTo(175, 1);
  });

  test("CDB 100 days: 22.5%", () => {
    const r = calculateFixedIncomeTax(500, 100);
    expect(r.rate).toBe(22.5);
    expect(r.tax).toBeCloseTo(112.5, 1);
  });

  test("CDB 750 days: 15%", () => {
    const r = calculateFixedIncomeTax(2000, 750);
    expect(r.rate).toBe(15);
    expect(r.tax).toBeCloseTo(300, 1);
  });
});

describe("Tax Calculator — CLT Net Salary (E45)", () => {
  test("R$ 5.000 with 2 dependents: full breakdown", () => {
    const r = calculateCLTNetSalary(5000, 2, IRPF_MONTHLY_2025, INSS_2025, MIN_WAGE_2025);
    expect(r.grossSalary).toBe(5000);
    expect(r.inss).toBeGreaterThan(0);
    expect(r.irpf).toBeGreaterThanOrEqual(0);
    expect(r.netSalary).toBeLessThan(5000);
    expect(r.fgts).toBeCloseTo(400, 1); // 8%
    expect(r.totalDeductions).toBeCloseTo(r.inss + r.irpf, 1);
  });

  test("R$ 1.518 (minimum wage): IRPF = 0", () => {
    const r = calculateCLTNetSalary(1518, 0, IRPF_MONTHLY_2025, INSS_2025, MIN_WAGE_2025);
    expect(r.irpf).toBe(0);
    expect(r.netSalary).toBeCloseTo(1518 - r.inss, 1);
  });
});
