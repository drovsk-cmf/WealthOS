"use client";

/**
 * ExpenseProjection - E12
 *
 * Projeção indexada de despesas recorrentes para os próximos 12 meses.
 * 3 cenários: pessimista, base, otimista.
 *
 * Lógica:
 * - Base: cada recorrência projetada pelo seu adjustment_index (IPCA, IGP-M, etc.)
 * - Recorrências sem índice: usa IPCA como default
 * - Pessimista: base + 2 p.p./ano (distribuído mensalmente)
 * - Otimista: base - 1 p.p./ano
 *
 * Usa dados reais de recurrences + economic_indices (BCB).
 */

import { useMemo, useState } from "react";
import { TrendingUp, AlertTriangle, Info } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useRecurrences } from "@/lib/hooks/use-recurrences";
import { useLatestIndices } from "@/lib/hooks/use-economic-indices";
import { formatCurrency, formatMonthShort } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────

interface ProjectionPoint {
  month: string; // YYYY-MM
  label: string; // "abr 26"
  pessimista: number;
  base: number;
  otimista: number;
}

interface RecurrenceInput {
  description: string;
  amount: number;
  adjustmentIndex: string | null;
}

// ─── Projection Logic ───────────────────────────────────────────

function getMonthlyRate(
  indexType: string | null,
  latestRates: Record<string, number>,
  scenarioDelta: number // annual p.p. adjustment
): number {
  // Default to IPCA if no index specified
  const idx = indexType && indexType !== "none" && indexType !== "manual"
    ? indexType
    : "ipca";

  const annualRate = (latestRates[idx] ?? 0.5) * 12; // approximate annual from monthly
  const adjustedAnnual = annualRate + scenarioDelta;
  // Convert back to monthly: (1 + annual/100)^(1/12) - 1
  const monthlyRate = Math.pow(1 + adjustedAnnual / 100, 1 / 12) - 1;
  return Math.max(0, monthlyRate); // floor at 0 (no deflation in projection)
}

function projectExpenses(
  recurrences: RecurrenceInput[],
  latestRates: Record<string, number>,
  months: number,
  scenarioDelta: number
): number[] {
  const monthlyTotals: number[] = [];

  for (let m = 0; m < months; m++) {
    let total = 0;
    for (const rec of recurrences) {
      const rate = getMonthlyRate(rec.adjustmentIndex, latestRates, scenarioDelta);
      // Compound: amount * (1 + rate)^m
      total += rec.amount * Math.pow(1 + rate, m);
    }
    monthlyTotals.push(total);
  }

  return monthlyTotals;
}

// ─── Component ──────────────────────────────────────────────────

