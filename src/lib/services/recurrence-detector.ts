/**
 * Oniefy - Recurrence Detector (E26)
 *
 * Scans transaction history and identifies recurring patterns.
 * Pure function: takes transactions, returns candidates.
 * Ref: docs/FEATURES-ROADMAP-SPEC.md §3.2
 *
 * Algorithm:
 * 1. Group transactions by normalized description + account
 * 2. For each group, check if transactions appear in ≥3 distinct months
 * 3. Value tolerance: ±5% for variable amounts, exact for fixed
 * 4. Return candidates sorted by confidence (months matched / total months)
 */

export interface TransactionForDetection {
  id: string;
  description: string | null;
  amount: number;
  date: string; // ISO date
  account_id: string;
  category_id: string | null;
  /** If already linked to a recurrence, skip */
  recurrence_id?: string | null;
}

export interface DetectedRecurrence {
  /** Normalized description used for grouping */
  description: string;
  /** Original description from most recent transaction */
  originalDescription: string;
  accountId: string;
  categoryId: string | null;
  /** Average amount across occurrences */
  averageAmount: number;
  /** Most recent amount */
  latestAmount: number;
  /** Coefficient of variation (stddev/mean). Low = fixed, high = variable */
  amountCV: number;
  /** Number of distinct months with this transaction */
  monthsDetected: number;
  /** Total months in the analysis window */
  totalMonths: number;
  /** Confidence score 0-1 (monthsDetected / totalMonths) */
  confidence: number;
  /** Detected frequency */
  frequency: "monthly" | "bimonthly" | "quarterly" | "annual";
  /** Estimated day of month */
  estimatedDay: number;
  /** IDs of transactions that form this pattern */
  transactionIds: string[];
  /** Whether this looks like a fixed subscription (low CV) or variable bill */
  type: "subscription" | "variable_bill";
}

/**
 * Detect recurring transaction patterns.
 *
 * @param transactions - Recent transactions (ideally 6-12 months)
 * @param existingRecurrenceDescriptions - Descriptions already tracked as recurrences (to exclude)
 * @param minMonths - Minimum distinct months to qualify (default: 3)
 */
export function detectRecurrences(
  transactions: TransactionForDetection[],
  existingRecurrenceDescriptions: string[] = [],
  minMonths = 3
): DetectedRecurrence[] {
  // Filter: expenses only, with description, not already linked
  const candidates = transactions.filter(
    (t) =>
      t.amount < 0 &&
      t.description &&
      t.description.trim().length > 2 &&
      !t.recurrence_id
  );

  if (candidates.length === 0) return [];

  // Normalize existing descriptions for comparison
  const existingNorm = new Set(
    existingRecurrenceDescriptions.map(normalizeDescription)
  );

  // Group by normalized description + account
  const groups = new Map<string, TransactionForDetection[]>();
  for (const tx of candidates) {
    const key = `${normalizeDescription(tx.description!)}::${tx.account_id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }

  // Analyze each group
  const results: DetectedRecurrence[] = [];

  // Total months in analysis window
  const totalMonths = Math.max(
    1,
    monthDiff(oldestDate(candidates), newestDate(candidates))
  );

  for (const [key, txs] of groups) {
    if (txs.length < minMonths) continue;

    const normDesc = key.split("::")[0];

    // Skip if already tracked
    if (existingNorm.has(normDesc)) continue;

    // Get distinct months
    const months = new Set(txs.map((t) => t.date.slice(0, 7))); // YYYY-MM
    const monthCount = months.size;

    if (monthCount < minMonths) continue;

    // Sort by date
    txs.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate amount statistics
    const amounts = txs.map((t) => Math.abs(t.amount));
    const avg = amounts.reduce((s, v) => s + v, 0) / amounts.length;
    const stddev = Math.sqrt(
      amounts.reduce((s, v) => s + (v - avg) ** 2, 0) / amounts.length
    );
    const cv = avg > 0 ? stddev / avg : 0;

    // Check value consistency
    // For subscriptions (CV < 5%): nearly identical amounts
    // For variable bills (CV < 30%): within reasonable variance
    if (cv > 0.3) continue; // Too variable, probably not recurring

    // Detect frequency
    const sortedMonths = Array.from(months).sort();
    const frequency = detectFrequency(sortedMonths);

    // Estimated day of month
    const days = txs.map((t) => parseInt(t.date.slice(8, 10)));
    const estimatedDay = Math.round(
      days.reduce((s, d) => s + d, 0) / days.length
    );

    const latest = txs[txs.length - 1];

    results.push({
      description: normDesc,
      originalDescription: latest.description!,
      accountId: latest.account_id,
      categoryId: latest.category_id,
      averageAmount: round2(avg),
      latestAmount: Math.abs(latest.amount),
      amountCV: round4(cv),
      monthsDetected: monthCount,
      totalMonths: Math.min(totalMonths, 12),
      confidence: round4(Math.min(1, monthCount / Math.min(totalMonths, 12))),
      frequency,
      estimatedDay,
      transactionIds: txs.map((t) => t.id),
      type: cv < 0.05 ? "subscription" : "variable_bill",
    });
  }

  // Sort by confidence descending, then by amount
  results.sort((a, b) => b.confidence - a.confidence || b.averageAmount - a.averageAmount);

  return results;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Normalize description for grouping.
 * Removes numbers that look like dates/IDs, lowercases, trims.
 */
function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .trim()
    // Remove common date patterns (DD/MM, MM/YYYY)
    .replace(/\d{2}\/\d{2}(\/\d{2,4})?/g, "")
    // Remove standalone numbers (IDs, reference numbers)
    .replace(/\b\d{4,}\b/g, "")
    // Remove extra whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/** Detect frequency from sorted month strings. */
function detectFrequency(
  months: string[]
): "monthly" | "bimonthly" | "quarterly" | "annual" {
  if (months.length < 2) return "monthly";

  const gaps: number[] = [];
  for (let i = 1; i < months.length; i++) {
    gaps.push(monthDiffStr(months[i - 1], months[i]));
  }

  const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;

  if (avgGap <= 1.3) return "monthly";
  if (avgGap <= 2.5) return "bimonthly";
  if (avgGap <= 4) return "quarterly";
  return "annual";
}

function monthDiffStr(a: string, b: string): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

function monthDiff(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + 1;
}

function oldestDate(txs: TransactionForDetection[]): Date {
  const min = txs.reduce((m, t) => (t.date < m ? t.date : m), txs[0].date);
  return new Date(min);
}

function newestDate(txs: TransactionForDetection[]): Date {
  const max = txs.reduce((m, t) => (t.date > m ? t.date : m), txs[0].date);
  return new Date(max);
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}
