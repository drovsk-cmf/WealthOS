"use client";

/**
 * Oniefy - Diagnóstico Financeiro (Camada A + B)
 *
 * 11 métricas financeiras:
 * Camada A (diagnóstico): Savings Rate, HHI, WACC, D/E, Working Capital, Breakeven
 * Camada B (temporal): Income CV, DuPont Pessoal, Category Trends, Warning Signs, Monthly History
 *
 * Ref: docs/FINANCIAL-METHODOLOGY.md §2-3
 */

import { useState } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Shield,
  PiggyBank,
  Scale,
  Percent,
  BarChart3,
  Layers,
  ChevronUp,
  Info,
} from "lucide-react";
import {
  useFinancialDiagnostics,
  savingsRateExplanation,
  hhiExplanation,
  waccExplanation,
  debtToEquityExplanation,
  volatilityExplanation,
  dupontExplanation,
  warningLabel,
} from "@/lib/hooks/use-diagnostics";
import type { FinancialDiagnostics, CategoryTrendItem } from "@/lib/hooks/use-diagnostics";
import { formatCurrency } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";

// ─── Metric Card ───────────────────────────────────────────

function MetricCard({
  title,
  icon: Icon,
  value,
  subtitle,
  explanation,
  accentColor,
  children,
}: {
  title: string;
  icon: React.ElementType;
  value: string;
  subtitle?: string;
  explanation?: string;
  accentColor?: string;
  children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card p-5 shadow-card card-alive">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        </div>
        {explanation && (
          <button
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? "Ocultar explicação" : "Ver explicação"}
            className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <Info className="h-4 w-4" />}
          </button>
        )}
      </div>
      <div className="mt-2">
        <p className={`text-2xl font-semibold font-mono ${accentColor ?? "text-foreground"}`}>
          {value}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {expanded && explanation && (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground border-t pt-3">
          {explanation}
        </p>
      )}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

// ─── Warning Signs ─────────────────────────────────────────

