/**
 * Oniefy - Seasonal Expense Provisioning (E33)
 *
 * Detects categories with seasonal spending patterns and suggests
 * monthly provisioning to smooth out spikes.
 *
 * Algorithm:
 * 1. Group expenses by category + month over the last 12-24 months
 * 2. For each category, check if any month exceeds 2x the monthly average
 * 3. If so, it's seasonal: suggest provisioning 1/12 of the annual total monthly
 * 4. Alert 3 months before the spike month
 *
 * Ref: docs/FEATURES-ROADMAP-SPEC.md §3 item #11
 */

export interface TransactionForSeasonal {
  amount: number; // negative for expenses
  date: string; // ISO date
  category_name: string | null;
}

export interface SeasonalPattern {
  categoryName: string;
  /** Month numbers (1-12) where spending spikes */
  spikeMonths: number[];
  /** Average monthly spending across all months */
  monthlyAverage: number;
  /** Peak month spending */
  peakSpending: number;
  /** Ratio of peak to average (2x+ = seasonal) */
  spikeRatio: number;
  /** Suggested monthly provision to smooth spikes */
  suggestedProvision: number;
  /** Annual total for this category */
  annualTotal: number;
}

export interface SeasonalAlert {
  categoryName: string;
  spikeMonth: number;
  spikeMonthName: string;
  monthsUntil: number;
  expectedAmount: number;
  suggestedProvision: number;
  message: string;
}

const MONTH_NAMES = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/**
 * Detect seasonal spending patterns from transaction history.
 *
 * @param transactions - At least 12 months of expense transactions
 * @param minSpikeRatio - Minimum ratio of peak to average to qualify (default: 2.0)
 */
export function detectSeasonalPatterns(
  transactions: TransactionForSeasonal[],
  minSpikeRatio = 2.0
): SeasonalPattern[] {
  // Filter expenses with categories
  const expenses = transactions.filter(
    (t) => t.amount < 0 && t.category_name && t.category_name.trim().length > 0
  );

  if (expenses.length === 0) return [];

  // Group by category + month
  const byCategory = new Map<string, Map<number, number>>();
  for (const tx of expenses) {
    const cat = tx.category_name!;
    const month = parseInt(tx.date.slice(5, 7), 10);
    if (!byCategory.has(cat)) byCategory.set(cat, new Map());
    const monthMap = byCategory.get(cat)!;
    monthMap.set(month, (monthMap.get(month) ?? 0) + Math.abs(tx.amount));
  }

  const results: SeasonalPattern[] = [];

  for (const [cat, monthMap] of byCategory) {
    if (monthMap.size < 6) continue; // Need at least 6 months of data

    const values = Array.from(monthMap.values());
    const total = values.reduce((s, v) => s + v, 0);
    const avg = total / 12; // Annualized average per month

    if (avg < 50) continue; // Skip very small categories

    // Find spike months
    const spikeMonths: number[] = [];
    let peakSpending = 0;

    for (const [month, spending] of monthMap) {
      if (spending > avg * minSpikeRatio) {
        spikeMonths.push(month);
      }
      if (spending > peakSpending) peakSpending = spending;
    }

    if (spikeMonths.length === 0) continue;
    if (spikeMonths.length > 4) continue; // More than 4 spike months = not seasonal

    const spikeRatio = avg > 0 ? round2(peakSpending / avg) : 0;

    results.push({
      categoryName: cat,
      spikeMonths: spikeMonths.sort((a, b) => a - b),
      monthlyAverage: round2(avg),
      peakSpending: round2(peakSpending),
      spikeRatio,
      suggestedProvision: round2(total / 12),
      annualTotal: round2(total),
    });
  }

  // Sort by spike ratio descending
  results.sort((a, b) => b.spikeRatio - a.spikeRatio);
  return results;
}

/**
 * Generate alerts for upcoming seasonal spikes.
 * Alerts 3 months before each spike month.
 */
export function getSeasonalAlerts(
  patterns: SeasonalPattern[],
  currentMonth?: number
): SeasonalAlert[] {
  const now = currentMonth ?? (new Date().getMonth() + 1);
  const alerts: SeasonalAlert[] = [];

  for (const pattern of patterns) {
    for (const spikeMonth of pattern.spikeMonths) {
      const monthsUntil = ((spikeMonth - now + 12) % 12) || 12;

      if (monthsUntil <= 3) {
        alerts.push({
          categoryName: pattern.categoryName,
          spikeMonth,
          spikeMonthName: MONTH_NAMES[spikeMonth],
          monthsUntil,
          expectedAmount: pattern.peakSpending,
          suggestedProvision: pattern.suggestedProvision,
          message:
            `${pattern.categoryName}: gasto previsto de R$ ${pattern.peakSpending.toFixed(2).replace(".", ",")} ` +
            `em ${MONTH_NAMES[spikeMonth]}` +
            (monthsUntil === 1 ? " (mês que vem)" : ` (em ${monthsUntil} meses)`) +
            `. Provisionar R$ ${pattern.suggestedProvision.toFixed(2).replace(".", ",")}/mês suaviza o impacto.`,
        });
      }
    }
  }

  // Sort by months until (most urgent first)
  alerts.sort((a, b) => a.monthsUntil - b.monthsUntil);
  return alerts;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
