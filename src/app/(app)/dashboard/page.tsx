"use client";

/**
 * Oniefy - Dashboard (Phase 3)
 *
 * Layout conforme adendo v1.4, seção 2.4:
 * - Seção A: Visão Operacional (DASH-01 to DASH-05)
 * - Seção B: Cockpit de Solvência (DASH-06, DASH-07, DASH-09 to DASH-12)
 * - CTB-05: Balanço Patrimonial (entre as duas seções)
 * - DASH-08: FAB lançamento rápido (flutuante)
 */

import {
  useDashboardSummary,
  useBalanceSheet,
  useSolvencyMetrics,
  useTopCategories,
  useBalanceEvolution,
  useBudgetVsActual,
} from "@/lib/hooks/use-dashboard";

import {
  SummaryCards,
  BalanceSheetCard,
  TopCategoriesCard,
  UpcomingBillsCard,
  BudgetSummaryCard,
  SolvencyPanel,
  BalanceEvolutionChart,
  QuickEntryFab,
} from "@/components/dashboard";

export default function DashboardPage() {
  const summary = useDashboardSummary();
  const balanceSheet = useBalanceSheet();
  const solvency = useSolvencyMetrics();
  const topCategories = useTopCategories();
  const evolution = useBalanceEvolution(6);
  const budgetVsActual = useBudgetVsActual();

  const hasError =
    summary.error || balanceSheet.error || solvency.error;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Visão geral das suas finanças
        </p>
      </div>

      {/* Error banner */}
      {hasError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            Erro ao carregar dados do dashboard
          </p>
          <p className="mt-1 text-xs text-red-600">
            {(summary.error || balanceSheet.error || solvency.error)?.message}
          </p>
          <button
            onClick={() => {
              summary.refetch();
              balanceSheet.refetch();
              solvency.refetch();
            }}
            className="mt-2 rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* ═══ SEÇÃO A: Visão Operacional ═══ */}

      {/* DASH-01 + DASH-02: Saldo consolidado + Receitas vs Despesas */}
      <SummaryCards data={summary.data} isLoading={summary.isLoading} />

      {/* 3-column layout: Top Categorias | Contas a Vencer | Orçamento */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* DASH-03: Top categorias */}
        <TopCategoriesCard
          data={topCategories.data}
          isLoading={topCategories.isLoading}
        />

        {/* DASH-04: Próximas contas a vencer */}
        <UpcomingBillsCard />

        {/* DASH-05: Resumo do orçamento */}
        <BudgetSummaryCard
          data={budgetVsActual.data}
          isLoading={budgetVsActual.isLoading}
        />
      </div>

      {/* CTB-05: Balanço Patrimonial + DASH-07: Evolução */}
      <div className="grid gap-4 lg:grid-cols-2">
        <BalanceSheetCard
          data={balanceSheet.data}
          isLoading={balanceSheet.isLoading}
        />
        <BalanceEvolutionChart
          data={evolution.data}
          isLoading={evolution.isLoading}
        />
      </div>

      {/* ═══ SEÇÃO B: Cockpit de Solvência ═══ */}

      {/* DASH-09 to DASH-12 + DASH-06: KPIs de solvência + Tiers */}
      <SolvencyPanel data={solvency.data} isLoading={solvency.isLoading} />

      {/* DASH-08: FAB lançamento rápido */}
      <QuickEntryFab />
    </div>
  );
}
