/**
 * Oniefy - Tax Calculator Engine (E50)
 *
 * Pure calculation functions. No side effects, no API calls.
 * All monetary values in BRL (reais, not centavos).
 *
 * Ref: docs/TAX-ENGINE-SPEC.md
 */

import type {
  TaxBracket,
  TaxLimits,
  TaxParameterSet,
  MonthlyIRPFInput,
  MonthlyIRPFResult,
  AnnualIRPFInput,
  AnnualIRPFResult,
  INSSInput,
  INSSResult,
  CapitalGainsInput,
  CapitalGainsResult,
} from "./types";

/* ------------------------------------------------------------------ */
/*  INSS (progressive by bracket, not by total)                       */
/* ------------------------------------------------------------------ */

/**
 * Calculate INSS contribution for CLT employee (progressive brackets).
 * Each bracket applies its rate only to the portion within that range.
 */
export function calculateINSS(
  input: INSSInput,
  brackets: TaxBracket[],
  limits: TaxLimits
): INSSResult {
  const { grossSalary, type } = input;
  const ceiling = limits.ceiling ?? 8157.41;

  if (type === "individual_reduced") {
    // 11% over minimum wage (MEI, contribuinte individual simplificado)
    const minWage = limits.value ?? 1518;
    const inss = minWage * 0.11;
    return { grossSalary, inss: round2(inss), effectiveRate: round4((inss / grossSalary) * 100) };
  }

  if (type === "individual") {
    // 20% over gross up to ceiling
    const base = Math.min(grossSalary, ceiling);
    const inss = base * 0.2;
    return { grossSalary, inss: round2(inss), effectiveRate: round4((inss / grossSalary) * 100) };
  }

  // CLT employee: progressive by bracket
  let inss = 0;
  const base = Math.min(grossSalary, ceiling);

  for (const bracket of brackets) {
    if (base <= bracket.min) break;
    const portionMax = Math.min(base, bracket.max);
    const portionMin = bracket.min === 0 ? 0 : bracket.min;
    const portion = portionMax - portionMin;
    if (portion > 0) {
      inss += portion * (bracket.rate / 100);
    }
  }

  return {
    grossSalary,
    inss: round2(inss),
    effectiveRate: grossSalary > 0 ? round4((inss / grossSalary) * 100) : 0,
  };
}

/* ------------------------------------------------------------------ */
/*  IRPF Monthly (CLT)                                                */
/* ------------------------------------------------------------------ */

/**
 * Calculate monthly IRPF for a CLT employee.
 * Steps: gross - INSS - dependents - alimony = taxable base
 * Then apply progressive table + Lei 15.270 reduction (if year >= 2026).
 */
export function calculateMonthlyIRPF(
  input: MonthlyIRPFInput,
  irpfParams: TaxParameterSet,
  inssParams: TaxParameterSet,
  minWageParams?: TaxParameterSet
): MonthlyIRPFResult {
  const { grossSalary, dependents, alimony = 0 } = input;
  const limits = irpfParams.limits;

  // Step 1: INSS
  const inssResult =
    input.precomputedINSS !== undefined
      ? input.precomputedINSS
      : calculateINSS(
          { grossSalary, type: "employee" },
          inssParams.brackets,
          { ...inssParams.limits, value: minWageParams?.limits.value }
        ).inss;

  // Step 2: Dependent deduction
  const depDeduction = dependents * (limits.dependent_deduction_monthly ?? 189.59);

  // Step 3: Taxable base
  const taxableBase = Math.max(0, grossSalary - inssResult - depDeduction - alimony);

  // Step 4: Apply progressive table
  let irpfBefore = applyProgressiveTable(taxableBase, irpfParams.brackets);

  // Step 5: Apply Lei 15.270/2025 reduction (2026+)
  const reduction = calculateMonthlyReduction(taxableBase, limits);

  // Step 6: Final IRPF (cap reduction at actual IRPF for clean result)
  const effectiveReduction = Math.min(reduction, irpfBefore);
  const irpf = Math.max(0, round2(irpfBefore - effectiveReduction));

  const netSalary = round2(grossSalary - inssResult - irpf - alimony);
  const effectiveRate = grossSalary > 0 ? round4((irpf / grossSalary) * 100) : 0;

  return {
    grossSalary,
    inss: round2(inssResult),
    dependentDeduction: round2(depDeduction),
    alimony: round2(alimony),
    taxableBase: round2(taxableBase),
    irpfBeforeReduction: round2(irpfBefore),
    reduction: round2(effectiveReduction),
    irpf,
    netSalary,
    effectiveRate,
  };
}

/* ------------------------------------------------------------------ */
/*  IRPF Annual Projection                                            */
/* ------------------------------------------------------------------ */

/**
 * Project annual IRPF: compares complete vs simplified model.
 */
