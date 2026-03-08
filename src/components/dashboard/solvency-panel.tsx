"use client";

/**
 * SolvencyPanel - DASH-09 (LCR), DASH-10 (Runway), DASH-11 (Burn Rate),
 *                 DASH-12 (Patrimônio por Tiers), DASH-06 (patrimônio total)
 *
 * Cockpit de Solvência: 4 KPIs + breakdown por tiers.
 * Layout: 2x2 grid de KPIs + barra empilhada de tiers.
 *
 * Referência: adendo v1.4, seção 2.
 * LCR = (T1+T2)/(Burn Rate × 6)
 * Runway = (T1+T2)/Burn Rate em meses
 */

import { formatCurrency } from "@/lib/utils";
import type { SolvencyMetrics } from "@/lib/hooks/use-dashboard";

interface Props {
  data: SolvencyMetrics | undefined;
  isLoading: boolean;
}

function lcrStatus(lcr: number): { label: string; color: string; bg: string } {
  if (lcr >= 2) return { label: "Excelente", color: "text-green-700", bg: "bg-green-100" };
  if (lcr >= 1) return { label: "Saudável", color: "text-green-600", bg: "bg-green-50" };
  if (lcr >= 0.5) return { label: "Atenção", color: "text-yellow-700", bg: "bg-yellow-100" };
  return { label: "Risco", color: "text-red-700", bg: "bg-red-100" };
}

function runwayStatus(months: number): { label: string; color: string } {
  if (months >= 12) return { label: "Sólido", color: "text-green-600" };
  if (months >= 6) return { label: "OK", color: "text-green-500" };
  if (months >= 3) return { label: "Atenção", color: "text-yellow-600" };
  return { label: "Urgente", color: "text-red-600" };
}

function KpiSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="h-3 w-16 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-7 w-20 animate-pulse rounded bg-muted" />
    </div>
  );
}

const TIER_COLORS = [
  { key: "tier1_total", label: "T1 Imediato", color: "#10B981", desc: "Conta corrente, poupança, carteira digital" },
  { key: "tier2_total", label: "T2 Líquido", color: "#3B82F6", desc: "Investimentos com liquidez (CDB, fundos)" },
  { key: "tier3_total", label: "T3 Ilíquido", color: "#F59E0B", desc: "Imóveis, veículos, bens" },
  { key: "tier4_total", label: "T4 Restrito", color: "#8B5CF6", desc: "FGTS, previdência com carência" },
] as const;

export function SolvencyPanel({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <KpiSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const lcr = data?.lcr ?? 0;
  const runway = data?.runway_months ?? 0;
  const burnRate = data?.burn_rate ?? 0;
  const totalPatrimony = data?.total_patrimony ?? 0;
  const capped999 = (v: number) => v >= 999;

  const lcrInfo = lcrStatus(lcr);
  const runwayInfo = runwayStatus(runway);

  // Tier breakdown for stacked bar
  const tiers = TIER_COLORS.map((t) => ({
    ...t,
    value: (data?.[t.key] as number) ?? 0,
  }));
  const tierTotal = tiers.reduce((s, t) => s + t.value, 0);

  return (
    <div className="space-y-4">
      {/* Section title */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Cockpit de Solvência
        </h3>
        {data?.months_analyzed !== undefined && data.months_analyzed < 3 && (
          <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700">
            {data.months_analyzed} mês(es) de dados
          </span>
        )}
      </div>

      {/* 4 KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* DASH-09: LCR */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Índice de Liquidez
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">
              {capped999(lcr) ? "∞" : lcr.toFixed(2)}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${lcrInfo.bg} ${lcrInfo.color}`}
            >
              {lcrInfo.label}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {capped999(lcr)
              ? "Sem despesas recorrentes"
              : "Liquidez / (Burn × 6)"}
          </p>
        </div>

        {/* DASH-10: Runway */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Runway
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">
              {capped999(runway) ? "∞" : runway.toFixed(1)}
            </span>
            {!capped999(runway) && (
              <span className="text-sm text-muted-foreground">meses</span>
            )}
            <span className={`text-xs font-semibold ${runwayInfo.color}`}>
              {runwayInfo.label}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Meses de liberdade financeira
          </p>
        </div>

        {/* DASH-11: Burn Rate */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Burn Rate
          </p>
          <span className="mt-1 block text-2xl font-bold tabular-nums">
            {formatCurrency(burnRate)}
          </span>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Custo mensal médio (6 meses)
          </p>
        </div>

        {/* DASH-06 + DASH-12: Patrimônio Total */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Patrimônio Total
          </p>
          <span className="mt-1 block text-2xl font-bold tabular-nums">
            {formatCurrency(totalPatrimony)}
          </span>
          <p className="mt-1 text-[11px] text-muted-foreground">
            T1 + T2 + T3 + T4
          </p>
        </div>
      </div>

      {/* DASH-12: Tier breakdown bar */}
      {tierTotal > 0 && (
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h4 className="text-sm font-semibold">Patrimônio por Tiers</h4>

          {/* Stacked bar */}
          <div className="mt-3 flex h-5 w-full overflow-hidden rounded-full bg-muted">
            {tiers.map(
              (tier) =>
                tier.value > 0 && (
                  <div
                    key={tier.key}
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${(tier.value / tierTotal) * 100}%`,
                      backgroundColor: tier.color,
                    }}
                    title={`${tier.label}: ${formatCurrency(tier.value)}`}
                  />
                )
            )}
          </div>

          {/* Legend */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {tiers.map((tier) => (
              <div key={tier.key} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: tier.color }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium">{tier.label}</span>
                    {tierTotal > 0 && tier.value > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {((tier.value / tierTotal) * 100).toFixed(0)} %
                      </span>
                    )}
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {formatCurrency(tier.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
