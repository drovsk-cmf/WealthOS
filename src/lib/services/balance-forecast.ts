/**
 * Oniefy - Balance Forecasting Engine (E38)
 *
 * Projects future account balances using:
 * 1. Current balance as starting point
 * 2. Confirmed recurrences (known future cash flows)
 * 3. Historical spending trend (average monthly net)
 * 4. Seasonal adjustments from E33
 *
 * NOT a Monte Carlo simulation. Deterministic projection based on
 * observable data. "If nothing changes, here's where you'll be."
 *
 * Gap competitivo: Monarch tem. Diferente das calculadoras TVM que são simulação manual.
 */

export interface ForecastInput {
  currentBalance: number;
  /** Monthly net (income - expenses) averaged over recent months */
  monthlyNet: number;
  /** Known recurring expenses (monthly amounts, positive = income, negative = expense) */
  recurringFlows: { description: string; monthlyAmount: number }[];
  /** Optional: seasonal adjustments by month (1-12). Value = extra expense expected. */
  seasonalAdjustments?: Record<number, number>;
  /** Months to project (default: 12) */
  months?: number;
}

export interface ForecastPoint {
  month: number; // 1-based from start
  date: string; // YYYY-MM
  projectedBalance: number;
  /** Breakdown of what changed */
  recurringIncome: number;
  recurringExpenses: number;
  trendNet: number;
  seasonalAdjustment: number;
  netChange: number;
}

export interface ForecastResult {
  points: ForecastPoint[];
  /** Month when balance goes negative (0 = never in projection window) */
  negativeMonth: number;
  /** Projected balance at end of forecast */
  endBalance: number;
  /** Average monthly net change */
  avgMonthlyNet: number;
  /** Summary text */
  summary: string;
}

/**
 * Project future balances month by month.
 */
export function forecastBalances(input: ForecastInput): ForecastResult {
  const {
    currentBalance,
    monthlyNet,
    recurringFlows,
    seasonalAdjustments = {},
    months = 12,
  } = input;

  // Separate recurring income and expenses
  const recurringIncome = recurringFlows
    .filter((f) => f.monthlyAmount > 0)
    .reduce((s, f) => s + f.monthlyAmount, 0);
  const recurringExpenses = recurringFlows
    .filter((f) => f.monthlyAmount < 0)
    .reduce((s, f) => s + f.monthlyAmount, 0);

  // Trend net = historical average minus known recurrences (to avoid double-counting)
  const knownRecurringNet = recurringIncome + recurringExpenses;
  const trendNet = monthlyNet - knownRecurringNet;

  const now = new Date();
  let balance = currentBalance;
  const points: ForecastPoint[] = [];
  let negativeMonth = 0;

  for (let i = 1; i <= months; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const calendarMonth = futureDate.getMonth() + 1; // 1-12
    const dateStr = `${futureDate.getFullYear()}-${String(calendarMonth).padStart(2, "0")}`;

    const seasonal = seasonalAdjustments[calendarMonth] ?? 0;
    const netChange = round2(recurringIncome + recurringExpenses + trendNet - seasonal);
    balance = round2(balance + netChange);

    points.push({
      month: i,
      date: dateStr,
      projectedBalance: balance,
      recurringIncome: round2(recurringIncome),
      recurringExpenses: round2(Math.abs(recurringExpenses)),
      trendNet: round2(trendNet),
      seasonalAdjustment: round2(seasonal),
      netChange,
    });

    if (balance < 0 && negativeMonth === 0) {
      negativeMonth = i;
    }
  }

  const endBalance = points.length > 0 ? points[points.length - 1].projectedBalance : currentBalance;
  const avgNet = points.length > 0
    ? round2(points.reduce((s, p) => s + p.netChange, 0) / points.length)
    : 0;

  // Generate summary
  let summary: string;
  if (negativeMonth > 0) {
    summary = `Atenção: saldo fica negativo em ${negativeMonth} ${negativeMonth === 1 ? "mês" : "meses"}. ` +
      `Considere reduzir despesas ou aumentar receita.`;
  } else if (endBalance > currentBalance * 1.1) {
    summary = `Projeção positiva: saldo cresce ${((endBalance / currentBalance - 1) * 100).toFixed(0)}% ` +
      `nos próximos ${months} meses (R$ ${formatBRL(endBalance)}).`;
  } else if (endBalance < currentBalance * 0.9) {
    summary = `Saldo em queda: diminui ${((1 - endBalance / currentBalance) * 100).toFixed(0)}% ` +
      `nos próximos ${months} meses (R$ ${formatBRL(endBalance)}).`;
  } else {
    summary = `Saldo estável nos próximos ${months} meses (R$ ${formatBRL(endBalance)}).`;
  }

  return {
    points,
    negativeMonth,
    endBalance,
    avgMonthlyNet: avgNet,
    summary,
  };
}

/**
 * Quick forecast from minimal inputs (for dashboard card).
 */
export function quickForecast(
  currentBalance: number,
  avgMonthlyIncome: number,
  avgMonthlyExpenses: number,
  months = 6
): ForecastResult {
  return forecastBalances({
    currentBalance,
    monthlyNet: avgMonthlyIncome - avgMonthlyExpenses,
    recurringFlows: [],
    months,
  });
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