export function calculateAnnualIRPF(
  input: AnnualIRPFInput,
  irpfAnnualParams: TaxParameterSet
): AnnualIRPFResult {
  const {
    totalTaxableIncome,
    totalINSSPaid,
    dependents,
    healthExpenses,
    educationExpenses,
    pgblContributions,
    alimonyPaid,
    irWithheld,
  } = input;

  const limits = irpfAnnualParams.limits;
  const annualDepDeduction = dependents * 2275.08; // per year
  const eduLimit = limits.education_deduction_annual_per_person ?? 3561.5;
  const eduCapped = Math.min(educationExpenses, eduLimit * (dependents + 1)); // self + deps
  const pgblLimit = totalTaxableIncome * 0.12;
  const pgblCapped = Math.min(pgblContributions, pgblLimit);

  // Complete model deductions
  const deductionsComplete = {
    inss: totalINSSPaid,
    dependents: annualDepDeduction,
    health: healthExpenses, // no limit
    education: eduCapped,
    pgbl: pgblCapped,
    alimony: alimonyPaid,
    total: round2(
      totalINSSPaid + annualDepDeduction + healthExpenses + eduCapped + pgblCapped + alimonyPaid
    ),
  };

  // Simplified model
  const simplifiedDiscount = Math.min(
    totalTaxableIncome * 0.2,
    limits.simplified_discount_annual ?? 17640
  );

  // Taxable bases
  const taxableBaseComplete = Math.max(0, totalTaxableIncome - deductionsComplete.total);
  const taxableBaseSimplified = Math.max(0, totalTaxableIncome - simplifiedDiscount);

  // Apply annual progressive table
  let irpfComplete = applyProgressiveTable(taxableBaseComplete, irpfAnnualParams.brackets);
  let irpfSimplified = applyProgressiveTable(taxableBaseSimplified, irpfAnnualParams.brackets);

  // Apply annual reduction (Lei 15.270/2025, 2026+)
  const reductionComplete = calculateAnnualReduction(taxableBaseComplete, limits);
  const reductionSimplified = calculateAnnualReduction(taxableBaseSimplified, limits);
  irpfComplete = Math.max(0, round2(irpfComplete - reductionComplete));
  irpfSimplified = Math.max(0, round2(irpfSimplified - reductionSimplified));

  const bestModel = irpfComplete <= irpfSimplified ? "complete" : "simplified";
  const irpf = bestModel === "complete" ? irpfComplete : irpfSimplified;
  const balance = round2(irpf - irWithheld);
  const effectiveRate = totalTaxableIncome > 0 ? round4((irpf / totalTaxableIncome) * 100) : 0;

  return {
    totalTaxableIncome,
    deductionsComplete,
    simplifiedDiscount: round2(simplifiedDiscount),
    bestModel,
    taxableBaseComplete: round2(taxableBaseComplete),
    taxableBaseSimplified: round2(taxableBaseSimplified),
    irpfComplete,
    irpfSimplified,
    irpf,
    irWithheld,
    balance,
    effectiveRate,
  };
}

/* ------------------------------------------------------------------ */
/*  Capital Gains                                                      */
/* ------------------------------------------------------------------ */

/**
 * Calculate tax on investment capital gains.
 */
export function calculateCapitalGains(
  input: CapitalGainsInput,
  params: TaxParameterSet
): CapitalGainsResult {
  const { gain, totalSalesInMonth, type } = input;
  const limits = params.limits;

  // Check exemptions
  if (type === "stock" && totalSalesInMonth <= (limits.stock_monthly_exemption ?? 20000)) {
    return {
      gain,
      isExempt: true,
      exemptionReason: `Vendas no mês (${formatBRL(totalSalesInMonth)}) abaixo da isenção de ${formatBRL(limits.stock_monthly_exemption ?? 20000)}`,
      rate: 0,
      tax: 0,
    };
  }

  if (type === "crypto" && totalSalesInMonth <= (limits.crypto_monthly_exemption ?? 35000)) {
    return {
      gain,
      isExempt: true,
      exemptionReason: `Vendas de cripto no mês abaixo da isenção de ${formatBRL(limits.crypto_monthly_exemption ?? 35000)}`,
      rate: 0,
      tax: 0,
    };
  }

  // Determine rate
  let rate: number;
  let darfCode: string;

  switch (type) {
    case "stock":
      rate = 15;
      darfCode = "6015";
      break;
    case "stock_daytrade":
      rate = 20;
      darfCode = "8468";
      break;
    case "fii":
      rate = 20;
      darfCode = "6015";
      break;
    case "crypto":
      // Progressive for crypto based on capital_gains brackets
      rate = getCapitalGainsRate(gain, params.brackets);
      darfCode = "4600";
      break;
    default:
      rate = 15;
      darfCode = "6015";
  }

  const tax = gain > 0 ? round2(gain * (rate / 100)) : 0;

  return {
    gain,
    isExempt: false,
    rate,
    tax,
    darfCode,
  };
}

