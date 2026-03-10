"use client";

/**
 * Oniefy - Índices Econômicos (Phase 8)
 *
 * Dashboard of economic indicators from BCB SGS / IBGE SIDRA.
 * - Latest values per index (cards)
 * - Historical chart for selected index
 * - Manual fetch trigger (future: automated via Edge Function/cron)
 * - Reajuste alerts for recurrences linked to indices
 */

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  useLatestIndices,
  useIndexHistory,
  useFetchIndices,
  INDEX_TYPE_LABELS,
  INDEX_TYPE_COLORS,
  INDEX_UNIT,
} from "@/lib/hooks/use-economic-indices";
import { formatCurrency, formatDate } from "@/lib/utils";

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
}

interface TooltipPayloadItem {
  value: number;
  name: string;
  color: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card p-2 shadow-lg text-xs">
      <p className="font-semibold text-muted-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value.toFixed(4)}
        </p>
      ))}
    </div>
  );
}

// Main indices to show in cards (others available in history)
const MAIN_INDICES = ["ipca", "selic", "cdi", "igpm", "inpc", "tr", "usd_brl"];

export default function IndicesPage() {
  const [selectedIndex, setSelectedIndex] = useState<string>("ipca");
  const [historyMonths, setHistoryMonths] = useState(12);

  const { data: latestIndices, isLoading: loadingLatest } = useLatestIndices();
  const { data: history, isLoading: loadingHistory } = useIndexHistory(selectedIndex, historyMonths);
  const fetchIndices = useFetchIndices();

  const mainIndices = (latestIndices ?? []).filter((i) =>
    MAIN_INDICES.includes(i.index_type)
  );

  // Chart data (reverse to chronological order)
  const chartData = [...(history ?? [])]
    .reverse()
    .map((p) => ({
      month: formatMonth(p.reference_date),
      value: Number(p.value),
      acc12m: p.accumulated_12m ? Number(p.accumulated_12m) : null,
    }));

  const selectedLabel = INDEX_TYPE_LABELS[selectedIndex] || selectedIndex;
  const selectedColor = INDEX_TYPE_COLORS[selectedIndex] || "#3B82F6";
  const _selectedUnit = INDEX_UNIT[selectedIndex] || "%";

  if (loadingLatest) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Índices Econômicos</h1>
          <p className="text-sm text-muted-foreground">
            Indicadores macroeconômicos do BCB e IBGE
          </p>
        </div>
        <button
          onClick={() => fetchIndices.mutate()}
          disabled={fetchIndices.isPending}
          className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          {fetchIndices.isPending ? "Atualizando..." : "Atualizar índices"}
        </button>
      </div>

      {/* Fetch result */}
      {fetchIndices.data && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {fetchIndices.data.total_inserted} registro(s) atualizado(s)
          {fetchIndices.data.results.some((r) => r.errors.length > 0) && (
            <span className="ml-2 text-orange-700">
              (Erros: {fetchIndices.data.results.filter((r) => r.errors.length > 0).map((r) => `${r.index_type}: ${r.errors.join(", ")}`).join("; ")})
            </span>
          )}
        </div>
      )}

      {/* Latest values cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {mainIndices.map((idx) => {
          const color = INDEX_TYPE_COLORS[idx.index_type] || "#6B7280";
          const unit = INDEX_UNIT[idx.index_type] || "%";
          const isSelected = selectedIndex === idx.index_type;

          return (
            <button
              key={idx.index_type}
              onClick={() => setSelectedIndex(idx.index_type)}
              className={`rounded-lg border p-4 text-left transition-all ${
                isSelected
                  ? "border-2 shadow-md"
                  : "hover:bg-accent/50"
              }`}
              style={isSelected ? { borderColor: color } : undefined}
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs font-semibold text-muted-foreground">
                  {INDEX_TYPE_LABELS[idx.index_type] || idx.index_type}
                </span>
              </div>
              <p className="mt-1.5 text-xl font-bold tabular-nums">
                {idx.index_type === "usd_brl"
                  ? formatCurrency(idx.value)
                  : idx.index_type === "minimum_wage"
                    ? formatCurrency(idx.value)
                    : `${idx.value.toFixed(2)} %`}
              </p>
              <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{unit}</span>
                <span>{formatDate(idx.reference_date, "MMM/yy")}</span>
              </div>
              {idx.accumulated_12m !== null && idx.accumulated_12m !== undefined && (
                <p className="mt-1 text-[10px] text-muted-foreground tabular-nums">
                  12m: {Number(idx.accumulated_12m).toFixed(2)} %
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* No data state */}
      {mainIndices.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-12 text-center">
          <p className="text-3xl">📊</p>
          <h2 className="mt-2 text-lg font-semibold">Sem dados de índices</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Clique em &ldquo;Atualizar índices&rdquo; para buscar os dados mais recentes do BCB.
          </p>
        </div>
      )}

      {/* Historical chart */}
      {selectedIndex && (
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {selectedLabel} - Histórico
            </h3>
            <div className="flex gap-1">
              {[6, 12, 24].map((m) => (
                <button
                  key={m}
                  onClick={() => setHistoryMonths(m)}
                  className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                    historyMonths === m
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          {loadingHistory ? (
            <div className="mt-4 h-56 animate-pulse rounded bg-muted" />
          ) : chartData.length === 0 ? (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Sem dados históricos para {selectedLabel}
              </p>
            </div>
          ) : (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    dataKey="value"
                    name={selectedLabel}
                    type="monotone"
                    stroke={selectedColor}
                    strokeWidth={2}
                    dot={{ r: 3, fill: selectedColor }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Data table */}
          {chartData.length > 0 && (
            <div className="mt-4 max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-1.5 text-left font-medium">Período</th>
                    <th className="py-1.5 text-right font-medium">Valor</th>
                    <th className="py-1.5 text-right font-medium">Acum. Ano</th>
                    <th className="py-1.5 text-right font-medium">Acum. 12m</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(history ?? [])].map((p) => (
                    <tr key={p.reference_date} className="border-b border-muted/50">
                      <td className="py-1 tabular-nums">{formatDate(p.reference_date, "MMM/yyyy")}</td>
                      <td className="py-1 text-right tabular-nums font-medium">
                        {Number(p.value).toFixed(selectedIndex === "usd_brl" ? 4 : 2)}
                      </td>
                      <td className="py-1 text-right tabular-nums">
                        {p.accumulated_year !== null ? `${Number(p.accumulated_year).toFixed(2)} %` : "-"}
                      </td>
                      <td className="py-1 text-right tabular-nums">
                        {p.accumulated_12m !== null ? `${Number(p.accumulated_12m).toFixed(2)} %` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Info note */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Dados obtidos via API pública do Banco Central (SGS) e IBGE (SIDRA).
          Atualizados manualmente ou por job automático (quando configurado).
          Os índices são utilizados para reajuste automático de recorrências
          e projeções do orçamento.
        </p>
      </div>
    </div>
  );
}
