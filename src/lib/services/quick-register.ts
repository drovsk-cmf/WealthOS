/**
 * Oniefy - Quick Register Suggestions (E21)
 *
 * Generates contextual suggestions for rapid transaction entry:
 * - Time-based (café da manhã, almoço, jantar por horário)
 * - History-based (frequent merchants + amounts)
 * - Amount-range based (price suggests category)
 *
 * Ref: docs/QUICK-REGISTER-SPEC.md
 */

export interface HistoricalEntry {
  description: string;
  amount: number; // negative for expenses
  category_name: string | null;
  category_id: string | null;
  /** Hour of day (0-23) */
  hour: number;
  /** Day of week (0=Sun, 6=Sat) */
  dayOfWeek: number;
  count: number; // how many times this exact entry occurred
}

export interface QuickSuggestion {
  description: string;
  amount: number;
  category_name: string | null;
  category_id: string | null;
  confidence: number; // 0-1
  reason: string;
}

/**
 * Time-of-day meal patterns (BR culture).
 */
const TIME_PATTERNS: { start: number; end: number; label: string; categories: string[] }[] = [
  { start: 6, end: 9, label: "café da manhã", categories: ["Alimentação", "Padaria", "Café"] },
  { start: 11, end: 14, label: "almoço", categories: ["Alimentação", "Restaurante"] },
  { start: 17, end: 21, label: "jantar", categories: ["Alimentação", "Restaurante", "Delivery"] },
  { start: 22, end: 23, label: "lanche noturno", categories: ["Alimentação", "Delivery"] },
];

/**
 * Generate suggestions based on current context.
 *
 * @param history - Past transaction patterns (aggregated by description)
 * @param currentHour - Current hour (0-23)
 * @param currentDayOfWeek - Current day of week (0=Sun)
 * @param limit - Max suggestions to return
 */
export function getSuggestions(
  history: HistoricalEntry[],
  currentHour: number,
  currentDayOfWeek: number,
  limit = 5
): QuickSuggestion[] {
  const scored: QuickSuggestion[] = [];

  for (const entry of history) {
    let score = 0;
    const reasons: string[] = [];

    // Frequency bonus (log scale so 100x merchant doesn't dominate)
    const freqScore = Math.min(Math.log2(entry.count + 1) / 10, 0.3);
    score += freqScore;
    if (entry.count >= 5) reasons.push(`${entry.count}x no histórico`);

    // Time match bonus
    const timePattern = TIME_PATTERNS.find(
      (p) => currentHour >= p.start && currentHour <= p.end
    );
    if (timePattern && entry.category_name) {
      const catLower = entry.category_name.toLowerCase();
      if (timePattern.categories.some((c) => catLower.includes(c.toLowerCase()))) {
        score += 0.3;
        reasons.push(`Horário de ${timePattern.label}`);
      }
    }

    // Same hour bonus (±2h window)
    const hourDiff = Math.abs(entry.hour - currentHour);
    if (hourDiff <= 2 || hourDiff >= 22) {
      score += 0.2;
      reasons.push("Mesmo horário habitual");
    }

    // Same day-of-week bonus
    if (entry.dayOfWeek === currentDayOfWeek) {
      score += 0.1;
      reasons.push("Mesmo dia da semana");
    }

    // Small amount bonus (daily expenses more likely to be quick-registered)
    if (Math.abs(entry.amount) <= 100) {
      score += 0.1;
    }

    scored.push({
      description: entry.description,
      amount: entry.amount,
      category_name: entry.category_name,
      category_id: entry.category_id,
      confidence: round2(Math.min(score, 1)),
      reason: reasons.length > 0 ? reasons.join(", ") : "Frequente",
    });
  }

  // Sort by confidence descending, take top N
  return scored
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}

/**
 * Aggregate raw transactions into HistoricalEntry patterns.
 */
export function aggregateHistory(
  transactions: {
    description: string;
    amount: number;
    category_name: string | null;
    category_id: string | null;
    date: string; // ISO datetime or date
  }[]
): HistoricalEntry[] {
  const map = new Map<string, HistoricalEntry>();

  for (const t of transactions) {
    const key = `${t.description}|${t.amount.toFixed(2)}`;
    const date = new Date(t.date);
    const hour = date.getHours() || 12; // default noon if no time
    const dow = date.getDay();

    if (!map.has(key)) {
      map.set(key, {
        description: t.description,
        amount: t.amount,
        category_name: t.category_name,
        category_id: t.category_id,
        hour,
        dayOfWeek: dow,
        count: 0,
      });
    }
    map.get(key)!.count++;
  }

  return Array.from(map.values());
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
