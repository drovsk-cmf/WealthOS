"use client";

import React from "react";

/**
 * Oniefy - Início (Dashboard) - UX-H1-06 + UX-H2-03 + P5
 *
 * Progressive dashboard with 4 maturity levels (P5, adendo v1.5 §2.4):
 * - Novo (0-10 tx): setup, import CTA, narrative, attention, summary
 * - Ativo (11-50 tx): + top categories, upcoming bills, budget
 * - Engajado (51+ tx, 2+ meses): + balance sheet, evolution, solvency
 * - Avançado (opt-in, futuro): tudo
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
  ImportCTA,
  MfaReminderBanner,
  ScannerCard,
  NetWorthChart,
} from "@/components/dashboard";

export default function DashboardPage() {
  const { trackDashboardView } = useAnalytics();

  // Track dashboard view once per session
  React.useEffect(() => { trackDashboardView(); }, [trackDashboardView]);

  // Single RPC: all dashboard data in 1 roundtrip
  const dash = useDashboardAll();
  // Snapshots kept separate (10min staleTime, only for sparklines)
  const snapshots = useMonthlySnapshots(24);
  const disclosure = useProgressiveDisclosure();

  const d = dash.data;

  // P5: Dashboard maturity level (adendo v1.5 §2.4)
  const level = disclosure.data?.maturityLevel ?? "new";
  const showMidTier = level !== "new"; // active, engaged, advanced
  const showFullTier = level === "engaged" || level === "advanced";

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

      {/* ═══ P4: MFA Reminder (alerta de segurança = prioridade máxima) ═══ */}
      <MfaReminderBanner />

      {/* ═══ SEÇÃO 0: Resumo Financeiro (sempre visível, topo) ═══ */}
      {/* DASH-01 + DASH-02: Saldo consolidado + Receitas vs Despesas */}
      <SummaryCards data={d?.summary} isLoading={dash.isLoading} />

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

      {/* ═══ SEÇÃO 1: Setup Journey (oculto após conclusão) ═══ */}
      <SetupJourneyCard />

      {/* ═══ P2: CTA de Importação (oculto após 20 transações) ═══ */}
      <ImportCTA
        transactionCount={disclosure.data?.totalTransactions ?? 0}
        isLoading={disclosure.isLoading}
      />

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

      {/* Scanner: "Limpeza de Disco" Financeira (P5: ativo+) */}
      {showMidTier && <ScannerCard />}

      {/* 3-column layout: Top Categorias | Contas a Vencer | Orçamento (P5: ativo+) */}
      {showMidTier && (
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
      )}

      {/* CTB-05: Balanço Patrimonial + DASH-07: Evolução (P5: engajado+) */}
      {showFullTier && (
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
      )}

      {/* E2: Patrimônio Líquido ao longo do tempo (P5: engajado+) */}
      {showFullTier && (
        <NetWorthChart
          snapshots={snapshots.data ?? []}
          isLoading={snapshots.isLoading}
        />
      )}

      {/* ═══ Fôlego Financeiro (P5: engajado+) ═══ */}

      {/* DASH-09 to DASH-12 + DASH-06: KPIs de solvência + Níveis */}
      {showFullTier && (
        <SolvencyPanel data={d?.solvency} isLoading={dash.isLoading} snapshots={snapshots.data} />
      )}

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
