"use client";

/**
 * NetWorthChart - E2
 *
 * Gráfico Net Worth ao longo do tempo com breakdown por tiers de liquidez.
 * Usa dados de monthly_snapshots (total_balance = net worth).
 *
 * Features:
 * - Área principal: net worth (total_balance)
 * - Áreas empilhadas: T1 Imediato, T2 Líquido, T3 Ilíquido, T4 Restrito
 * - Seletor de período: 6m, 12m, 24m
 * - Variação MoM (último mês vs anterior)
 * - Empty state com nudge educativo
 */

import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency, formatMonthShort, formatAxisBR, formatDecimalBR } from "@/lib/utils";
import type { MonthlySnapshot } from "@/lib/hooks/use-dashboard";

interface Props {
  snapshots: MonthlySnapshot[];
  isLoading: boolean;
}

const PERIOD_OPTIONS = [
  { value: 6, label: "6m" },
  { value: 12, label: "12m" },
  { value: 24, label: "24m" },
];

const TIER_META = [
  { key: "tier1_total" as const, label: "N1 Imediato", color: "#2F7A68" },
  { key: "tier2_total" as const, label: "N2 Líquido", color: "#56688F" },
  { key: "tier3_total" as const, label: "N3 Ilíquido", color: "#A97824" },
  { key: "tier4_total" as const, label: "N4 Restrito", color: "#6F6678" },
];

function compactCurrency(value: number): string {
  return formatAxisBR(value);
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  // Net worth is the sum of all tier values in the tooltip
  const netWorth = payload.reduce((acc, entry) => acc + entry.value, 0);

  return (
    <div className="rounded-lg bg-card p-3 shadow-elevated">
      <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
        {label}
      </p>
      <p className="mb-2 text-sm font-bold tabular-nums">
        {formatCurrency(netWorth)}
      </p>
      <div className="space-y-0.5">
        {payload
          .filter((entry) => entry.value > 0)
          .reverse()
          .map((entry) => (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

function MomVariation({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  if (previous === 0) return null;

  const diff = current - previous;
  const pct = (diff / Math.abs(previous)) * 100;

  const isPositive = diff > 0;
  const isNeutral = Math.abs(pct) < 0.5;

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const color = isNeutral
    ? "text-muted-foreground"
    : isPositive
      ? "text-verdant"
      : "text-terracotta";

  return (
    <div className={`flex items-center gap-1 ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="text-xs font-medium tabular-nums">
        {isPositive ? "+" : ""}
        {formatCurrency(diff)}
      </span>
      <span className="text-[10px] text-muted-foreground">
        ({isPositive ? "+" : ""}
        {formatDecimalBR(pct, 1)}%)
      </span>
    </div>
  );
}

export function NetWorthChart({ snapshots, isLoading }: Props) {
  const [period, setPeriod] = useState(12);

  const { chartData, current, previous, hasTierData } = useMemo(() => {
    const sorted = [...snapshots].sort((a, b) =>
      a.month.localeCompare(b.month)
    );
    const sliced = sorted.slice(-period);

    const data = sliced.map((s) => ({
      month: formatMonthShort(s.month, sliced.length > 12),
      tier1: Number(s.tier1_total ?? 0),
      tier2: Number(s.tier2_total ?? 0),
      tier3: Number(s.tier3_total ?? 0),
      tier4: Number(s.tier4_total ?? 0),
      netWorth: Number(s.total_balance),
    }));

    const hasTiers = data.some(
      (d) => d.tier1 > 0 || d.tier2 > 0 || d.tier3 > 0 || d.tier4 > 0
    );

    const cur = data.length > 0 ? data[data.length - 1].netWorth : 0;
    const prev = data.length > 1 ? data[data.length - 2].netWorth : 0;

    return { chartData: data, current: cur, previous: prev, hasTierData: hasTiers };
  }, [snapshots, period]);

  if (isLoading) {
    return (
      <div className="rounded-lg bg-card p-5 shadow-card card-alive">
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-64 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-card p-5 shadow-card card-alive">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold">Patrimônio Líquido</h3>
          {chartData.length > 0 && (
            <div className="mt-1">
              <span className="text-xl font-bold tabular-nums">
                {formatCurrency(current)}
              </span>
              {chartData.length > 1 && (
                <div className="mt-0.5">
                  <MomVariation current={current} previous={previous} />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                period === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart or empty state */}
      {chartData.length < 2 ? (
        <div className="mt-10 text-center">
          <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            Dados insuficientes para o gráfico
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            O histórico é gerado automaticamente a cada mês com base nas suas
            contas e transações
          </p>
        </div>
      ) : (
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            {hasTierData ? (
              /* Stacked area chart by tier */
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
              >
                <defs>
                  {TIER_META.map((t) => (
                    <linearGradient
                      key={t.key}
                      id={`grad-${t.key}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={t.color}
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="100%"
                        stopColor={t.color}
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={compactCurrency}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
                {TIER_META.map((t) => (
                  <Area
                    key={t.key}
                    dataKey={t.key.replace("_total", "")}
                    name={t.label}
                    type="monotone"
                    stackId="patrimony"
                    stroke={t.color}
                    strokeWidth={1.5}
                    fill={`url(#grad-${t.key})`}
                  />
                ))}
              </AreaChart>
            ) : (
              /* Simple area chart with net worth line */
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="grad-nw"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#56688F"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor="#56688F"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={compactCurrency}
                />
                <Tooltip
                  formatter={(value: number) => [
                    formatCurrency(value),
                    "Patrimônio Líquido",
                  ]}
                  contentStyle={{
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(47,32,59,0.12)",
                    border: "none",
                    fontSize: "12px",
                  }}
                  labelStyle={{ fontWeight: 600, fontSize: "11px" }}
                />
                <Area
                  dataKey="netWorth"
                  name="Patrimônio Líquido"
                  type="monotone"
                  stroke="#56688F"
                  strokeWidth={2}
                  fill="url(#grad-nw)"
                  dot={{ r: 3, fill: "#56688F" }}
                  activeDot={{ r: 5, stroke: "#56688F", strokeWidth: 2, fill: "#fff" }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
