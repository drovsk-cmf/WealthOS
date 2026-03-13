import {
  balanceSheetSchema,
  dashboardSummarySchema,
  fiscalProjectionSchema,
  fiscalReportSchema,
  importBatchResultSchema,
  solvencyMetricsSchema,
  transactionResultSchema,
  transferResultSchema,
} from "@/lib/schemas/rpc";

describe("WEA-002 RPC schemas", () => {
  it("valida dashboard summary válido", () => {
    const result = dashboardSummarySchema.safeParse({
      total_current_balance: 1,
      total_projected_balance: 2,
      active_accounts: 1,
      month_income: 10,
      month_expense: 3,
      month_start: "2026-03-01",
      month_end: "2026-03-31",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita dashboard summary inválido", () => {
    const result = dashboardSummarySchema.safeParse({ total_current_balance: "1" });
    expect(result.success).toBe(false);
  });

  it("valida balance sheet e solvency válidos", () => {
    expect(
      balanceSheetSchema.safeParse({
        liquid_assets: 1,
        illiquid_assets: 2,
        total_assets: 3,
        total_liabilities: 1,
        net_worth: 2,
      }).success
    ).toBe(true);

    expect(
      solvencyMetricsSchema.safeParse({
        tier1_total: 1,
        tier2_total: 2,
        tier3_total: 3,
        tier4_total: 4,
        total_patrimony: 10,
        burn_rate: 100,
        runway_months: 20,
        lcr: 1.5,
        months_analyzed: 6,
      }).success
    ).toBe(true);
  });

  it("valida fiscal report e projection válidos", () => {
    expect(
      fiscalReportSchema.safeParse({
        year: 2026,
        period_start: "2026-01-01",
        period_end: "2026-12-31",
        by_treatment: [
          {
            tax_treatment: "tributavel",
            group_type: "income",
            total_revenue: 1000,
            total_expense: 0,
            entry_count: 1,
            accounts: [{ coa_code: "4.1", coa_name: "Receita", total: 1000 }],
          },
        ],
        totals: {
          total_tributavel_revenue: 1000,
          total_isento_revenue: 0,
          total_dedutivel_expense: 0,
          total_transactions: 1,
        },
      }).success
    ).toBe(true);

    expect(
      fiscalProjectionSchema.safeParse({
        year: 2026,
        months_elapsed: 3,
        months_remaining: 9,
        ytd_taxable_income: 10000,
        ytd_deductible_expenses: 1000,
        projected_annual_income: 40000,
        projected_annual_deductible: 3000,
        taxable_base: 37000,
        estimated_annual_tax: 5000,
        annual_reduction_applied: 0,
        ytd_irrf_withheld: 1000,
        tax_gap: 4000,
        monthly_provision: 500,
        disclaimer: "ok",
      }).success
    ).toBe(true);
  });

  it("valida resultados de transaction e transfer", () => {
    expect(
      transactionResultSchema.safeParse({
        transaction_id: "11111111-1111-4111-8111-111111111111",
        journal_entry_id: null,
      }).success
    ).toBe(true);

    expect(
      transferResultSchema.safeParse({
        from_transaction_id: "11111111-1111-4111-8111-111111111111",
        to_transaction_id: "22222222-2222-4222-8222-222222222222",
        journal_entry_id: null,
        amount: 10,
      }).success
    ).toBe(true);
  });

  it("rejeita import batch inválido", () => {
    const result = importBatchResultSchema.safeParse({ status: "ok" });
    expect(result.success).toBe(false);
  });
});
