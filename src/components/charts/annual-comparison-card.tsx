"use client";

/**
 * Oniefy - Annual Comparison Card (E32)
 *
 * Shows year-over-year spending comparison on the cash-flow page.
 * Uses compareAnnualSpending from the E32 engine.
 */

import { useMemo } from "react";
import { compareAnnualSpending, type AnnualExpense } from "@/lib/services/annual-comparison";
import { formatCurrency } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AnnualComparisonCardProps {
  transactions: AnnualExpense[];
  /** Annual inflation rate for comparison (default: 4.5%) */
  inflationRate?: number;
}

export function AnnualComparisonCard({
  transactions,
  inflationRate = 4.5,
}: AnnualComparisonCardProps) {
  const comparison = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;

    // Need transactions from both years
    const hasPrev = transactions.some((t) => t.date.startsWith(String(prevYear)));
    const hasCurrent = transactions.some((t) => t.date.startsWith(String(currentYear)));

    if (!hasPrev || !hasCurrent) return null;

    return compareAnnualSpending(transactions, prevYear, currentYear, inflationRate);
  }, [transactions, inflationRate]);

  if (!comparison) return null;

  const isUp = comparison.changePct > 0;
  const isDown = comparison.changePct < 0;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        {isUp ? (
          <TrendingUp className="h-4 w-4 text-terracotta" />
        ) : isDown ? (
          <TrendingDown className="h-4 w-4 text-verdant" />
        ) : (
          <Minus className="h-4 w-4 text-muted-foreground" />
        )}
        <p className="text-xs font-medium">Comparativo anual</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] text-muted-foreground">{comparison.yearA}</p>
          <p className="text-sm font-semibold tabular-nums">
            <Mv>{formatCurrency(comparison.totalA)}</Mv>
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">
            {comparison.yearB}
            {comparison.projectedB !== comparison.totalB && " (projetado)"}
          </p>
          <p className="text-sm font-semibold tabular-nums">
            <Mv>{formatCurrency(comparison.projectedB)}</Mv>
          </p>
        </div>
      </div>

      <div className={`rounded-md px-3 py-2 text-center ${
        comparison.aboveInflation
          ? "bg-terracotta/10 text-terracotta"
          : "bg-verdant/10 text-verdant"
      }`}>
        <p className="text-sm font-bold tabular-nums">
          {isUp ? "+" : ""}{comparison.changePct.toFixed(1)}%
        </p>
        <p className="text-[10px]">
          {comparison.aboveInflation
            ? `Acima da inflação (${inflationRate}%)`
            : `Dentro da inflação (${inflationRate}%)`}
        </p>
      </div>
    </div>
  );
}
