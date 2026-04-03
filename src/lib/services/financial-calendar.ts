/**
 * Oniefy - Financial Calendar Data (E28)
 *
 * Aggregates upcoming financial events into a day-by-day calendar:
 * - Recurring bills (from recurrences)
 * - Credit card due dates
 * - One-off upcoming expenses
 * - Daily projected balance
 *
 * Ref: docs/FEATURES-ROADMAP-SPEC.md §3 item #6
 */

export interface CalendarEvent {
  id: string;
  date: string; // ISO date
  type: "bill" | "income" | "card_due" | "tax" | "custom";
  description: string;
  amount: number; // negative for expenses
  isPaid: boolean;
  accountName?: string;
}

export interface CalendarDay {
  date: string;
  events: CalendarEvent[];
  totalExpected: number;
  projectedBalance: number;
  /** Concentration: how many bills due this day */
  concentration: number;
  isWeekend: boolean;
}

export interface FinancialCalendar {
  days: CalendarDay[];
  month: string; // YYYY-MM
  /** Days with highest concentration of bills */
  peakDays: CalendarDay[];
  /** Total expected income this month */
  totalIncome: number;
  /** Total expected expenses this month */
  totalExpenses: number;
  /** Projected end-of-month balance */
  projectedEndBalance: number;
}

/**
 * Build a financial calendar for a given month.
 *
 * @param events - All known financial events for the month
 * @param startBalance - Balance at start of month
 * @param month - Target month (YYYY-MM)
 */
export function buildFinancialCalendar(
  events: CalendarEvent[],
  startBalance: number,
  month: string
): FinancialCalendar {
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  // Initialize all days
  const days: CalendarDay[] = [];
  let runningBalance = startBalance;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${month}-${String(d).padStart(2, "0")}`;
    const dayDate = new Date(year, monthNum - 1, d);
    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;

    const dayEvents = events.filter((e) => e.date === dateStr);
    const totalExpected = dayEvents.reduce((s, e) => s + e.amount, 0);
    runningBalance = round2(runningBalance + totalExpected);

    days.push({
      date: dateStr,
      events: dayEvents,
      totalExpected: round2(totalExpected),
      projectedBalance: runningBalance,
      concentration: dayEvents.filter((e) => e.amount < 0).length,
      isWeekend,
    });
  }

  // Find peak concentration days
  const sorted = [...days].sort((a, b) => b.concentration - a.concentration);
  const peakDays = sorted.filter((d) => d.concentration >= 2).slice(0, 5);

  const totalIncome = round2(events.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0));
  const totalExpenses = round2(events.filter((e) => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0));

  return {
    days,
    month,
    peakDays,
    totalIncome,
    totalExpenses,
    projectedEndBalance: runningBalance,
  };
}

/**
 * Generate events from recurrences for a given month.
 */
export function recurrencesToEvents(
  recurrences: {
    id: string;
    description: string;
    amount: number;
    day_of_month: number;
    account_name?: string;
  }[],
  month: string
): CalendarEvent[] {
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  return recurrences.map((rec) => {
    const day = Math.min(rec.day_of_month, daysInMonth);
    return {
      id: `rec-${rec.id}`,
      date: `${month}-${String(day).padStart(2, "0")}`,
      type: rec.amount > 0 ? "income" as const : "bill" as const,
      description: rec.description,
      amount: rec.amount,
      isPaid: false,
      accountName: rec.account_name,
    };
  });
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
