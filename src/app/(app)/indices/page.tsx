"use client";

/**
 * Oniefy - Índices Econômicos (Phase 8)
 *
 * Dashboard of economic indicators from BCB SGS / IBGE SIDRA.
 * - Latest values per index (cards, multi-selectable)
 * - Historical chart with monthly value + running accumulated curves
 * - Multi-index overlay on same chart
 * - Daily cron at 03:00 BRT + manual fetch button
 */

import { useState, useMemo, useCallback } from "react";
import { TrendingUp as TrendingUpIcon } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  useLatestIndices,
  useMultiIndexHistory,
  useFetchIndices,
  INDEX_TYPE_LABELS,
  INDEX_TYPE_COLORS,
  INDEX_UNIT,
} from "@/lib/hooks/use-economic-indices";
import { formatCurrency, formatDate, formatPercent, formatDecimalBR } from "@/lib/utils";

import { formatMonthShort } from "@/lib/utils";

interface TooltipPayloadItem {
  value: number;
  name: string;
  color: string;
  dataKey: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card p-2 shadow-elevated text-xs">
      <p className="font-semibold text-muted-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value != null ? formatDecimalBR(p.value, 4) : "-"}
        </p>
      ))}
    </div>
  );
}

const MAIN_INDICES = ["ipca", "selic", "cdi", "igpm", "inpc", "tr", "usd_brl"];

// Indices where running accumulation (compound product) makes sense
const ACCUMULATION_INDICES = new Set(["ipca", "inpc", "igpm", "tr"]);

