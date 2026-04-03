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
  aliased: z.number().optional().default(0),
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
    category: z.enum(["real_estate", "vehicle", "vehicle_auto", "vehicle_moto", "vehicle_recreational", "vehicle_aircraft", "electronics", "jewelry", "fashion", "furniture", "sports", "collectibles", "other", "restricted"]),
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

export const editTransactionResultSchema = z.object({
  original_id: z.string().uuid(),
  new_transaction_id: z.string().uuid(),
  new_journal_entry_id: z.string().uuid().nullable(),
  reversal_journal_id: z.string().uuid().nullable(),
});

export const editTransferResultSchema = z.object({
  original_id: z.string().uuid(),
  original_pair_id: z.string().uuid().nullable(),
  new_from_transaction_id: z.string().uuid(),
  new_to_transaction_id: z.string().uuid(),
  new_journal_entry_id: z.string().uuid().nullable(),
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
  approval_status: z.enum(["approved", "proposed", "rejected"]),
  proposed_at: z.string().nullable(),
  decided_at: z.string().nullable(),
  decision_notes: z.string().nullable(),
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

export const attentionQueueSchema = z.object({
  uncategorized: z.number(),
  overdue: z.number(),
  dueSoon: z.number(),
  recentImportCount: z.number(),
  lastTransactionDaysAgo: z.number().nullable(),
});

export const dashboardAllSchema = z.object({
  summary: dashboardSummarySchema,
  balance_sheet: balanceSheetSchema,
  solvency: solvencyMetricsSchema,
  top_categories: topCategoriesResultSchema,
  evolution: balanceEvolutionResultSchema,
  budget: budgetVsActualResultSchema.omit({ items: true }).extend({
    items: z.array(z.any()),
  }),
  attention: attentionQueueSchema,
});

// ─── Financial Scan (Motor Financeiro Camada 1+2) ─────────────

export const scanFindingSchema = z.object({
  rule_id: z.string(),
  severity: z.enum(["info", "warning", "critical"]),
  title: z.string(),
  description: z.string(),
  potential_savings_monthly: z.number(),
  affected_items: z.any().nullable().optional(),
});

export const scannerSchema = z.object({
  scan_date: z.string(),
  findings_count: z.number(),
  findings: z.array(scanFindingSchema),
  summary: z.object({
    total_potential_savings_monthly: z.number(),
    projected_3m: z.number(),
    projected_6m: z.number(),
    projected_12m: z.number(),
    critical_count: z.number(),
    warning_count: z.number(),
    info_count: z.number(),
  }),
  solvency: solvencyMetricsSchema.nullable(),
});

// ─── Diagnostics (Camada A + B) ─────────────────────

const savingsRateSchema = z.object({
  value: z.number(),
  monthly_surplus: z.number(),
  avg_income: z.number(),
  avg_expense: z.number(),
  months_analyzed: z.number(),
});

const patrimonyHhiSchema = z.object({
  value: z.number(),
  concentration: z.enum(["critical", "high", "moderate", "diversified"]),
  top_item: z.string(),
  top_pct: z.number(),
  total_patrimony: z.number(),
});

const waccPersonalSchema = z.object({
  value: z.number(),
  debt_count: z.number(),
  total_debt: z.number(),
});

const debtToEquitySchema = z.object({
  value: z.number(),
  total_debt: z.number(),
  net_worth: z.number(),
});

const workingCapitalSchema = z.object({
  value: z.number(),
  current_assets: z.number(),
  current_liabilities_30d: z.number(),
});

const breakevenSchema = z.object({
  monthly_value: z.number(),
  fixed_expenses: z.number(),
  variable_expenses: z.number(),
  variable_pct: z.number(),
});

const incomeVolatilitySchema = z.object({
  cv: z.number(),
  mean: z.number(),
  std_dev: z.number(),
  months_analyzed: z.number(),
  risk_level: z.enum(["critical", "high", "moderate", "low"]),
});

const dupontPersonalSchema = z.object({
  savings_margin: z.number(),
  asset_turnover: z.number(),
  equity_multiplier: z.number(),
  roe: z.number(),
});

const categoryTrendItemSchema = z.object({
  cid: z.string().optional(),
  cname: z.string(),
  color: z.string().nullable().optional(),
  m1: z.number(),
  m2: z.number(),
  m3: z.number(),
  biggest: z.number().optional(),
  trend_pct: z.number(),
  direction: z.enum(["up", "down", "stable"]),
});

const warningSignsSchema = z.object({
  burn_rising: z.boolean(),
  nw_declining: z.boolean(),
  runway_shrinking: z.boolean(),
  savings_negative: z.boolean(),
  count: z.number(),
});

const monthlyHistoryItemSchema = z.object({
  month: z.string(),
  income: z.number(),
  expense: z.number(),
  savings_rate: z.number(),
  net_worth: z.number(),
  burn_rate: z.number(),
  runway: z.number(),
});

export const cfaDiagnosticsSchema = z.object({
  savings_rate: savingsRateSchema,
  patrimony_hhi: patrimonyHhiSchema,
  wacc_personal: waccPersonalSchema,
  debt_to_equity: debtToEquitySchema,
  working_capital: workingCapitalSchema,
  breakeven: breakevenSchema,
  income_volatility: incomeVolatilitySchema,
  dupont_personal: dupontPersonalSchema,
  category_trends: z.array(categoryTrendItemSchema),
  warning_signs: warningSignsSchema,
  monthly_history: z.array(monthlyHistoryItemSchema),
});

// ─── Financial Engine v2 (State Machine + Dependency Graph) ────────

const engineV2StateSchema = z.enum([
  "SEM_DADOS", "CRISE", "SOBREVIVENCIA", "ESTABILIZACAO", "OTIMIZACAO", "CRESCIMENTO",
]);

const engineV2ClassificationSchema = z.object({
  reserve_ratio: z.number(),
  debt_stress: z.number(),
  savings_rate: z.number(),
  fi_progress: z.number(),
  income_cv: z.number(),
  base_months: z.number(),
  reserve_target: z.number(),
});

const engineV2MetricsSchema = z.object({
  avg_income: z.number(),
  avg_expense: z.number(),
  surplus: z.number(),
  burn_rate: z.number(),
  liquid_assets: z.number(),
  illiquid_assets: z.number(),
  total_debt: z.number(),
  debt_uncollateralized: z.number(),
  net_worth: z.number(),
  wacc_monthly: z.number(),
  hhi: z.number(),
  hhi_top_item: z.string(),
  hhi_top_pct: z.number(),
  cdi_monthly: z.number(),
  cdi_annual: z.number(),
  months_analyzed: z.number(),
});

const engineV2ActionSchema = z.object({
  priority: z.number(),
  rule: z.string(),
  action: z.string(),
  impact_monthly: z.number(),
  rationale: z.string(),
});

export const engineV2Schema = z.object({
  state: engineV2StateSchema,
  classification_inputs: engineV2ClassificationSchema,
  metrics: engineV2MetricsSchema,
  actions: z.array(engineV2ActionSchema),
  actions_count: z.number(),
});

export function logSchemaError(rpcName: string, parsed: z.SafeParseError<unknown>) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join(" | ");
  if (process.env.NODE_ENV === "development") console.error(`[Oniefy] RPC schema mismatch (${rpcName}): ${issues}`);
}
