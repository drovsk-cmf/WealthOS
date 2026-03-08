"use client";

/**
 * BalanceSheetCard - CTB-05
 *
 * Card com 3 valores: total ativos, total passivos, patrimônio líquido.
 * Barra visual horizontal mostrando proporção ativos/passivos.
 * Explicação contextual simplificada (Grupo 3 PL visível ao usuário).
 */

import { formatCurrency } from "@/lib/utils";
import type { BalanceSheet } from "@/lib/hooks/use-dashboard";

interface Props {
  data: BalanceSheet | undefined;
  isLoading: boolean;
}

export function BalanceSheetCard({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-5 w-28 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const assets = data?.total_assets ?? 0;
  const liabilities = data?.total_liabilities ?? 0;
  const netWorth = data?.net_worth ?? 0;

  // Proportion bar
  const total = assets + liabilities;
  const assetPct = total > 0 ? (assets / total) * 100 : 100;

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Balanço Patrimonial</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            netWorth >= 0
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          PL {netWorth >= 0 ? "+" : ""}
          {formatCurrency(netWorth)}
        </span>
      </div>

      {/* Proportion bar */}
      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-red-200">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-500"
          style={{ width: `${Math.max(assetPct, 2)}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>Ativos</span>
        <span>Passivos</span>
      </div>

      {/* Breakdown */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">
              Ativos líquidos
            </span>
          </div>
          <span className="text-sm font-medium tabular-nums">
            {formatCurrency(data?.liquid_assets ?? 0)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-700" />
            <span className="text-sm text-muted-foreground">
              Ativos ilíquidos
            </span>
          </div>
          <span className="text-sm font-medium tabular-nums">
            {formatCurrency(data?.illiquid_assets ?? 0)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-sm text-muted-foreground">Passivos</span>
          </div>
          <span className="text-sm font-medium tabular-nums text-red-500">
            {formatCurrency(liabilities)}
          </span>
        </div>
      </div>

      {/* Net worth highlight */}
      <div className="mt-4 border-t pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Patrimônio Líquido</span>
          <span
            className={`text-lg font-bold tabular-nums ${
              netWorth >= 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            {formatCurrency(netWorth)}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Tudo que você possui menos tudo que você deve
        </p>
      </div>
    </div>
  );
}
