"use client";

/**
 * NarrativeCard - UX-H1-06 (Seção 1) + UX-H2-03 (P1-P3)
 *
 * Motor narrativo com 6 estados priorizados:
 * P0: Estado vazio pós-onboarding (0 transações)
 * P4: Pós-importação (transações importadas nas últimas 24h)
 * P1: Orçamento pressionado (>80% usado)
 * P3: Fim de mês (últimos 5 dias do mês)
 * P2: Inatividade (nenhuma transação nos últimos 7 dias)
 * P5: Resumo neutro (estado padrão)
 */

import {
  Lightbulb,
  FileCheck,
  TrendingUp,
  PieChart,
  Calendar,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";
import type { DashboardSummary, BudgetVsActualResult } from "@/lib/hooks/use-dashboard";

type NarrativeState =
  | "empty"
  | "post_import"
  | "budget_pressed"
  | "end_of_month"
  | "inactive"
  | "neutral";

interface NarrativeCardProps {
  summary: DashboardSummary | undefined;
  hasTransactions: boolean;
  hasRecentImport: boolean;
  recentImportCount?: number;
  budgetData?: BudgetVsActualResult;
  lastTransactionDaysAgo?: number;
  isLoading: boolean;
}

export function NarrativeCard({
  summary,
  hasTransactions,
  hasRecentImport,
  recentImportCount,
  budgetData,
  lastTransactionDaysAgo,
  isLoading,
}: NarrativeCardProps) {
  if (isLoading) {
    return <div className="h-20 animate-pulse rounded-lg bg-muted" />;
  }

  const state = resolveState(
    hasTransactions,
    hasRecentImport,
    budgetData,
    lastTransactionDaysAgo
  );

  // ─── P0: Empty ─────────────────────────────────────
  if (state === "empty") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <Lightbulb className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium">
            Comece registrando suas primeiras movimentações
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Crie uma conta bancária e registre uma transação, ou importe um
            extrato. Em minutos você terá visibilidade do seu mês.
          </p>
          <div className="mt-2 flex gap-2">
            <Link
              href="/accounts"
              className="rounded-md btn-cta px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              Criar conta
            </Link>
            <Link
              href="/connections"
              className="rounded-md btn-alive border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
            >
              Importar extrato
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── P4: Post-import ───────────────────────────────
  if (state === "post_import") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-verdant/20 bg-verdant/5 p-4">
        <FileCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-verdant" />
        <div>
          <p className="text-sm font-medium">
            {recentImportCount
              ? `${recentImportCount} transações importadas`
              : "Importação concluída"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Revise as transações e categorize as que ficaram pendentes para ter
            uma visão precisa do mês.
          </p>
          <div className="mt-2">
            <Link
              href="/transactions"
              className="rounded-md bg-verdant/15 px-3 py-1.5 text-xs font-medium text-verdant hover:bg-verdant/25"
            >
              Revisar transações
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── P1: Budget pressured (UX-H2-03) ──────────────
  if (state === "budget_pressed" && budgetData) {
    const pct = Math.round(budgetData.pct_used);
    const remaining = budgetData.total_remaining;
    const isOver = pct >= 100;

    return (
      <div
        className={`flex items-start gap-3 rounded-lg border p-4 ${
          isOver
            ? "border-terracotta/20 bg-terracotta/5"
            : "border-burnished/20 bg-burnished/5"
        }`}
      >
        <PieChart
          className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
            isOver ? "text-terracotta" : "text-burnished"
          }`}
        />
        <div>
          <p className="text-sm font-medium">
            {isOver
              ? `Orçamento ultrapassado (${pct}%)`
              : `Orçamento a ${pct}% do limite`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isOver
              ? `Gastos excederam o planejado em ${formatCurrency(Math.abs(remaining))}.`
              : `Restam ${formatCurrency(remaining)} para o restante do mês.`}
          </p>
          <div className="mt-2">
            <Link
              href="/budgets"
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                isOver
                  ? "bg-terracotta/15 text-terracotta hover:bg-terracotta/25"
                  : "bg-burnished/15 text-burnished hover:bg-burnished/25"
              }`}
            >
              Ver orçamento
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── P3: End of month (UX-H2-03) ──────────────────
  if (state === "end_of_month" && summary) {
    const daysLeft = daysUntilEndOfMonth();
    const income = summary.month_income;
    const expense = summary.month_expense;

    return (
      <div className="flex items-start gap-3 rounded-lg border border-info-slate/20 bg-info-slate/5 p-4">
        <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-info-slate" />
        <div>
          <p className="text-sm font-medium">
            {daysLeft === 0
              ? "Último dia do mês"
              : `${daysLeft} dia${daysLeft > 1 ? "s" : ""} para o fechamento`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Até agora: receitas{" "}
            <span className="font-medium text-verdant">
              <Mv>{formatCurrency(income)}</Mv>
            </span>
            , despesas{" "}
            <span className="font-medium text-terracotta">
              <Mv>{formatCurrency(expense)}</Mv>
            </span>
            . Confira se há lançamentos pendentes.
          </p>
        </div>
      </div>
    );
  }

  // ─── P2: Inactive (UX-H2-03) ──────────────────────
  if (state === "inactive") {
    return (
      <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
        <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">
            Nenhum lançamento nos últimos 7 dias
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Registre suas movimentações recentes para manter a visão do mês
            atualizada.
          </p>
          <div className="mt-2 flex gap-2">
            <Link
              href="/transactions"
              className="rounded-md btn-cta px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              Novo lançamento
            </Link>
            <Link
              href="/connections"
              className="rounded-md btn-alive border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
            >
              Importar extrato
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── P5: Neutral summary ──────────────────────────
  if (!summary) return null;

  const income = summary.month_income;
  const expense = summary.month_expense;
  const net = income - expense;

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
      <TrendingUp className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">
          {net >= 0 ? "Mês com saldo positivo" : "Despesas superaram receitas"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Receitas{" "}
          <span className="font-medium text-verdant">
            <Mv>{formatCurrency(income)}</Mv>
          </span>
          {" · "}Despesas{" "}
          <span className="font-medium text-terracotta">
            <Mv>{formatCurrency(expense)}</Mv>
          </span>
          {" · "}Resultado{" "}
          <span
            className={`font-medium ${net >= 0 ? "text-verdant" : "text-terracotta"}`}
          >
            <Mv>{formatCurrency(Math.abs(net))}</Mv>
          </span>
        </p>
      </div>
    </div>
  );
}

// ─── State resolution (priority order) ────────────────

function resolveState(
  hasTransactions: boolean,
  hasRecentImport: boolean,
  budgetData?: BudgetVsActualResult,
  lastTransactionDaysAgo?: number
): NarrativeState {
  if (!hasTransactions) return "empty";
  if (hasRecentImport) return "post_import";
  if (budgetData && budgetData.budget_count > 0 && budgetData.pct_used > 80) {
    return "budget_pressed";
  }
  if (daysUntilEndOfMonth() <= 5) return "end_of_month";
  if (lastTransactionDaysAgo !== undefined && lastTransactionDaysAgo >= 7) {
    return "inactive";
  }
  return "neutral";
}

function daysUntilEndOfMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.getDate() - now.getDate();
}
