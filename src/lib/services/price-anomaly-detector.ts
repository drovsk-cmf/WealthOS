/**
 * Oniefy - Price Anomaly Detector (E27)
 *
 * Compares current value of a recurrence against its historical average.
 * Ref: docs/FEATURES-ROADMAP-SPEC.md §3.3
 *
 * Thresholds (configurable):
 * - amber: >15% above average
 * - red: >30% above average
 */

export type AlertSeverity = "normal" | "amber" | "red";

export interface PriceAlert {
  description: string;
  currentAmount: number;
  averageAmount: number;
  percentChange: number;
  severity: AlertSeverity;
  message: string;
}

export interface PriceAlertThresholds {
  /** Percentage above average for amber alert (default 15) */
  amber: number;
  /** Percentage above average for red alert (default 30) */
  red: number;
}

const DEFAULT_THRESHOLDS: PriceAlertThresholds = {
  amber: 15,
  red: 30,
};

/**
 * Check a single recurrence for price anomaly.
 *
 * @param description - Recurrence description
 * @param currentAmount - Most recent amount (positive)
 * @param historicalAmounts - Previous amounts (positive, at least 2)
 * @param thresholds - Custom thresholds (optional)
 */
export function checkPriceAnomaly(
  description: string,
  currentAmount: number,
  historicalAmounts: number[],
  thresholds: PriceAlertThresholds = DEFAULT_THRESHOLDS
): PriceAlert | null {
  if (historicalAmounts.length < 2) return null;
  if (currentAmount <= 0) return null;

  const avg =
    historicalAmounts.reduce((s, v) => s + v, 0) / historicalAmounts.length;
  if (avg <= 0) return null;

  const pctChange = ((currentAmount - avg) / avg) * 100;

  let severity: AlertSeverity = "normal";
  if (pctChange >= thresholds.red) severity = "red";
  else if (pctChange >= thresholds.amber) severity = "amber";

  if (severity === "normal") return null;

  const direction = pctChange > 0 ? "subiu" : "caiu";
  const message =
    `${description}: ${direction} ${Math.abs(pctChange).toFixed(0)}%. ` +
    `Média: R$ ${avg.toFixed(2).replace(".", ",")}. ` +
    `Atual: R$ ${currentAmount.toFixed(2).replace(".", ",")}.`;

  return {
    description,
    currentAmount,
    averageAmount: Math.round(avg * 100) / 100,
    percentChange: Math.round(pctChange * 100) / 100,
    severity,
    message,
  };
}

/**
 * Batch check: analyze multiple recurrences at once.
 * Returns only alerts (filters out normal entries).
 */
export function checkAllPriceAnomalies(
  recurrences: {
    description: string;
    amounts: number[]; // ordered chronologically, last = most recent
  }[],
  thresholds?: PriceAlertThresholds
): PriceAlert[] {
  const alerts: PriceAlert[] = [];

  for (const rec of recurrences) {
    if (rec.amounts.length < 3) continue; // need at least 3 data points

    const current = rec.amounts[rec.amounts.length - 1];
    const historical = rec.amounts.slice(0, -1); // all except last

    const alert = checkPriceAnomaly(
      rec.description,
      current,
      historical,
      thresholds
    );
    if (alert) alerts.push(alert);
  }

  // Sort by severity (red first), then by percentChange
  alerts.sort((a, b) => {
    const severityOrder = { red: 0, amber: 1, normal: 2 };
    return (
      severityOrder[a.severity] - severityOrder[b.severity] ||
      Math.abs(b.percentChange) - Math.abs(a.percentChange)
    );
  });

  return alerts;
}
