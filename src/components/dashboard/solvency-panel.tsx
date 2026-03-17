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
import { Mv } from "@/components/ui/masked-value";
import type { SolvencyMetrics, MonthlySnapshot } from "@/lib/hooks/use-dashboard";

interface Props {
  data: SolvencyMetrics | undefined;
  isLoading: boolean;
  snapshots?: MonthlySnapshot[];
}

/** Inline SVG sparkline (no external dependency) */
function Sparkline({ values, color = "currentColor", width = 64, height = 20 }: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 1;
  const usableW = width - pad * 2;
  const usableH = height - pad * 2;
  const step = usableW / (values.length - 1);

  const points = values.map((v, i) => {
    const x = pad + i * step;
    const y = pad + usableH - ((v - min) / range) * usableH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg width={width} height={height} className="inline-block align-middle opacity-70" aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(" ")}
      />
      {/* Dot on last value */}
      {(() => {
        const lastPt = points[points.length - 1].split(",");
        return <circle cx={lastPt[0]} cy={lastPt[1]} r={2} fill={color} />;
      })()}
    </svg>
  );
}

function lcrStatus(lcr: number): { label: string; color: string; bg: string } {
  if (lcr >= 2) return { label: "Sólida", color: "text-verdant", bg: "bg-verdant/15" };
  if (lcr >= 1) return { label: "Saudável", color: "text-verdant", bg: "bg-verdant/10" };
  if (lcr >= 0.5) return { label: "Atenção", color: "text-burnished", bg: "bg-burnished/15" };
  return { label: "Risco", color: "text-terracotta", bg: "bg-terracotta/15" };
}

function runwayStatus(months: number): { label: string; color: string } {
  if (months >= 12) return { label: "Sólido", color: "text-verdant" };
  if (months >= 6) return { label: "Estável", color: "text-verdant" };
  if (months >= 3) return { label: "Atenção", color: "text-burnished" };
  return { label: "Urgente", color: "text-terracotta" };
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
  { key: "tier1_total", label: "T1 Imediato", color: "#2F7A68", desc: "Conta corrente, poupança, carteira digital" },
  { key: "tier2_total", label: "T2 Líquido", color: "#56688F", desc: "Investimentos com liquidez (CDB, fundos)" },
  { key: "tier3_total", label: "T3 Ilíquido", color: "#A97824", desc: "Imóveis, veículos, bens" },
  { key: "tier4_total", label: "T4 Restrito", color: "#6F6678", desc: "FGTS, previdência com carência" },
] as const;

export function SolvencyPanel({ data, isLoading, snapshots = [] }: Props) {
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

  // Sparkline data from monthly snapshots
  const lcrHistory = snapshots.map(s => s.lcr ?? 0).filter((_, i, a) => a.length > 1);
  const runwayHistory = snapshots.map(s => s.runway_months ?? 0).filter((_, i, a) => a.length > 1);
  const burnHistory = snapshots.map(s => s.burn_rate ?? 0).filter((_, i, a) => a.length > 1);
  const patrimonyHistory = snapshots.map(s =>
    (s.tier1_total ?? 0) + (s.tier2_total ?? 0) + (s.tier3_total ?? 0) + (s.tier4_total ?? 0)
  ).filter((_, i, a) => a.length > 1);

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
          <span className="rounded bg-burnished/15 px-1.5 py-0.5 text-[10px] font-medium text-burnished">
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
          {lcrHistory.length >= 2 && (
            <div className="mt-1.5"><Sparkline values={lcrHistory} color="#2F7A68" /></div>
          )}
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
          {runwayHistory.length >= 2 && (
            <div className="mt-1.5"><Sparkline values={runwayHistory} color="#2F7A68" /></div>
          )}
        </div>

        {/* DASH-11: Burn Rate */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Burn Rate
          </p>
          <span className="mt-1 block text-2xl font-bold tabular-nums">
            <Mv>{formatCurrency(burnRate)}</Mv>
          </span>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Custo mensal médio (6 meses)
          </p>
          {burnHistory.length >= 2 && (
            <div className="mt-1.5"><Sparkline values={burnHistory} color="#A97824" /></div>
          )}
        </div>

        {/* DASH-06 + DASH-12: Patrimônio Total */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Patrimônio Total
          </p>
          <span className="mt-1 block text-2xl font-bold tabular-nums">
            <Mv>{formatCurrency(totalPatrimony)}</Mv>
          </span>
          <p className="mt-1 text-[11px] text-muted-foreground">
            T1 + T2 + T3 + T4
          </p>
          {patrimonyHistory.length >= 2 && (
            <div className="mt-1.5"><Sparkline values={patrimonyHistory} color="#56688F" /></div>
          )}
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
                    title={`${tier.label}: $<Mv>{formatCurrency(tier.value)}</Mv>`}
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
                    <Mv>{formatCurrency(tier.value)}</Mv>
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