export default function IndicesPage() {
  const [selectedIndices, setSelectedIndices] = useState<Set<string>>(new Set(["ipca"]));
  const [historyMonths, setHistoryMonths] = useState(12);
  const [showAccumulated, setShowAccumulated] = useState(true);

  const { data: latestIndices, isLoading: loadingLatest } = useLatestIndices();
  const { data: multiHistory, isLoading: loadingHistory } = useMultiIndexHistory(
    Array.from(selectedIndices),
    historyMonths
  );
  const fetchIndices = useFetchIndices();

  const toggleIndex = useCallback((indexType: string) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(indexType)) {
        next.delete(indexType);
        if (next.size === 0) next.add(indexType);
      } else {
        next.add(indexType);
      }
      return next;
    });
  }, []);

  const mainIndices = (latestIndices ?? []).filter((i) =>
    MAIN_INDICES.includes(i.index_type)
  );

  // Build unified chart data with running accumulated from period start
  const chartData = useMemo(() => {
    if (!multiHistory) return [];

    const monthMap = new Map<string, Record<string, number | string | null>>();

    for (const idxType of Array.from(selectedIndices)) {
      const points = [...(multiHistory[idxType] ?? [])].sort(
        (a, b) => a.reference_date.localeCompare(b.reference_date)
      );

      // Compute running accumulated for percentage indices
      let runningAcc = 1;
      const canAccumulate = ACCUMULATION_INDICES.has(idxType);

      for (const p of points) {
        const sortKey = p.reference_date;
        if (!monthMap.has(sortKey)) {
          monthMap.set(sortKey, { month: formatMonthShort(p.reference_date, true) });
        }
        const row = monthMap.get(sortKey)!;
        const val = Number(p.value);
        row[`${idxType}_value`] = val;

        if (canAccumulate) {
          runningAcc *= (1 + val / 100);
          row[`${idxType}_acc`] = Number(((runningAcc - 1) * 100).toFixed(4));
        }
      }
    }

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, row]) => row);
  }, [multiHistory, selectedIndices]);

  // Table data for primary index (single-selection only)
  // Compute accumulated_year and accumulated_12m geometrically on the frontend
  // (DB columns may be NULL for data fetched via API after seed)
  const primaryIndex = Array.from(selectedIndices)[0];
  const primaryHistory = useMemo(() => {
    const raw = multiHistory?.[primaryIndex] ?? [];
    if (!raw.length) return raw;
    const canAccumulate = ACCUMULATION_INDICES.has(primaryIndex);
    if (!canAccumulate) return raw;

    const sorted = [...raw].sort((a, b) =>
      a.reference_date.localeCompare(b.reference_date)
    );

    // Group by year for accumulated_year
    const yearProducts = new Map<string, number>();
    // Sliding window for accumulated_12m
    const allSorted = sorted.map((p) => ({
      ...p,
      _val: Number(p.value),
      _year: p.reference_date.slice(0, 4),
    }));

    return allSorted.map((p, i) => {
      // Accumulated year: geometric product from Jan of p's year
      const yearKey = p._year;
      if (!yearProducts.has(yearKey)) yearProducts.set(yearKey, 1);
      yearProducts.set(yearKey, yearProducts.get(yearKey)! * (1 + p._val / 100));
      const accYear = (yearProducts.get(yearKey)! - 1) * 100;

      // Accumulated 12m: geometric product of last 12 months up to and including this one
      let acc12m = 1;
      for (let j = i; j >= 0; j--) {
        const diff =
          (parseInt(p._year) - parseInt(allSorted[j]._year)) * 12 +
          (parseInt(p.reference_date.slice(5, 7)) -
            parseInt(allSorted[j].reference_date.slice(5, 7)));
        if (diff >= 12) break;
        acc12m *= 1 + allSorted[j]._val / 100;
      }
      const accum12m = (acc12m - 1) * 100;

      return {
        ...p,
        accumulated_year: accYear,
        accumulated_12m: accum12m,
      };
    });
  }, [multiHistory, primaryIndex]);

  if (loadingLatest) {
    return (
      <div className="space-y-4">
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
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Indicadores Econômicos</h1>
          <p className="text-sm text-muted-foreground">
            Indicadores macroeconômicos do BCB e IBGE
          </p>
        </div>
        <button type="button"
          onClick={() => fetchIndices.mutate()}
          disabled={fetchIndices.isPending}
          className="rounded-md btn-alive border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          {fetchIndices.isPending ? "Atualizando" : "Atualizar índices"}
        </button>
      </div>

      {/* Fetch result */}
      {fetchIndices.data && (
        <div className="rounded-lg border border-verdant/20 bg-verdant/10 px-4 py-3 text-sm text-verdant">
          {fetchIndices.data.total_inserted} registro(s) atualizado(s)
          {fetchIndices.data.results.some((r) => r.error_count > 0) && (
            <span className="ml-2 text-burnished">
              (Erros em: {fetchIndices.data.results.filter((r) => r.error_count > 0).map((r) => r.index_type).join(", ")})
            </span>
          )}
        </div>
      )}

      {/* Latest values cards (multi-selectable) */}
      <div>
        <p className="mb-2 text-xs text-muted-foreground">
          Clique para selecionar. Vários índices podem ser comparados no gráfico.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {mainIndices.map((idx) => {
            const color = INDEX_TYPE_COLORS[idx.index_type] || "#7E9487";
            const unit = INDEX_UNIT[idx.index_type] || "%";
            const isSelected = selectedIndices.has(idx.index_type);

            return (
              <button type="button"
                key={idx.index_type}
                onClick={() => toggleIndex(idx.index_type)}
                className={`rounded-lg border p-4 text-left transition-all ${
                  isSelected ? "border-2 shadow-md" : "hover:bg-accent/50"
                }`}
                style={isSelected ? { borderColor: color } : undefined}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs font-semibold text-muted-foreground">
                    {INDEX_TYPE_LABELS[idx.index_type] || idx.index_type}
                  </span>
                  {isSelected && (
                    <span className="ml-auto rounded bg-muted px-1 py-0.5 text-[9px] font-bold text-muted-foreground">
                      ativo
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xl font-bold tabular-nums">
                  {idx.index_type === "usd_brl" || idx.index_type === "minimum_wage"
                    ? formatCurrency(idx.value)
                    : `${formatPercent(idx.value)} %`}
                </p>
                <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{unit}</span>
                  <span>{formatDate(idx.reference_date, "MMM/yy")}</span>
                </div>
                {idx.accumulated_12m !== null && idx.accumulated_12m !== undefined && (
                  <p className="mt-1 text-[10px] text-muted-foreground tabular-nums">
                    12m: {formatPercent(Number(idx.accumulated_12m))} %
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* No data state */}
      {mainIndices.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <TrendingUpIcon className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Sem dados de índices</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Clique em &ldquo;Atualizar índices&rdquo; para buscar os dados mais recentes do BCB.
          </p>
        </div>
      )}

      {/* Historical chart */}
      {selectedIndices.size > 0 && (
        <div className="rounded-lg bg-card p-5 shadow-card card-alive">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {selectedIndices.size === 1
                ? `${INDEX_TYPE_LABELS[primaryIndex] || primaryIndex} - Histórico`
                : `Comparativo (${selectedIndices.size} índices)`}
            </h3>
            <div className="flex items-center gap-3">
              <button type="button"
                onClick={() => setShowAccumulated(!showAccumulated)}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  showAccumulated
                    ? "bg-info-slate/15 text-info-slate"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                Acumulado
              </button>
              <div className="flex gap-1">
                {[6, 12, 24, 36].map((m) => (
                  <button type="button"
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
          </div>

          {loadingHistory ? (
            <div className="mt-4 h-64 animate-pulse rounded bg-muted" />
          ) : chartData.length === 0 ? (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Sem dados históricos para o período selecionado
              </p>
            </div>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                  {Array.from(selectedIndices).flatMap((idxType) => {
                    const color = INDEX_TYPE_COLORS[idxType] || "#7E9487";
                    const label = INDEX_TYPE_LABELS[idxType] || idxType;
                    const canAccumulate = ACCUMULATION_INDICES.has(idxType);
                    const lines = [
                      <Line
                        key={`${idxType}_value`}
                        dataKey={`${idxType}_value`}
                        name={label}
                        type="monotone"
                        stroke={color}
                        strokeWidth={2}
                        dot={{ r: 2.5, fill: color }}
                        activeDot={{ r: 4 }}
                        connectNulls
                      />,
                    ];
                    if (showAccumulated && canAccumulate) {
                      lines.push(
                        <Line
                          key={`${idxType}_acc`}
                          dataKey={`${idxType}_acc`}
                          name={`${label} (acum. ${historyMonths}m)`}
                          type="monotone"
                          stroke={color}
                          strokeWidth={1.5}
                          strokeDasharray="5 3"
                          dot={false}
                          connectNulls
                        />
                      );
                    }
                    return lines;
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Data table (single-index only) */}
          {primaryHistory.length > 0 && selectedIndices.size === 1 && (
            <div className="mt-4 max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th scope="col" className="py-1.5 text-left font-medium">Período</th>
                    <th scope="col" className="py-1.5 text-right font-medium">Valor</th>
                    <th scope="col" className="py-1.5 text-right font-medium">Acum. Ano</th>
                    <th scope="col" className="py-1.5 text-right font-medium">Acum. 12m</th>
                  </tr>
                </thead>
                <tbody>
                  {[...primaryHistory].map((p) => (
                    <tr key={p.reference_date} className="border-b border-muted/50">
                      <td className="py-1 tabular-nums">{formatDate(p.reference_date, "MMM/yyyy")}</td>
                      <td className="py-1 text-right tabular-nums font-medium">
                        {formatDecimalBR(Number(p.value), primaryIndex === "usd_brl" ? 4 : 2)}
                      </td>
                      <td className="py-1 text-right tabular-nums">
                        {p.accumulated_year != null ? `${formatPercent(Number(p.accumulated_year))} %` : "-"}
                      </td>
                      <td className="py-1 text-right tabular-nums">
                        {p.accumulated_12m != null ? `${formatPercent(Number(p.accumulated_12m))} %` : "-"}
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
          Atualizados diariamente por workflow automático (03:00 BRT) e
          disponíveis para atualização manual via botão acima.
          Os índices são utilizados para reajuste automático de recorrências
          e projeções do orçamento.
        </p>
      </div>
    </div>
  );
}
