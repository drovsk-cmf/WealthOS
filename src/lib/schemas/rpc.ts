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
  matched: z.number().optional().default(0),
  batch_id: z.string().uuid(),
});

// ─── Reconciliation ──────────────────────────────────────────

export const reconciliationCandidateSchema = z.object({
  id: z.string().uuid(),
  description: z.string().nullable(),
  amount: z.number(),
  date: z.string(),
  due_date: z.string().nullable(),
  type: z.string(),
  payment_status: z.string(),
  category_id: z.string().uuid().nullable(),
  recurrence_id: z.string().uuid().nullable(),
  amount_diff: z.number(),
  days_diff: z.number(),
  match_score: z.number(),
});

export const matchTransactionsResultSchema = z.object({
  status: z.string(),
  pending_id: z.string().uuid(),
  imported_id: z.string().uuid(),
  adjustment: z.number(),
  final_amount: z.number(),
});

// ─── Assets ──────────────────────────────────────────────────

export const assetsSummarySchema = z.object({
  total_value: z.number(),
  total_acquisition: z.number(),
  asset_count: z.number(),
  by_category: z.array(z.object({
    category: z.enum(["real_estate", "vehicle", "electronics", "other", "restricted"]),
    count: z.number(),
    total_value: z.number(),
  })),
  expiring_insurance: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    insurance_expiry: z.string(),
    days_until_expiry: z.number(),
  })),
  total_depreciation: z.number(),
});

export const depreciateAssetResultSchema = z.object({
  status: z.string(),
  previous_value: z.number(),
  depreciation: z.number(),
  new_value: z.number(),
});

// ─── Cost Centers ────────────────────────────────────────────

export const centerPnlSchema = z.object({
  center_id: z.string().uuid(),
  center_name: z.string(),
  center_type: z.string(),
  period_from: z.string(),
  period_to: z.string(),
  total_income: z.number(),
  total_expense: z.number(),
  net_result: z.number(),
  monthly: z.array(z.object({
    month: z.string(),
    income: z.number(),
    expense: z.number(),
  })),
});

export const centerExportSchema = z.object({
  center: z.object({
    id: z.string().uuid(),
    name: z.string(),
    type: z.string(),
    color: z.string().nullable(),
    created_at: z.string(),
  }),
  transactions: z.array(z.object({
    id: z.string().uuid(),
    date: z.string(),
    type: z.string(),
    amount: z.number(),
    description: z.string().nullable(),
    is_paid: z.boolean(),
    center_percentage: z.number(),
    center_amount: z.number(),
    coa_name: z.string(),
    group_type: z.string(),
  })),
  totals: z.object({
    income: z.number(),
    expense: z.number(),
    net: z.number(),
  }),
  exported_at: z.string(),
});

export const allocateToCentersResultSchema = z.object({
  status: z.string(),
  transaction_id: z.string().uuid(),
  allocations: z.array(z.object({
    cost_center_id: z.string().uuid(),
    percentage: z.number(),
    amount: z.number(),
  })),
});

// ─── Economic Indices ────────────────────────────────────────

const indexDataPointSchema = z.object({
  index_type: z.string(),
  reference_date: z.string(),
  value: z.number(),
  accumulated_12m: z.number().nullable(),
  accumulated_year: z.number().nullable(),
  source_primary: z.string(),
  fetched_at: z.string(),
});

export const indexLatestResultSchema = z.object({
  indices: z.array(indexDataPointSchema),
});

export const economicIndicesResultSchema = z.object({
  data: z.array(indexDataPointSchema),
});

// ─── Workflows ───────────────────────────────────────────────

export const workflowCreateResultSchema = z.object({
  status: z.string(),
  workflow_id: z.string().uuid().optional(),
  name: z.string().optional(),
});

export const generateTasksResultSchema = z.object({
  status: z.string(),
  tasks_created: z.number(),
  workflows_skipped: z.number(),
});

export const completeTaskResultSchema = z.object({
  status: z.string(),
  all_period_tasks_done: z.boolean(),
});

// ─── Transaction reversal ────────────────────────────────────

export const reversalResultSchema = z.object({
  reversed_transaction_id: z.string().uuid(),
  reversal_journal_id: z.string().uuid().nullable(),
});

// ─── Table query schemas ─────────────────────────────────────

export const taxParameterSchema = z.object({
  id: z.string().uuid(),
  parameter_type: z.string(),
  valid_from: z.string(),
  valid_until: z.string().nullable(),
  brackets: z.array(z.record(z.unknown())),
  limits: z.record(z.unknown()).nullable(),
  source_references: z.array(z.object({ source: z.string(), url: z.string(), date: z.string() })),
  created_at: z.string(),
  updated_at: z.string(),
  updated_by: z.string().nullable(),
});

export const budgetWithCategorySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  category_id: z.string().uuid(),
  month: z.string(),
  planned_amount: z.number(),
  alert_threshold: z.number(),
  adjustment_index: z.enum(["ipca", "igpm", "inpc", "selic", "manual", "none"]).nullable(),
  coa_id: z.string().uuid().nullable(),
  cost_center_id: z.string().uuid().nullable(),
  family_member_id: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  categories: z.object({
    name: z.string(),
    icon: z.string().nullable(),
    color: z.string().nullable(),
    type: z.string(),
  }),
});

// ─── Dashboard (additional) ──────────────────────────────────

export const topCategoriesResultSchema = z.object({
  categories: z.array(z.object({
    category_name: z.string(),
    icon: z.string().nullable(),
    color: z.string().nullable(),
    total: z.number(),
    percentage: z.number(),
  })),
  total_expense: z.number(),
  month: z.string(),
});

export const balanceEvolutionResultSchema = z.object({
  data: z.array(z.object({
    month: z.string(),
    balance: z.number(),
    projected: z.number(),
    income: z.number(),
    expense: z.number(),
  })),
  source: z.enum(["snapshots", "calculated"]),
  months_requested: z.number(),
});

export const budgetVsActualResultSchema = z.object({
  items: z.array(z.object({
    category_name: z.string(),
    category_icon: z.string().nullable(),
    category_color: z.string().nullable(),
    budget_id: z.string().uuid(),
    planned: z.number(),
    alert_threshold: z.number(),
    actual: z.number(),
    remaining: z.number(),
    pct_used: z.number(),
    status: z.enum(["ok", "warning", "exceeded"]),
    family_member_id: z.string().uuid().nullable(),
  })),
  total_planned: z.number(),
  total_actual: z.number(),
  total_remaining: z.number(),
  pct_used: z.number(),
  month: z.string(),
  budget_count: z.number(),
});

export function logSchemaError(rpcName: string, parsed: z.SafeParseError<unknown>) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join(" | ");
  console.error(`[Oniefy] RPC schema mismatch (${rpcName}): ${issues}`);
}
