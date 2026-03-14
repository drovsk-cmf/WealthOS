"use client";

/**
 * BudgetSummaryCard - DASH-05
 *
 * Resumo do orçamento: barra de progresso total + items por categoria.
 * Status visual: ok (verde), warning (amarelo), exceeded (vermelho).
 * Link para módulo Orçamento completo.
 */

import Link from "next/link";
import { PieChart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";
import type { BudgetVsActualResult } from "@/lib/hooks/use-dashboard";

interface Props {
  data: BudgetVsActualResult | undefined;
  isLoading: boolean;
}

const STATUS_STYLES = {
  ok: { bar: "bg-verdant", badge: "" },
  warning: { bar: "bg-burnished", badge: "text-burnished bg-burnished/15" },
  exceeded: { bar: "bg-terracotta", badge: "text-terracotta bg-terracotta/15" },
};

export function BudgetSummaryCard({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-muted" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-5 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const budgetCount = data?.budget_count ?? 0;
  const totalPlanned = data?.total_planned ?? 0;
  const totalActual = data?.total_actual ?? 0;
  const pctUsed = data?.pct_used ?? 0;
  const items = data?.items ?? [];

  // Show max 4 budget items on dashboard
  const displayItems = items.slice(0, 4);

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Orçamento do Mês</h3>
        <Link
          href="/budgets"
          className="text-xs text-primary hover:underline"
        >
          {budgetCount > 0 ? "Gerenciar" : "Criar"}
        </Link>
      </div>

      {budgetCount === 0 ? (
        <div className="mt-6 text-center">
          <PieChart className="h-6 w-6 text-muted-foreground" />
          <p className="mt-1 text-sm text-muted-foreground">
            Nenhum orçamento definido
          </p>
          <Link
            href="/budgets"
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            Definir orçamento
          </Link>
        </div>
      ) : (
        <>
          {/* Overall progress */}
          <div className="mt-4">
            <div className="flex items-end justify-between">
              <span className="text-lg font-bold tabular-nums">
                {pctUsed.toFixed(0)} %
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                <Mv>{formatCurrency(totalActual)}</Mv> / <Mv>{formatCurrency(totalPlanned)}</Mv>
              </span>
            </div>
            <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pctUsed >= 100
                    ? "bg-terracotta"
                    : pctUsed >= 80
                      ? "bg-burnished"
                      : "bg-verdant"
                }`}
                style={{ width: `${Math.min(pctUsed, 100)}%` }}
              />
            </div>
          </div>

          {/* Per-category breakdown */}
          <div className="mt-4 space-y-2">
            {displayItems.map((item) => {
              const styles = STATUS_STYLES[item.status];
              return (
                <div key={item.budget_id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: item.category_color || "#7E9487",
                        }}
                      />
                      <span className="truncate">{item.category_name}</span>
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {item.pct_used.toFixed(0)} %
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${styles.bar}`}
                      style={{ width: `${Math.min(item.pct_used, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {items.length > 4 && (
              <p className="text-center text-[11px] text-muted-foreground">
                +{items.length - 4} categorias
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
