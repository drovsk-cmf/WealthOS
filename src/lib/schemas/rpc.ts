import { z } from "zod";

export const dashboardSummarySchema = z.object({
  total_current_balance: z.number(),
  total_projected_balance: z.number(),
  active_accounts: z.number(),
  month_income: z.number(),
  month_expense: z.number(),
  month_start: z.string(),
  month_end: z.string(),
});

export const balanceSheetSchema = z.object({
  liquid_assets: z.number(),
  illiquid_assets: z.number(),
  total_assets: z.number(),
  total_liabilities: z.number(),
  net_worth: z.number(),
});

export const solvencyMetricsSchema = z.object({
  tier1_total: z.number(),
  tier2_total: z.number(),
  tier3_total: z.number(),
  tier4_total: z.number(),
  total_patrimony: z.number(),
  burn_rate: z.number(),
  runway_months: z.number(),
  lcr: z.number(),
  months_analyzed: z.number(),
});

const fiscalAccountSchema = z.object({
  coa_code: z.string(),
  coa_name: z.string(),
  total: z.number(),
});

const fiscalTreatmentGroupSchema = z.object({
  tax_treatment: z.string(),
  group_type: z.string(),
  total_revenue: z.number(),
  total_expense: z.number(),
  entry_count: z.number(),
  accounts: z.array(fiscalAccountSchema),
});

const fiscalReportTotalsSchema = z.object({
  total_tributavel_revenue: z.number(),
  total_isento_revenue: z.number(),
  total_dedutivel_expense: z.number(),
  total_transactions: z.number(),
});

export const fiscalReportSchema = z.object({
  year: z.number(),
  period_start: z.string(),
  period_end: z.string(),
  by_treatment: z.array(fiscalTreatmentGroupSchema),
  totals: fiscalReportTotalsSchema,
});

export const fiscalProjectionSchema = z.object({
  year: z.number(),
  months_elapsed: z.number(),
  months_remaining: z.number(),
  ytd_taxable_income: z.number(),
  ytd_deductible_expenses: z.number(),
  projected_annual_income: z.number(),
  projected_annual_deductible: z.number(),
  taxable_base: z.number(),
  estimated_annual_tax: z.number(),
  annual_reduction_applied: z.number(),
  ytd_irrf_withheld: z.number(),
  tax_gap: z.number(),
  monthly_provision: z.number(),
  disclaimer: z.string(),
  status: z.string().optional(),
  message: z.string().optional(),
});

export const transactionResultSchema = z.object({
  transaction_id: z.string().uuid(),
  journal_entry_id: z.string().uuid().nullable(),
});

export const transferResultSchema = z.object({
  from_transaction_id: z.string().uuid(),
  to_transaction_id: z.string().uuid(),
  journal_entry_id: z.string().uuid().nullable(),
  amount: z.number(),
});


export const autoCategorizeTransactionSchema = z.string().uuid().nullable();

export const importBatchResultSchema = z.object({
  status: z.string(),
  imported: z.number(),
  skipped: z.number(),
  categorized: z.number(),
  batch_id: z.string().uuid(),
});

export function logSchemaError(rpcName: string, parsed: z.SafeParseError<unknown>) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join(" | ");
  console.error(`[Oniefy] RPC schema mismatch (${rpcName}): ${issues}`);
}
