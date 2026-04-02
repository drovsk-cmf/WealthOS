/**
 * Oniefy - Annual Comparison + Price Increase Detector (E32)
 *
 * 1. Compares annual spending: "2025: R$ 184k. 2026 projeta R$ 198k. +7,6%."
 * 2. Detects individual recurrence price increases vs inflation:
 *    "Condomínio subiu 15%, quase 3x a inflação de 5,2%."
 *
 * Ref: docs/FEATURES-ROADMAP-SPEC.md §3 item #10
 */

export interface AnnualExpense {
  amount: number; // negative for expenses
  date: string; // ISO date
}

export interface AnnualComparison {
  yearA: number;
  yearB: number;
  totalA: number;
  totalB: number;
  projectedB: number; // annualized if yearB is incomplete
  change: number; // absolute difference
  changePct: number; // percentage change
  aboveInflation: boolean;
  inflationRate: number;
  /** Human-readable summary */
  summary: string;
}

export interface PriceIncreaseAlert {
  description: string;
  previousAmount: number;
  currentAmount: number;
  changePct: number;
  inflationRate: number;
  /** How many times the inflation rate */
  inflationMultiple: number;
  severity: "normal" | "above_inflation" | "excessive";
  message: string;
}

/**
 * Compare total spending between two years.
 * If yearB is incomplete, projects the annual total based on months elapsed.
 */
export function compareAnnualSpending(
  transactions: AnnualExpense[],
  yearA: number,
  yearB: number,
  annualInflation: number // e.g., 5.2 for 5.2%
): AnnualComparison {
  const txA = transactions.filter(
    (t) => t.amount < 0 && t.date.startsWith(String(yearA))
  );
  const txB = transactions.filter(
    (t) => t.amount < 0 && t.date.startsWith(String(yearB))
  );

  const totalA = txA.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalB = txB.reduce((s, t) => s + Math.abs(t.amount), 0);

  // Project yearB if incomplete
  const now = new Date();
  const monthsElapsedB =
    now.getFullYear() === yearB ? now.getMonth() + 1 : 12;
  const projectedB =
    monthsElapsedB < 12 ? round2((totalB / monthsElapsedB) * 12) : totalB;

  const change = round2(projectedB - totalA);
  const changePct = totalA > 0 ? round2((change / totalA) * 100) : 0;
  const aboveInflation = changePct > annualInflation;

  const direction = changePct > 0 ? "+" : "";
  const projLabel = monthsElapsedB < 12 ? " (projetado)" : "";
  const inflNote = aboveInflation
    ? `, acima da inflação de ${annualInflation.toFixed(1)}%`
    : `, dentro da inflação de ${annualInflation.toFixed(1)}%`;

  const summary =
    `${yearA}: R$ ${formatK(totalA)}. ` +
    `${yearB}${projLabel}: R$ ${formatK(projectedB)}. ` +
    `${direction}${changePct.toFixed(1)}%${inflNote}.`;

  return {
    yearA,
    yearB,
    totalA: round2(totalA),
    totalB: round2(totalB),
    projectedB,
    change,
    changePct,
    aboveInflation,
    inflationRate: annualInflation,
    summary,
  };
}

/**
 * Detect price increases in recurring expenses compared to inflation.
 *
 * @param recurrences - Array of {description, previousAmount, currentAmount}
 * @param annualInflation - Annual inflation rate as percentage (e.g., 5.2)
 */
export function detectPriceIncreases(
  recurrences: {
    description: string;
    previousAmount: number;
    currentAmount: number;
  }[],
  annualInflation: number
): PriceIncreaseAlert[] {
  const alerts: PriceIncreaseAlert[] = [];

  for (const rec of recurrences) {
    if (rec.previousAmount <= 0 || rec.currentAmount <= 0) continue;

    const changePct = round2(
      ((rec.currentAmount - rec.previousAmount) / rec.previousAmount) * 100
    );

    if (changePct <= 0) continue; // No increase

    const inflationMultiple =
      annualInflation > 0 ? round2(changePct / annualInflation) : 0;

    let severity: PriceIncreaseAlert["severity"] = "normal";
    if (inflationMultiple >= 2) severity = "excessive";
    else if (changePct > annualInflation) severity = "above_inflation";

    if (severity === "normal") continue;

    const message =
      `${rec.description}: subiu ${changePct.toFixed(1)}%` +
      (severity === "excessive"
        ? `, ${inflationMultiple.toFixed(1)}x a inflação de ${annualInflation.toFixed(1)}%.`
        : `, acima da inflação de ${annualInflation.toFixed(1)}%.`);

    alerts.push({
      description: rec.description,
      previousAmount: rec.previousAmount,
      currentAmount: rec.currentAmount,
      changePct,
      inflationRate: annualInflation,
      inflationMultiple,
      severity,
      message,
    });
  }

  // Sort by inflation multiple descending
  alerts.sort((a, b) => b.inflationMultiple - a.inflationMultiple);
  return alerts;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function formatK(v: number): string {
  if (v >= 1000) {
    return `${(v / 1000).toFixed(v >= 100000 ? 0 : 1)}k`;
  }
  return v.toFixed(0);
}
