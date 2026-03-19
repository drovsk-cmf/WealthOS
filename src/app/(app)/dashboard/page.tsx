"use client";

import React from "react";

/**
 * Oniefy - Início (Dashboard) - UX-H1-06 + UX-H2-03
 *
 * 3-section vertical layout:
 * Seção 1: Card narrativo (P0-P5: empty, post-import, budget, end-of-month, inactive, neutral)
 * Seção 2: Fila de atenção (até 5 pendências)
 * Seção 3: Resumo financeiro (conteúdo original, abaixo da dobra)
 *
 * Performance: single RPC get_dashboard_all (1 roundtrip instead of 9+)
 */

import {
  useDashboardAll,
  useMonthlySnapshots,
} from "@/lib/hooks/use-dashboard";
import { useAnalytics } from "@/lib/hooks/use-analytics";
import { useProgressiveDisclosure } from "@/lib/hooks/use-progressive-disclosure";

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
  SetupJourneyCard,
} from "@/components/dashboard";

export default function DashboardPage() {
  const { trackDashboardView } = useAnalytics();

  // Track dashboard view once per session
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => { trackDashboardView(); }, []);

  // Single RPC: all dashboard data in 1 roundtrip
  const dash = useDashboardAll();
  // Snapshots kept separate (10min staleTime, only for sparklines)
  const snapshots = useMonthlySnapshots(12);
  const disclosure = useProgressiveDisclosure();

  const d = dash.data;

  // Derive narrative state from attention data
  const hasTransactions =
    (d?.summary.month_income ?? 0) > 0 ||
    (d?.summary.month_expense ?? 0) > 0 ||
    (d?.attention.uncategorized ?? 0) > 0 ||
    (d?.attention.overdue ?? 0) > 0;
  const hasRecentImport = (d?.attention.recentImportCount ?? 0) > 0;

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
      {dash.error && (
        <div className="rounded-lg border border-terracotta/20 bg-terracotta/10 p-4">
          <p className="text-sm font-medium text-terracotta">
            Erro ao carregar dados do dashboard
          </p>
          <p className="mt-1 text-xs text-terracotta">
            {dash.error?.message}
          </p>
          <button type="button"
            onClick={() => dash.refetch()}
            className="mt-2 rounded bg-terracotta/15 px-3 py-1 text-xs font-medium text-terracotta hover:bg-terracotta/20"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* ═══ SEÇÃO 0: Setup Journey (oculto após conclusão) ═══ */}
      <SetupJourneyCard />

      {/* ═══ SEÇÃO 1: Card Narrativo (UX-H1-06 + UX-H2-03) ═══ */}
      <NarrativeCard
        summary={d?.summary}
        hasTransactions={hasTransactions}
        hasRecentImport={hasRecentImport}
        recentImportCount={d?.attention.recentImportCount}
        budgetData={d?.budget}
        lastTransactionDaysAgo={d?.attention.lastTransactionDaysAgo}
        isLoading={dash.isLoading}
      />

      {/* ═══ SEÇÃO 2: Fila de Atenção (UX-H1-06) ═══ */}
      <AttentionQueue
        budgetData={d?.budget}
        attentionData={d?.attention ? { ...d.attention, staleAccounts: 0 } : undefined}
        isLoading={dash.isLoading}
        showFiscalTrigger={disclosure.data?.showFiscalTrigger}
      />

      {/* ═══ SEÇÃO 3: Resumo Financeiro (abaixo da dobra) ═══ */}

      {/* DASH-01 + DASH-02: Saldo consolidado + Receitas vs Despesas */}
      <SummaryCards data={d?.summary} isLoading={dash.isLoading} />

      {/* 3-column layout: Top Categorias | Contas a Vencer | Orçamento */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* DASH-03: Top categorias */}
        <TopCategoriesCard
          data={d?.topCategories}
          isLoading={dash.isLoading}
        />

        {/* DASH-04: Próximas contas a vencer */}
        <UpcomingBillsCard bills={dash.data?.upcomingBills ?? []} isLoading={dash.isLoading} />

        {/* DASH-05: Resumo do orçamento */}
        <BudgetSummaryCard
          data={d?.budget}
          isLoading={dash.isLoading}
        />
      </div>

      {/* CTB-05: Balanço Patrimonial + DASH-07: Evolução */}
      <div className="grid gap-4 lg:grid-cols-2">
        <BalanceSheetCard
          data={d?.balanceSheet}
          isLoading={dash.isLoading}
        />
        <BalanceEvolutionChart
          data={d?.evolution}
          isLoading={dash.isLoading}
        />
      </div>

      {/* ═══ Cockpit de Solvência ═══ */}

      {/* DASH-09 to DASH-12 + DASH-06: KPIs de solvência + Tiers */}
      <SolvencyPanel data={d?.solvency} isLoading={dash.isLoading} snapshots={snapshots.data} />

      {/* DASH-08: FAB lançamento rápido */}
      <QuickEntryFab />

      {/* D7.11: Sync indicator */}
      {dash.dataUpdatedAt > 0 && (
        <p className="text-center text-[11px] text-muted-foreground/60">
          Atualizado há{" "}
          {Math.max(1, Math.round((Date.now() - dash.dataUpdatedAt) / 60000))} min
        </p>
      )}
    </div>
  );
}
