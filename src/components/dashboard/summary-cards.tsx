"use client";

/**
 * SummaryCards - DASH-01 (saldo consolidado) + DASH-02 (receitas vs despesas)
 *
 * 4 cards: Saldo Atual, Saldo Previsto, Receitas do Mês, Despesas do Mês.
 * Saldo previsto exibido como valor secundário (adendo v1.1).
 */

import { formatCurrency } from "@/lib/utils";
import type { DashboardSummary } from "@/lib/hooks/use-dashboard";

interface Props {
  data: DashboardSummary | undefined;
  isLoading: boolean;
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-7 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-3 w-20 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function SummaryCards({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const balance = data?.total_current_balance ?? 0;
  const projected = data?.total_projected_balance ?? 0;
  const income = data?.month_income ?? 0;
  const expense = data?.month_expense ?? 0;
  const netMonth = income - expense;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Saldo Atual (DASH-01) */}
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Saldo Atual
        </p>
        <p
          className={`mt-1 text-2xl font-bold tabular-nums ${
            balance >= 0 ? "text-foreground" : "text-red-500"
          }`}
        >
          {formatCurrency(balance)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Previsto: {formatCurrency(projected)}
        </p>
      </div>

      {/* Receitas do Mês (DASH-02) */}
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Receitas do Mês
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-green-600">
          {formatCurrency(income)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {data?.active_accounts ?? 0} contas ativas
        </p>
      </div>

      {/* Despesas do Mês (DASH-02) */}
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Despesas do Mês
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-red-500">
          {formatCurrency(expense)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {income > 0
            ? `${((expense / income) * 100).toFixed(0)} % da receita`
            : "Sem receita no mês"}
        </p>
      </div>

      {/* Resultado do Mês */}
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Resultado do Mês
        </p>
        <p
          className={`mt-1 text-2xl font-bold tabular-nums ${
            netMonth >= 0 ? "text-green-600" : "text-red-500"
          }`}
        >
          {netMonth >= 0 ? "+" : ""}
          {formatCurrency(netMonth)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Receitas - Despesas
        </p>
      </div>
    </div>
  );
}
