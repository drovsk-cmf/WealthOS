import {
  assetsSummarySchema,
  depreciateAssetResultSchema,
  centerPnlSchema,
  centerExportSchema,
  allocateToCentersResultSchema,
  indexLatestResultSchema,
  economicIndicesResultSchema,
  workflowCreateResultSchema,
  generateTasksResultSchema,
  completeTaskResultSchema,
  reversalResultSchema,
  taxParameterSchema,
  budgetWithCategorySchema,
  topCategoriesResultSchema,
  balanceEvolutionResultSchema,
  budgetVsActualResultSchema,
  reconciliationCandidateSchema,
  matchTransactionsResultSchema,
  importBatchResultSchema,
  dashboardAllSchema,
  attentionQueueSchema,
  logSchemaError,
} from "@/lib/schemas/rpc";

const UUID = "11111111-1111-4111-8111-111111111111";

describe("RPC schemas (extended)", () => {
  // ─── Assets ──────────────────────────────────────────
  describe("assetsSummarySchema", () => {
    it("valida resumo de ativos completo", () => {
      const result = assetsSummarySchema.safeParse({
        total_value: 500000,
        total_acquisition: 600000,
        asset_count: 3,
        by_category: [
          { category: "real_estate", count: 1, total_value: 400000 },
          { category: "vehicle", count: 2, total_value: 100000 },
        ],
        expiring_insurance: [],
        total_depreciation: 100000,
      });
      expect(result.success).toBe(true);
    });

    it("rejeita categoria inválida", () => {
      const result = assetsSummarySchema.safeParse({
        total_value: 1,
        total_acquisition: 1,
        asset_count: 1,
        by_category: [{ category: "invalid_cat", count: 1, total_value: 1 }],
        expiring_insurance: [],
        total_depreciation: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  it("valida depreciateAssetResult", () => {
    expect(
      depreciateAssetResultSchema.safeParse({
        status: "ok",
        previous_value: 100,
        depreciation: 10,
        new_value: 90,
      }).success
    ).toBe(true);
  });

  // ─── Cost Centers ──────────────────────────────────────
  describe("centerPnlSchema", () => {
    it("valida P&L de centro com meses", () => {
      const result = centerPnlSchema.safeParse({
        center_id: UUID,
        center_name: "Família Geral",
        center_type: "cost_center",
        period_from: "2026-01-01",
        period_to: "2026-03-31",
        total_income: 1000,
        total_expense: 500,
        net_result: 500,
        monthly: [
          { month: "2026-01", income: 300, expense: 200 },
          { month: "2026-02", income: 400, expense: 150 },
          { month: "2026-03", income: 300, expense: 150 },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  it("valida centerExportSchema", () => {
    expect(
      centerExportSchema.safeParse({
        center: {
          id: UUID,
          name: "Família Geral",
          type: "cost_center",
          color: "#7E9487",
          created_at: "2026-01-01T00:00:00Z",
        },
        transactions: [
          {
            id: UUID,
            date: "2026-03-01",
            type: "expense",
            amount: 100,
            description: "Supermercado",
            is_paid: true,
            center_percentage: 100,
            center_amount: 100,
            coa_name: "Alimentação",
            group_type: "expense",
          },
        ],
        totals: { income: 0, expense: 100, net: -100 },
        exported_at: "2026-03-14T12:00:00Z",
      }).success
    ).toBe(true);
  });

  it("valida allocateToCentersResult", () => {
    expect(
      allocateToCentersResultSchema.safeParse({
        status: "ok",
        transaction_id: UUID,
        allocations: [
          { cost_center_id: UUID, percentage: 60, amount: 60 },
          { cost_center_id: "22222222-2222-4222-8222-222222222222", percentage: 40, amount: 40 },
        ],
      }).success
    ).toBe(true);
  });

  // ─── Economic Indices ──────────────────────────────────
  it("valida indexLatestResult", () => {
    expect(
      indexLatestResultSchema.safeParse({
        indices: [
          {
            index_type: "ipca",
            reference_date: "2026-02-01",
            value: 0.56,
            accumulated_12m: 4.87,
            accumulated_year: 1.12,
            source_primary: "bcb_sgs",
            fetched_at: "2026-03-14T06:00:00Z",
          },
        ],
      }).success
    ).toBe(true);
  });

  it("valida economicIndicesResult com accumulated nulls", () => {
    expect(
      economicIndicesResultSchema.safeParse({
        data: [
          {
            index_type: "selic",
            reference_date: "2026-03-01",
            value: 14.25,
            accumulated_12m: null,
            accumulated_year: null,
            source_primary: "bcb_sgs",
            fetched_at: "2026-03-14T06:00:00Z",
          },
        ],
      }).success
    ).toBe(true);
  });

  // ─── Workflows ─────────────────────────────────────────
  it("valida workflowCreateResult", () => {
    expect(
      workflowCreateResultSchema.safeParse({
        status: "created",
        workflow_id: UUID,
        name: "Extrato Conta Corrente",
      }).success
    ).toBe(true);
  });

  it("valida generateTasksResult", () => {
    expect(
      generateTasksResultSchema.safeParse({
        status: "ok",
        tasks_created: 5,
        workflows_skipped: 2,
      }).success
    ).toBe(true);
  });

  it("valida completeTaskResult", () => {
    expect(
      completeTaskResultSchema.safeParse({
        status: "completed",
        all_period_tasks_done: false,
      }).success
    ).toBe(true);
  });

  // ─── Reversal ──────────────────────────────────────────
  it("valida reversalResult", () => {
    expect(
      reversalResultSchema.safeParse({
        reversed_transaction_id: UUID,
        reversal_journal_id: UUID,
      }).success
    ).toBe(true);
  });

  it("valida reversalResult com journal null", () => {
    expect(
      reversalResultSchema.safeParse({
        reversed_transaction_id: UUID,
        reversal_journal_id: null,
      }).success
    ).toBe(true);
  });

  // ─── Tax Parameters ────────────────────────────────────
  it("valida taxParameterSchema", () => {
    expect(
      taxParameterSchema.safeParse({
        id: UUID,
        parameter_type: "irpf_mensal",
        valid_from: "2026-01-01",
        valid_until: null,
        brackets: [
          { min: 0, max: 2259.20, rate: 0, deduction: 0 },
          { min: 2259.21, max: 2826.65, rate: 7.5, deduction: 169.44 },
        ],
        limits: null,
        source_references: [
          { source: "RFB", url: "https://www.gov.br/receitafederal", date: "2025-12-30" },
        ],
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        updated_by: null,
      }).success
    ).toBe(true);
  });

  // ─── Budget with Category ──────────────────────────────
  it("valida budgetWithCategory", () => {
    expect(
      budgetWithCategorySchema.safeParse({
        id: UUID,
        user_id: UUID,
        category_id: UUID,
        month: "2026-03",
        planned_amount: 2000,
        alert_threshold: 80,
        adjustment_index: "ipca",
        approval_status: "approved",
        proposed_at: null,
        decided_at: null,
        decision_notes: null,
        coa_id: null,
        cost_center_id: null,
        family_member_id: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        categories: {
          name: "Alimentação",
          icon: "utensils",
          color: "#2F7A68",
          type: "expense",
        },
      }).success
    ).toBe(true);
  });

  it("rejeita adjustment_index inválido", () => {
    const result = budgetWithCategorySchema.safeParse({
      id: UUID,
      user_id: UUID,
      category_id: UUID,
      month: "2026-03",
      planned_amount: 2000,
      alert_threshold: 80,
      adjustment_index: "invalid_index",
      coa_id: null,
      cost_center_id: null,
      family_member_id: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      categories: { name: "Test", icon: null, color: null, type: "expense" },
    });
    expect(result.success).toBe(false);
  });

  // ─── Dashboard (additional) ────────────────────────────
  it("valida topCategoriesResult", () => {
    expect(
      topCategoriesResultSchema.safeParse({
        categories: [
          { category_name: "Alimentação", icon: "utensils", color: "#2F7A68", total: 1500, percentage: 45.5 },
          { category_name: "Transporte", icon: "car", color: "#56688F", total: 800, percentage: 24.2 },
        ],
        total_expense: 3300,
        month: "2026-03",
      }).success
    ).toBe(true);
  });

  it("valida balanceEvolutionResult", () => {
    expect(
      balanceEvolutionResultSchema.safeParse({
        data: [
          { month: "2026-01", balance: 10000, projected: 12000, income: 5000, expense: 3000 },
          { month: "2026-02", balance: 12000, projected: 14000, income: 5500, expense: 3500 },
        ],
        source: "calculated",
        months_requested: 6,
      }).success
    ).toBe(true);
  });

  it("rejeita balanceEvolution com source inválido", () => {
    expect(
      balanceEvolutionResultSchema.safeParse({
        data: [],
        source: "invalid",
        months_requested: 6,
      }).success
    ).toBe(false);
  });

  it("valida budgetVsActualResult", () => {
    expect(
      budgetVsActualResultSchema.safeParse({
        items: [
          {
            category_name: "Alimentação",
            category_icon: "utensils",
            category_color: "#2F7A68",
            budget_id: UUID,
            planned: 2000,
            alert_threshold: 80,
            actual: 1500,
            remaining: 500,
            pct_used: 75,
            status: "ok",
            family_member_id: null,
          },
        ],
        total_planned: 2000,
        total_actual: 1500,
        total_remaining: 500,
        pct_used: 75,
        month: "2026-03",
        budget_count: 1,
      }).success
    ).toBe(true);
  });

  it("rejeita budgetVsActual com status inválido", () => {
    const result = budgetVsActualResultSchema.safeParse({
      items: [
        {
          category_name: "Test",
          category_icon: null,
          category_color: null,
          budget_id: UUID,
          planned: 100,
          alert_threshold: 80,
          actual: 90,
          remaining: 10,
          pct_used: 90,
          status: "invalid_status",
          family_member_id: null,
        },
      ],
      total_planned: 100,
      total_actual: 90,
      total_remaining: 10,
      pct_used: 90,
      month: "2026-03",
      budget_count: 1,
    });
    expect(result.success).toBe(false);
  });

  // ─── logSchemaError ────────────────────────────────────
  describe("logSchemaError", () => {
    it("loga mensagem formatada no console.error", () => {
      const env = process.env as Record<string, string | undefined>;
      const originalEnv = env.NODE_ENV;
      env.NODE_ENV = "development";
      try {
        const spy = jest.spyOn(console, "error").mockImplementation();
        const badParse = assetsSummarySchema.safeParse({ total_value: "not a number" });
        if (!badParse.success) {
          logSchemaError("get_assets_summary", badParse);
        }
        expect(spy).toHaveBeenCalledWith(
          expect.stringContaining("[Oniefy] RPC schema mismatch (get_assets_summary)")
        );
        spy.mockRestore();
      } finally {
        env.NODE_ENV = originalEnv;
      }
    });
  });

  // ─── Reconciliation ────────────────────────────────────
  describe("reconciliation schemas", () => {
    it("valida reconciliationCandidate", () => {
      expect(
        reconciliationCandidateSchema.safeParse({
          id: UUID,
          description: "Aluguel",
          amount: 2500,
          date: "2026-03-10",
          due_date: "2026-03-10",
          type: "expense",
          payment_status: "pending",
          category_id: UUID,
          recurrence_id: UUID,
          amount_diff: 50,
          days_diff: 2,
          match_score: 12.5,
        }).success
      ).toBe(true);
    });

    it("valida reconciliationCandidate com nulls", () => {
      expect(
        reconciliationCandidateSchema.safeParse({
          id: UUID,
          description: null,
          amount: 100,
          date: "2026-03-01",
          due_date: null,
          type: "expense",
          payment_status: "overdue",
          category_id: null,
          recurrence_id: null,
          amount_diff: 0,
          days_diff: 0,
          match_score: 0,
        }).success
      ).toBe(true);
    });

    it("valida matchTransactionsResult", () => {
      expect(
        matchTransactionsResultSchema.safeParse({
          status: "matched",
          pending_id: UUID,
          imported_id: "22222222-2222-4222-8222-222222222222",
          adjustment: -15.50,
          final_amount: 2484.50,
        }).success
      ).toBe(true);
    });

    it("valida importBatchResult com matched (v2)", () => {
      expect(
        importBatchResultSchema.safeParse({
          status: "ok",
          imported: 10,
          skipped: 2,
          categorized: 8,
          matched: 3,
          batch_id: UUID,
        }).success
      ).toBe(true);
    });

    it("valida importBatchResult sem matched (backward compat)", () => {
      const result = importBatchResultSchema.safeParse({
        status: "ok",
        imported: 5,
        skipped: 1,
        categorized: 3,
        batch_id: UUID,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.matched).toBe(0);
      }
    });
  });

  // ─── Attention Queue ─────────────────────────────────
  describe("attentionQueueSchema", () => {
    it("valida attention queue completa", () => {
      expect(
        attentionQueueSchema.safeParse({
          uncategorized: 3,
          overdue: 1,
          dueSoon: 2,
          recentImportCount: 5,
          lastTransactionDaysAgo: 2,
        }).success
      ).toBe(true);
    });

    it("aceita lastTransactionDaysAgo null", () => {
      expect(
        attentionQueueSchema.safeParse({
          uncategorized: 0,
          overdue: 0,
          dueSoon: 0,
          recentImportCount: 0,
          lastTransactionDaysAgo: null,
        }).success
      ).toBe(true);
    });
  });

  // ─── Dashboard All ───────────────────────────────────
  describe("dashboardAllSchema", () => {
    it("valida resposta completa do get_dashboard_all", () => {
      const result = dashboardAllSchema.safeParse({
        summary: {
          total_current_balance: 1000,
          total_projected_balance: 1200,
          active_accounts: 2,
          month_income: 5000,
          month_expense: 3000,
          month_start: "2026-03-01",
          month_end: "2026-04-01",
        },
        balance_sheet: {
          liquid_assets: 8000,
          illiquid_assets: 50000,
          total_assets: 58000,
          total_liabilities: 10000,
          net_worth: 48000,
        },
        solvency: {
          tier1_total: 5000,
          tier2_total: 3000,
          tier3_total: 50000,
          tier4_total: 0,
          total_patrimony: 58000,
          burn_rate: 3000,
          runway_months: 2.7,
          lcr: 0.44,
          months_analyzed: 3,
        },
        top_categories: {
          categories: [
            { category_name: "Alimentação", icon: null, color: "#E07A5F", total: 1500, percentage: 50 },
          ],
          total_expense: 3000,
          month: "2026-03-01",
        },
        evolution: {
          data: [{ month: "2026-02-01", balance: 900, projected: 1000, income: 5000, expense: 4100 }],
          source: "calculated",
          months_requested: 6,
        },
        budget: {
          items: [],
          total_planned: 0,
          total_actual: 0,
          total_remaining: 0,
          pct_used: 0,
          month: "2026-03-01",
          budget_count: 0,
        },
        attention: {
          uncategorized: 0,
          overdue: 0,
          dueSoon: 0,
          recentImportCount: 0,
          lastTransactionDaysAgo: null,
        },
      });
      expect(result.success).toBe(true);
    });

    it("rejeita se summary ausente", () => {
      expect(
        dashboardAllSchema.safeParse({
          balance_sheet: {},
          solvency: {},
          top_categories: {},
          evolution: {},
          budget: {},
          attention: {},
        }).success
      ).toBe(false);
    });
  });
});