/**
 * Calculate tax on fixed income based on holding period (regressive table).
 */
export function calculateFixedIncomeTax(
  grossReturn: number,
  holdingDays: number
): { rate: number; tax: number } {
  let rate: number;
  if (holdingDays <= 180) rate = 22.5;
  else if (holdingDays <= 360) rate = 20;
  else if (holdingDays <= 720) rate = 17.5;
  else rate = 15;

  return { rate, tax: round2(grossReturn * (rate / 100)) };
}

/* ------------------------------------------------------------------ */
/*  CLT Net Salary (E45 — bruto → líquido)                           */
/* ------------------------------------------------------------------ */

export interface CLTNetSalaryResult {
  grossSalary: number;
  inss: number;
  irpf: number;
  netSalary: number;
  fgts: number; // employer cost, not deducted
  effectiveINSSRate: number;
  effectiveIRPFRate: number;
  totalDeductions: number;
}

/**
 * Full CLT calculation: gross → net.
 * FGTS is employer cost (8%), not deducted from employee salary.
 */
export function calculateCLTNetSalary(
  grossSalary: number,
  dependents: number,
  irpfParams: TaxParameterSet,
  inssParams: TaxParameterSet,
  minWageParams?: TaxParameterSet
): CLTNetSalaryResult {
  const irpfResult = calculateMonthlyIRPF(
    { grossSalary, dependents },
    irpfParams,
    inssParams,
    minWageParams
  );

  const fgts = round2(grossSalary * 0.08);

  return {
    grossSalary,
    inss: irpfResult.inss,
    irpf: irpfResult.irpf,
    netSalary: irpfResult.netSalary,
    fgts,
    effectiveINSSRate: grossSalary > 0 ? round4((irpfResult.inss / grossSalary) * 100) : 0,
    effectiveIRPFRate: irpfResult.effectiveRate,
    totalDeductions: round2(irpfResult.inss + irpfResult.irpf),
  };
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

/** Apply progressive tax table to a taxable base. */
function applyProgressiveTable(base: number, brackets: TaxBracket[]): number {
  if (base <= 0) return 0;
  for (const bracket of brackets) {
    if (base >= bracket.min && base <= bracket.max) {
      return round2(base * (bracket.rate / 100) - (bracket.deduction ?? 0));
    }
  }
  // If above all brackets, use last bracket
  const last = brackets[brackets.length - 1];
  return round2(base * (last.rate / 100) - (last.deduction ?? 0));
}

/** Calculate Lei 15.270/2025 monthly reduction (2026+). */
function calculateMonthlyReduction(taxableBase: number, limits: TaxLimits): number {
  const thresholdFull = limits.reduction_threshold_full;
  const thresholdPartial = limits.reduction_threshold_partial;

  if (!thresholdFull || !thresholdPartial) return 0; // Pre-2026 parameters

  if (taxableBase <= thresholdFull) {
    // Full exemption: reduction equals whatever the IRPF would be (effectively zeroes it)
    // Return a value larger than any possible IRPF for this base
    return Infinity;
  }

  if (taxableBase <= thresholdPartial) {
    // Partial reduction: decreasing formula
    const factor = limits.reduction_formula_factor ?? 0.133145;
    const constant = limits.reduction_formula_constant ?? 978.62;
    return Math.max(0, round2(constant - factor * taxableBase));
  }

  return 0; // Above threshold: no reduction
}

/** Calculate Lei 15.270/2025 annual reduction (2026+). */
function calculateAnnualReduction(taxableBase: number, limits: TaxLimits): number {
  const thresholdFull = limits.annual_reduction_threshold_full;
  const thresholdPartial = limits.annual_reduction_threshold_partial;

  if (!thresholdFull || !thresholdPartial) return 0;

  if (taxableBase <= thresholdFull) {
    // Full exemption: reduction zeroes the tax
    return Infinity;
  }

  if (taxableBase <= thresholdPartial) {
    const factor = limits.annual_reduction_formula_factor ?? 0.133145;
    const constant = limits.annual_reduction_formula_constant ?? 11743.44;
    return Math.max(0, round2(constant - factor * taxableBase));
  }

  return 0;
}

/** Get capital gains rate from progressive brackets (crypto). */
function getCapitalGainsRate(gain: number, brackets: TaxBracket[]): number {
  for (const bracket of brackets) {
    if (gain >= bracket.min && gain <= bracket.max) {
      return bracket.rate;
    }
  }
  const last = brackets[brackets.length - 1];
  return last?.rate ?? 15;
}

/** Round to 2 decimal places. */
function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/** Round to 4 decimal places. */
function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}

/** Format BRL for display in messages. */
function formatBRL(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
