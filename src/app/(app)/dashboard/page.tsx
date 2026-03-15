"use client";

import React from "react";

/**
 * Oniefy - Início (Dashboard) - UX-H1-06
 *
 * 3-section vertical layout:
 * Seção 1: Card narrativo (P0 empty, P4 post-import, P5 neutral)
 * Seção 2: Fila de atenção (até 5 pendências)
 * Seção 3: Resumo financeiro (conteúdo original, abaixo da dobra)
 */

import {
  useDashboardSummary,
  useBalanceSheet,
  useSolvencyMetrics,
  useTopCategories,
  useBalanceEvolution,
  useBudgetVsActual,
} from "@/lib/hooks/use-dashboard";
import { useAnalytics } from "@/lib/hooks/use-analytics";

import {
  SummaryCards,
  BalanceSheetCard,
  TopCategoriesCard,
  UpcomingBillsCard,
  BudgetSummaryCard,
  SolvencyPanel,
  BalanceEvolutionChart,
  QuickEntryFab,
  NarrativeCard,
  AttentionQueue,
  useAttentionItems,
} from "@/components/dashboard";

export default function DashboardPage() {
  const { trackDashboardView } = useAnalytics();

  // Track dashboard view once per session
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => { trackDashboardView(); }, []);

  const summary = useDashboardSummary();
  const balanceSheet = useBalanceSheet();
  const solvency = useSolvencyMetrics();
  const topCategories = useTopCategories();
  const evolution = useBalanceEvolution(6);
  const budgetVsActual = useBudgetVsActual();
  const attention = useAttentionItems();

  const hasError =
    summary.error || balanceSheet.error || solvency.error;

  // Derive narrative state from attention data
  const hasTransactions =
    (summary.data?.month_income ?? 0) > 0 ||
    (summary.data?.month_expense ?? 0) > 0 ||
    (attention.data?.uncategorized ?? 0) > 0 ||
    (attention.data?.overdue ?? 0) > 0;
  const hasRecentImport = (attention.data?.recentImportCount ?? 0) > 0;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Início</h2>
        <p className="text-sm text-muted-foreground">
          Visão geral das suas finanças
        </p>
      </div>

      {/* Error banner */}
      {hasError && (
        <div className="rounded-lg border border-terracotta/20 bg-terracotta/10 p-4">
          <p className="text-sm font-medium text-terracotta">
            Erro ao carregar dados do dashboard
          </p>
          <p className="mt-1 text-xs text-terracotta">
            {(summary.error || balanceSheet.error || solvency.error)?.message}
          </p>
          <button
            onClick={() => {
              summary.refetch();
              balanceSheet.refetch();
              solvency.refetch();
            }}
            className="mt-2 rounded bg-terracotta/15 px-3 py-1 text-xs font-medium text-terracotta hover:bg-terracotta/20"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* ═══ SEÇÃO 1: Card Narrativo (UX-H1-06) ═══ */}
      <NarrativeCard
        summary={summary.data}
        hasTransactions={hasTransactions}
        hasRecentImport={hasRecentImport}
        recentImportCount={attention.data?.recentImportCount}
        isLoading={summary.isLoading || attention.isLoading}
      />

      {/* ═══ SEÇÃO 2: Fila de Atenção (UX-H1-06) ═══ */}
      <AttentionQueue budgetData={budgetVsActual.data} />

      {/* ═══ SEÇÃO 3: Resumo Financeiro (abaixo da dobra) ═══ */}

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

      {/* ═══ Cockpit de Solvência ═══ */}

      {/* DASH-09 to DASH-12 + DASH-06: KPIs de solvência + Tiers */}
      <SolvencyPanel data={solvency.data} isLoading={solvency.isLoading} />

      {/* DASH-08: FAB lançamento rápido */}
      <QuickEntryFab />
    </div>
  );
}