function WarningSignsCard({ data }: { data: FinancialDiagnostics["warning_signs"] }) {
  const activeWarnings = (
    Object.entries(data) as [string, boolean | number][]
  ).filter(([key, val]) => key !== "count" && val === true);

  if (activeWarnings.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-5 shadow-card card-alive">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-verdant-500" />
          <h3 className="text-sm font-medium text-muted-foreground">Sinais de Alerta</h3>
        </div>
        <p className="mt-2 text-sm text-verdant-600 dark:text-verdant-400">
          Nenhum sinal de alerta detectado. Tendências dos últimos 3 meses estáveis.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-ember-200 bg-card p-5 shadow-card dark:border-ember-800">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-ember-500" />
        <h3 className="text-sm font-medium text-ember-600 dark:text-ember-400">
          {data.count} {data.count === 1 ? "Sinal" : "Sinais"} de Alerta
        </h3>
      </div>
      <ul className="mt-3 space-y-2">
        {activeWarnings.map(([key]) => (
          <li key={key} className="flex items-start gap-2 text-sm">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ember-500" />
            <span className="text-foreground/80">
              {warningLabel(key as "burn_rising" | "nw_declining" | "runway_shrinking" | "savings_negative")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Category Trends ───────────────────────────────────────

function CategoryTrendsCard({ trends }: { trends: CategoryTrendItem[] }) {
  if (trends.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-5 shadow-card card-alive">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">Tendências por Categoria</h3>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Dados insuficientes. São necessários pelo menos 2 meses com despesas categorizadas.
        </p>
      </div>
    );
  }

  const directionIcon = (dir: string) => {
    if (dir === "up") return <TrendingUp className="h-3.5 w-3.5 text-ember-500" />;
    if (dir === "down") return <TrendingDown className="h-3.5 w-3.5 text-verdant-500" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <div className="rounded-lg border bg-card p-5 shadow-card card-alive">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">
          Tendências por Categoria (3 meses)
        </h3>
      </div>
      <div className="space-y-2">
        {trends.map((t, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {t.color && (
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
              )}
              <span className="truncate max-w-[140px]">{t.cname}</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <Mv><span>{formatCurrency(t.m3 || t.m2)}</span></Mv>
              <span className="flex items-center gap-0.5">
                {directionIcon(t.direction)}
                <span className={
                  t.direction === "up" ? "text-ember-500" :
                  t.direction === "down" ? "text-verdant-500" :
                  "text-muted-foreground"
                }>
                  {t.trend_pct > 0 ? "+" : ""}{t.trend_pct}%
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DuPont ────────────────────────────────────────────────

function DuPontCard({ data }: { data: FinancialDiagnostics["dupont_personal"] }) {
  const explanation = dupontExplanation(data);
  const roePercent = (data.roe * 100).toFixed(1);

  return (
    <MetricCard
      title="DuPont Pessoal"
      icon={Layers}
      value={`ROE ${roePercent}%`}
      subtitle="Eficiência financeira decomposta em 3 fatores"
      explanation={explanation}
    >
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded bg-muted/50 p-2">
          <p className="text-[10px] text-muted-foreground">Margem</p>
          <p className="font-mono text-sm">{(data.savings_margin * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded bg-muted/50 p-2">
          <p className="text-[10px] text-muted-foreground">Giro</p>
          <p className="font-mono text-sm">{data.asset_turnover.toFixed(2)}x</p>
        </div>
        <div className="rounded bg-muted/50 p-2">
          <p className="text-[10px] text-muted-foreground">Alavancagem</p>
          <p className="font-mono text-sm">{data.equity_multiplier.toFixed(2)}x</p>
        </div>
      </div>
    </MetricCard>
  );
}

// ─── Monthly History Sparkline ─────────────────────────────

function MonthlyHistoryCard({ history }: { history: FinancialDiagnostics["monthly_history"] }) {
  if (history.length < 2) {
    return (
      <div className="rounded-lg border bg-card p-5 shadow-card card-alive col-span-full">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">Histórico Mensal</h3>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Dados insuficientes. O histórico aparece após 2+ snapshots mensais.
        </p>
      </div>
    );
  }

  const maxNw = Math.max(...history.map(h => Math.abs(h.net_worth)), 1);

  return (
    <div className="rounded-lg border bg-card p-5 shadow-card card-alive col-span-full">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">Histórico Mensal</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b">
              <th className="py-1.5 text-left font-medium">Mês</th>
              <th className="py-1.5 text-right font-medium">Receita</th>
              <th className="py-1.5 text-right font-medium">Despesa</th>
              <th className="py-1.5 text-right font-medium">Poupança</th>
              <th className="py-1.5 text-right font-medium">Patrimônio</th>
              <th className="py-1.5 text-right font-medium">Fôlego</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, i) => {
              const month = new Date(h.month).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
              const barWidth = Math.abs(h.net_worth) / maxNw * 100;
              return (
                <tr key={i} className="border-b border-muted/30 last:border-0">
                  <td className="py-1.5 font-medium">{month}</td>
                  <td className="py-1.5 text-right font-mono"><Mv>{formatCurrency(h.income)}</Mv></td>
                  <td className="py-1.5 text-right font-mono"><Mv>{formatCurrency(h.expense)}</Mv></td>
                  <td className={`py-1.5 text-right font-mono ${h.savings_rate >= 0 ? "text-verdant-600 dark:text-verdant-400" : "text-ember-500"}`}>
                    {h.savings_rate.toFixed(1)}%
                  </td>
                  <td className="py-1.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="h-1.5 rounded-full bg-muted" style={{ width: 48 }}>
                        <div
                          className={`h-full rounded-full ${h.net_worth >= 0 ? "bg-verdant-500" : "bg-ember-500"}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="font-mono w-20 text-right"><Mv>{formatCurrency(h.net_worth)}</Mv></span>
                    </div>
                  </td>
                  <td className="py-1.5 text-right font-mono">
                    {h.runway > 900 ? "∞" : `${h.runway.toFixed(0)}m`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Activity className="h-12 w-12 text-muted-foreground/30" />
      <h2 className="mt-4 text-lg font-medium">Diagnóstico Financeiro</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Registre transações, contas e ativos para que o Oniefy calcule suas métricas financeiras.
        Métricas quantitativas de análise financeira aplicadas ao seu contexto pessoal.
      </p>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────

export default function DiagnosticsPage() {
  const { data, isLoading, error } = useFinancialDiagnostics();

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Diagnóstico Financeiro</h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border bg-muted/30" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-ember-500">Erro ao carregar diagnóstico: {error.message}</p>
      </div>
    );
  }

  if (!data) return <EmptyState />;

  const hasData = data.savings_rate.avg_income > 0 || data.patrimony_hhi.total_patrimony > 0;
  if (!hasData) return <EmptyState />;

  const sr = savingsRateExplanation(data.savings_rate.value);
  const de = data.debt_to_equity.value;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-semibold">Diagnóstico Financeiro</h1>
          <p className="text-xs text-muted-foreground">
            {data.savings_rate.months_analyzed} meses analisados. Análise baseada em métricas de finanças quantitativas aplicadas ao contexto pessoal.
          </p>
        </div>
      </div>

      {/* Warning Signs (full width if active) */}
      <WarningSignsCard data={data.warning_signs} />

      {/* Camada A: 6 métricas diagnósticas */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Diagnóstico
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* A1: Savings Rate */}
          <MetricCard
            title="Taxa de Poupança"
            icon={PiggyBank}
            value={`${data.savings_rate.value}%`}
            subtitle={`Superávit: ${formatCurrency(data.savings_rate.monthly_surplus)}/mês`}
            explanation={sr.text}
            accentColor={sr.color}
          >
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Receita: <Mv><span className="font-mono">{formatCurrency(data.savings_rate.avg_income)}</span></Mv></span>
              <span>Despesa: <Mv><span className="font-mono">{formatCurrency(data.savings_rate.avg_expense)}</span></Mv></span>
            </div>
          </MetricCard>

          {/* A2: HHI */}
          <MetricCard
            title="Concentração Patrimonial (HHI)"
            icon={Layers}
            value={data.patrimony_hhi.value.toFixed(4)}
            subtitle={`${data.patrimony_hhi.concentration === "diversified" ? "Diversificado" :
              data.patrimony_hhi.concentration === "moderate" ? "Moderado" :
              data.patrimony_hhi.concentration === "high" ? "Concentrado" : "Crítico"}`}
            explanation={hhiExplanation(
              data.patrimony_hhi.value,
              data.patrimony_hhi.top_item,
              data.patrimony_hhi.top_pct
            )}
            accentColor={
              data.patrimony_hhi.concentration === "critical" ? "text-ember-500" :
              data.patrimony_hhi.concentration === "high" ? "text-burnished-500" :
              "text-foreground"
            }
          />

          {/* A3: WACC */}
          <MetricCard
            title="WACC Pessoal"
            icon={Percent}
            value={data.wacc_personal.value > 0 ? `${data.wacc_personal.value}% a.m.` : "Sem dívidas"}
            subtitle={data.wacc_personal.debt_count > 0
              ? `${data.wacc_personal.debt_count} dívida${data.wacc_personal.debt_count > 1 ? "s" : ""} ativa${data.wacc_personal.debt_count > 1 ? "s" : ""}`
              : undefined}
            explanation={waccExplanation(data.wacc_personal.value)}
          />

          {/* A4: D/E */}
          <MetricCard
            title="Debt-to-Equity"
            icon={Scale}
            value={de.toFixed(3)}
            subtitle={de === 0 ? "Sem alavancagem" : de < 0.3 ? "Conservador" : de < 0.6 ? "Moderado" : de < 1 ? "Elevado" : "Crítico"}
            explanation={debtToEquityExplanation(de)}
            accentColor={de >= 1 ? "text-ember-500" : de >= 0.6 ? "text-burnished-500" : "text-foreground"}
          >
            {de > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Dívida: <Mv><span className="font-mono">{formatCurrency(data.debt_to_equity.total_debt)}</span></Mv></span>
                <span>PL: <Mv><span className="font-mono">{formatCurrency(data.debt_to_equity.net_worth)}</span></Mv></span>
              </div>
            )}
          </MetricCard>

          {/* A5: Working Capital */}
          <MetricCard
            title="Capital de Giro"
            icon={TrendingUp}
            value={formatCurrency(data.working_capital.value)}
            subtitle="Ativos líquidos - obrigações 30 dias"
            explanation={
              data.working_capital.value > 0
                ? `Folga de ${formatCurrency(data.working_capital.value)} acima das obrigações dos próximos 30 dias.`
                : "Obrigações de curto prazo excedem ativos líquidos. Risco de descasamento."
            }
            accentColor={data.working_capital.value < 0 ? "text-ember-500" : "text-foreground"}
          />

          {/* A6: Breakeven */}
          <MetricCard
            title="Ponto de Equilíbrio"
            icon={BarChart3}
            value={formatCurrency(data.breakeven.monthly_value)}
            subtitle={`${data.breakeven.variable_pct.toFixed(0)}% das despesas são variáveis`}
            explanation={
              data.breakeven.monthly_value > 0
                ? `Para cobrir despesas fixas de ${formatCurrency(data.breakeven.fixed_expenses)}/mês, ` +
                  `você precisa de renda mínima de ${formatCurrency(data.breakeven.monthly_value)}/mês.`
                : "Sem despesas recorrentes registradas."
            }
          />
        </div>
      </section>

      {/* Camada B: análises temporais */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Análises Temporais
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* B1: Income Volatility */}
          <MetricCard
            title="Volatilidade de Renda"
            icon={Activity}
            value={`CV ${data.income_volatility.cv}`}
            subtitle={data.income_volatility.risk_level === "low" ? "Estável" :
              data.income_volatility.risk_level === "moderate" ? "Moderada" :
              data.income_volatility.risk_level === "high" ? "Alta" : "Crítica"}
            explanation={volatilityExplanation(data.income_volatility.cv)}
            accentColor={
              data.income_volatility.risk_level === "critical" ? "text-ember-500" :
              data.income_volatility.risk_level === "high" ? "text-burnished-500" :
              "text-foreground"
            }
          >
            {data.income_volatility.months_analyzed >= 2 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Média: <Mv><span className="font-mono">{formatCurrency(data.income_volatility.mean)}</span></Mv></span>
                <span>σ: <Mv><span className="font-mono">{formatCurrency(data.income_volatility.std_dev)}</span></Mv></span>
              </div>
            )}
          </MetricCard>

          {/* B2: DuPont */}
          <DuPontCard data={data.dupont_personal} />

          {/* B3: Category Trends */}
          <CategoryTrendsCard trends={data.category_trends} />
        </div>
      </section>

      {/* B5: Monthly History (full width table) */}
      <section>
        <MonthlyHistoryCard history={data.monthly_history} />
      </section>
    </div>
  );
}
