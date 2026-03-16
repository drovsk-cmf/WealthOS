"use client";

/**
 * BalanceEvolutionChart - DASH-07
 *
 * Evolução do saldo nos últimos 6-12 meses.
 * Recharts: BarChart com receitas (verde) e despesas (vermelho)
 * + LineChart overlay para saldo acumulado.
 *
 * Período padrão: 6 meses. Filtro para 3/6/12.
 */

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency, formatMonthShort } from "@/lib/utils";
import type { BalanceEvolutionResult } from "@/lib/hooks/use-dashboard";

interface Props {
  data: BalanceEvolutionResult | undefined;
  isLoading: boolean;
}

const PERIOD_OPTIONS = [
  { value: 3, label: "3m" },
  { value: 6, label: "6m" },
  { value: 12, label: "12m" },
];

function compactCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return value.toFixed(0);
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

  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-muted-foreground">{label}</p>
      {payload.map((entry) => (
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
  );
}

export function BalanceEvolutionChart({ data, isLoading }: Props) {
  const [, setPeriod] = useState(6);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="h-4 w-36 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-56 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const points = data?.data ?? [];

  // Format for recharts
  const chartData = [...points]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((p) => ({
      month: formatMonthShort(p.month),
      receitas: Number(p.income),
      despesas: Number(p.expense),
      saldo: Number(p.balance),
    }));

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Evolução Mensal</h3>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button type="button"
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className="rounded px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="mt-8 text-center">
          <TrendingUp className="h-6 w-6 text-muted-foreground" />
          <p className="mt-1 text-sm text-muted-foreground">
            Sem dados suficientes para o gráfico
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Lance transações para acompanhar a evolução
          </p>
        </div>
      ) : (
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
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
              <Bar
                dataKey="receitas"
                name="Receitas"
                fill="#2F7A68"
                radius={[3, 3, 0, 0]}
                barSize={20}
              />
              <Bar
                dataKey="despesas"
                name="Despesas"
                fill="#A64A45"
                radius={[3, 3, 0, 0]}
                barSize={20}
              />
              <Line
                dataKey="saldo"
                name="Saldo"
                type="monotone"
                stroke="#56688F"
                strokeWidth={2}
                dot={{ r: 3, fill: "#56688F" }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {data?.source === "calculated" && chartData.length > 0 && (
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Dados calculados a partir das transações (snapshots mensais ainda não disponíveis)
        </p>
      )}
    </div>
  );
}
