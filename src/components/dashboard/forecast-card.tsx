"use client";

/**
 * Oniefy - Balance Forecast Card (E38)
 *
 * Shows 6-month balance projection on the dashboard.
 * Uses quickForecast from balance-forecast engine.
 */

import { useMemo } from "react";
import { quickForecast } from "@/lib/services/balance-forecast";
import { formatCurrency } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

interface ForecastCardProps {
  currentBalance: number;
  avgMonthlyIncome: number;
  avgMonthlyExpenses: number;
  isLoading?: boolean;
}

export function ForecastCard({
  currentBalance,
  avgMonthlyIncome,
  avgMonthlyExpenses,
  isLoading,
}: ForecastCardProps) {
  const forecast = useMemo(() => {
    if (avgMonthlyIncome === 0 && avgMonthlyExpenses === 0) return null;
    return quickForecast(currentBalance, avgMonthlyIncome, avgMonthlyExpenses, 6);
  }, [currentBalance, avgMonthlyIncome, avgMonthlyExpenses]);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-8 w-24 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!forecast) return null;

  const isNegative = forecast.negativeMonth > 0;
  const isGrowing = forecast.endBalance > currentBalance * 1.05;
  const isDeclining = forecast.endBalance < currentBalance * 0.95;

  return (
    <div className={`rounded-lg border p-4 ${
      isNegative ? "border-terracotta/30 bg-terracotta/5" :
      isGrowing ? "border-verdant/30 bg-verdant/5" :
      isDeclining ? "border-burnished/30 bg-burnished/5" :
      "bg-card"
    }`}>
      <div className="flex items-center gap-2">
        {isNegative ? (
          <AlertTriangle className="h-4 w-4 text-terracotta" />
        ) : isGrowing ? (
          <TrendingUp className="h-4 w-4 text-verdant" />
        ) : isDeclining ? (
          <TrendingDown className="h-4 w-4 text-burnished" />
        ) : (
          <Minus className="h-4 w-4 text-muted-foreground" />
        )}
        <p className="text-xs font-medium">Projeção 6 meses</p>
      </div>

      <p className={`mt-2 text-xl font-bold tabular-nums ${
        isNegative ? "text-terracotta" :
        isGrowing ? "text-verdant" :
        isDeclining ? "text-burnished" :
        ""
      }`}>
        <Mv>{formatCurrency(forecast.endBalance)}</Mv>
      </p>

      <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed">
        {forecast.summary}
      </p>

      {/* Mini sparkline: 6 dots representing each month */}
      <div className="mt-3 flex items-end gap-1">
        {forecast.points.map((p, i) => {
          const maxBal = Math.max(...forecast.points.map((x) => Math.abs(x.projectedBalance)), 1);
          const h = Math.max(4, Math.round((Math.abs(p.projectedBalance) / maxBal) * 24));
          return (
            <div
              key={i}
              className={`w-full rounded-sm ${
                p.projectedBalance < 0 ? "bg-terracotta/60" :
                p.projectedBalance > currentBalance ? "bg-verdant/60" :
                "bg-muted-foreground/30"
              }`}
              style={{ height: `${h}px` }}
              title={`${p.date}: R$ ${p.projectedBalance.toFixed(0)}`}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[8px] text-muted-foreground">
        <span>{forecast.points[0]?.date.slice(5)}</span>
        <span>{forecast.points[forecast.points.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}