export function ExpenseProjection() {
  const { data: recurrences, isLoading: loadingRec } = useRecurrences();
  const { data: latestIndices, isLoading: loadingIdx } = useLatestIndices();
  const [months] = useState(12);

  const { projectionData, currentMonthly, summary, indexRates } = useMemo(() => {
    // Filter active monthly expense recurrences
    const expenses: RecurrenceInput[] = (recurrences ?? [])
      .filter((r) => {
        if (!r.is_active) return false;
        const tmpl = r.template_transaction as Record<string, unknown>;
        return r.frequency === "monthly" && (tmpl.type as string) === "expense";
      })
      .map((r) => {
        const tmpl = r.template_transaction as Record<string, unknown>;
        return {
          description: (tmpl.description as string) || "Sem descrição",
          amount: Number(tmpl.amount),
          adjustmentIndex: r.adjustment_index,
        };
      });

    // Extract latest monthly rates from indices
    const rates: Record<string, number> = {};
    if (latestIndices && Array.isArray(latestIndices)) {
      for (const idx of latestIndices as { index_type: string; value: number }[]) {
        rates[idx.index_type] = Number(idx.value);
      }
    }

    const currentTotal = expenses.reduce((s, e) => s + e.amount, 0);

    // Project 3 scenarios
    const pessimista = projectExpenses(expenses, rates, months, 2); // +2 p.p./ano
    const base = projectExpenses(expenses, rates, months, 0);
    const otimista = projectExpenses(expenses, rates, months, -1); // -1 p.p./ano

    // Build chart data
    const now = new Date();
    const data: ProjectionPoint[] = [];
    for (let m = 0; m < months; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() + m, 1);
      const monthStr = d.toISOString().slice(0, 7);
      data.push({
        month: monthStr,
        label: formatMonthShort(monthStr, true),
        pessimista: pessimista[m],
        base: base[m],
        otimista: otimista[m],
      });
    }

    // Summary: total cost over 12 months for each scenario
    const sumPess = pessimista.reduce((s, v) => s + v, 0);
    const sumBase = base.reduce((s, v) => s + v, 0);
    const sumOpt = otimista.reduce((s, v) => s + v, 0);

    return {
      projectionData: data,
      currentMonthly: currentTotal,
      summary: {
        pessimista: { total: sumPess, monthlyEnd: pessimista[months - 1], delta: sumPess - sumBase },
        base: { total: sumBase, monthlyEnd: base[months - 1], delta: 0 },
        otimista: { total: sumOpt, monthlyEnd: otimista[months - 1], delta: sumOpt - sumBase },
      },
      indexRates: rates,
    };
  }, [recurrences, latestIndices, months]);

  const isLoading = loadingRec || loadingIdx;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (currentMonthly <= 0) {
    return (
      <div className="py-8 text-center">
        <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">
          Sem despesas recorrentes cadastradas
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Cadastre recorrências em Contas a Pagar para projetar o custo futuro
        </p>
      </div>
    );
  }

  const ipca = indexRates.ipca ?? 0;
  const igpm = indexRates.igpm ?? 0;

  return (
    <div className="space-y-6">
      {/* Context */}
      <div className="rounded-lg bg-primary/5 p-3">
        <p className="text-xs text-muted-foreground">
          Custo mensal atual:{" "}
          <strong className="text-foreground">{formatCurrency(currentMonthly)}</strong>
          {" · "}IPCA: {ipca.toFixed(2)}% a.m.
          {igpm !== 0 && <> · IGP-M: {igpm.toFixed(2)}% a.m.</>}
        </p>
      </div>

      {/* Chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={projectionData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)
              }
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === "pessimista"
                  ? "Pessimista"
                  : name === "otimista"
                    ? "Otimista"
                    : "Base",
              ]}
              contentStyle={{
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(47,32,59,0.12)",
                border: "none",
                fontSize: "12px",
              }}
            />
            <Legend
              iconType="line"
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              formatter={(value: string) =>
                value === "pessimista"
                  ? "Pessimista (IPCA + 2 p.p.)"
                  : value === "otimista"
                    ? "Otimista (IPCA - 1 p.p.)"
                    : "Base (índices atuais)"
              }
            />
            <Line
              dataKey="pessimista"
              type="monotone"
              stroke="#A64A45"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
            />
            <Line
              dataKey="base"
              type="monotone"
              stroke="#56688F"
              strokeWidth={2.5}
              dot={{ r: 2 }}
            />
            <Line
              dataKey="otimista"
              type="monotone"
              stroke="#2F7A68"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Scenario cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Pessimista */}
        <div className="rounded-lg border border-terracotta/20 bg-terracotta/5 p-4">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-terracotta" />
            <span className="text-xs font-semibold text-terracotta">Pessimista</span>
          </div>
          <p className="mt-2 text-lg font-bold tabular-nums">
            {formatCurrency(summary.pessimista.total)}
          </p>
          <p className="text-[10px] text-muted-foreground">custo total em 12 meses</p>
          <p className="mt-1 text-xs tabular-nums text-terracotta">
            +{formatCurrency(summary.pessimista.delta)} vs base
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Mês 12: {formatCurrency(summary.pessimista.monthlyEnd)}/mês
          </p>
        </div>

        {/* Base */}
        <div className="rounded-lg border border-info-slate/20 bg-info-slate/5 p-4">
          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-info-slate" />
            <span className="text-xs font-semibold text-info-slate">Base</span>
          </div>
          <p className="mt-2 text-lg font-bold tabular-nums">
            {formatCurrency(summary.base.total)}
          </p>
          <p className="text-[10px] text-muted-foreground">custo total em 12 meses</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Projeção com índices atuais
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Mês 12: {formatCurrency(summary.base.monthlyEnd)}/mês
          </p>
        </div>

        {/* Otimista */}
        <div className="rounded-lg border border-verdant/20 bg-verdant/5 p-4">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-verdant" />
            <span className="text-xs font-semibold text-verdant">Otimista</span>
          </div>
          <p className="mt-2 text-lg font-bold tabular-nums">
            {formatCurrency(summary.otimista.total)}
          </p>
          <p className="text-[10px] text-muted-foreground">custo total em 12 meses</p>
          <p className="mt-1 text-xs tabular-nums text-verdant">
            {formatCurrency(summary.otimista.delta)} vs base
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Mês 12: {formatCurrency(summary.otimista.monthlyEnd)}/mês
          </p>
        </div>
      </div>

      {/* Methodology note */}
      <details className="rounded-lg border bg-muted/30 p-3">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
          Metodologia
        </summary>
        <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
          <p>
            Cada despesa recorrente é projetada pelo seu índice de reajuste cadastrado.
            Recorrências sem índice usam IPCA como referência.
          </p>
          <p>
            Base: índices atuais mantidos por 12 meses (compostos mensalmente).
          </p>
          <p>
            Pessimista: base + 2 pontos percentuais anuais.
            Otimista: base - 1 ponto percentual anual.
          </p>
          <p>
            Fonte dos índices: BCB SGS (coleta diária automática).
            Valores usados: IPCA {ipca.toFixed(2)}% a.m.
            {igpm !== 0 && <>, IGP-M {igpm.toFixed(2)}% a.m.</>}
          </p>
        </div>
      </details>
    </div>
  );
}
