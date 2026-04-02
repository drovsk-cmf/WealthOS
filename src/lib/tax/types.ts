/**
 * Oniefy - Tax Engine Types (E50)
 *
 * Type definitions for tax calculation engine.
 * Ref: docs/TAX-ENGINE-SPEC.md
 */

/** A single bracket in a progressive tax table */
export interface TaxBracket {
  min: number;
  max: number;
  rate: number; // percentage (e.g., 7.5 means 7.5%)
  deduction?: number; // parcela a deduzir (IRPF only)
}

/** Limits and deduction caps associated with a parameter set */
export interface TaxLimits {
  // IRPF monthly/annual
  dependent_deduction_monthly?: number;
  simplified_discount_monthly?: number;
  simplified_discount_annual?: number;
  education_deduction_annual_per_person?: number;
  // Lei 15.270/2025 reduction (2026+)
  reduction_threshold_full?: number;
  reduction_threshold_partial?: number;
  reduction_flat?: number;
  reduction_formula_factor?: number;
  reduction_formula_constant?: number;
  annual_exemption?: number;
  annual_reduction_flat?: number;
  annual_reduction_threshold_full?: number;
  annual_reduction_threshold_partial?: number;
  annual_reduction_formula_factor?: number;
  annual_reduction_formula_constant?: number;
  // INSS
  ceiling?: number;
  // Minimum wage
  value?: number;
  // Capital gains
  stock_monthly_exemption?: number;
  crypto_monthly_exemption?: number;
}

/** A complete tax parameter set from the database */
export interface TaxParameterSet {
  parameter_type: string;
  valid_from: string;
  valid_until: string | null;
  brackets: TaxBracket[];
  limits: TaxLimits;
}

/** Input for monthly IRPF calculation (CLT employee) */
export interface MonthlyIRPFInput {
  grossSalary: number;
  dependents: number;
  alimony?: number;
  /** If provided, uses this instead of calculating INSS */
  precomputedINSS?: number;
  /** Year for parameter lookup (defaults to current year) */
  year?: number;
}

/** Result of monthly IRPF calculation */
export interface MonthlyIRPFResult {
  grossSalary: number;
  inss: number;
  dependentDeduction: number;
  alimony: number;
  taxableBase: number;
  irpfBeforeReduction: number;
  reduction: number;
  irpf: number;
  netSalary: number;
  effectiveRate: number;
}

/** Input for annual IRPF projection */
export interface AnnualIRPFInput {
  totalTaxableIncome: number;
  totalINSSPaid: number;
  dependents: number;
  healthExpenses: number;
  educationExpenses: number;
  pgblContributions: number;
  alimonyPaid: number;
  irWithheld: number;
  year?: number;
}

/** Result of annual IRPF projection */
export interface AnnualIRPFResult {
  totalTaxableIncome: number;
  /** Deductions under complete model */
  deductionsComplete: {
    inss: number;
    dependents: number;
    health: number;
    education: number;
    pgbl: number;
    alimony: number;
    total: number;
  };
  /** Deduction under simplified model */
  simplifiedDiscount: number;
  /** Which model is more advantageous */
  bestModel: "complete" | "simplified";
  taxableBaseComplete: number;
  taxableBaseSimplified: number;
  irpfComplete: number;
  irpfSimplified: number;
  irpf: number;
  irWithheld: number;
  /** Positive = tax due, negative = refund */
  balance: number;
  effectiveRate: number;
}

/** Input for INSS calculation */
export interface INSSInput {
  grossSalary: number;
  type: "employee" | "individual" | "individual_reduced";
}

/** Result of INSS calculation */
export interface INSSResult {
  grossSalary: number;
  inss: number;
  effectiveRate: number;
}

/** Input for investment capital gains tax */
export interface CapitalGainsInput {
  gain: number;
  totalSalesInMonth: number;
  type: "stock" | "stock_daytrade" | "fii" | "crypto";
  holdingDays?: number; // for fixed income
}

/** Result of capital gains tax */
export interface CapitalGainsResult {
  gain: number;
  isExempt: boolean;
  exemptionReason?: string;
  rate: number;
  tax: number;
  darfCode?: string;
}
