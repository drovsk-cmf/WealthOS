/**
 * Oniefy - Financial Calendar Tests (E28)
 */

import {
  buildFinancialCalendar,
  recurrencesToEvents,
  type CalendarEvent,
} from "@/lib/services/financial-calendar";

function ev(
  id: string,
  date: string,
  amount: number,
  desc: string,
  type: CalendarEvent["type"] = "bill"
): CalendarEvent {
  return { id, date, amount, description: desc, type, isPaid: false };
}

describe("Financial Calendar", () => {
  test("builds all days for a month", () => {
    const cal = buildFinancialCalendar([], 10000, "2026-04");
    expect(cal.days).toHaveLength(30); // April has 30 days
    expect(cal.month).toBe("2026-04");
  });

  test("projects balance day by day", () => {
    const events = [
      ev("1", "2026-04-05", -3000, "Aluguel"),
      ev("2", "2026-04-10", 10000, "Salário", "income"),
      ev("3", "2026-04-15", -500, "Energia"),
    ];
    const cal = buildFinancialCalendar(events, 5000, "2026-04");

    // Day 5: 5000 - 3000 = 2000
    expect(cal.days[4].projectedBalance).toBeCloseTo(2000, 0);
    // Day 10: 2000 + 10000 = 12000
    expect(cal.days[9].projectedBalance).toBeCloseTo(12000, 0);
    // Day 15: 12000 - 500 = 11500
    expect(cal.days[14].projectedBalance).toBeCloseTo(11500, 0);
    // End of month: stays at 11500
    expect(cal.projectedEndBalance).toBeCloseTo(11500, 0);
  });

  test("calculates income and expense totals", () => {
    const events = [
      ev("1", "2026-04-05", -3000, "Aluguel"),
      ev("2", "2026-04-10", 10000, "Salário", "income"),
      ev("3", "2026-04-15", -500, "Energia"),
    ];
    const cal = buildFinancialCalendar(events, 5000, "2026-04");
    expect(cal.totalIncome).toBeCloseTo(10000, 0);
    expect(cal.totalExpenses).toBeCloseTo(3500, 0);
  });

  test("identifies peak concentration days", () => {
    const events = [
      ev("1", "2026-04-10", -3000, "Aluguel"),
      ev("2", "2026-04-10", -500, "Internet"),
      ev("3", "2026-04-10", -200, "Streaming"),
      ev("4", "2026-04-20", -100, "Uber"),
    ];
    const cal = buildFinancialCalendar(events, 10000, "2026-04");
    expect(cal.peakDays.length).toBeGreaterThanOrEqual(1);
    expect(cal.peakDays[0].date).toBe("2026-04-10");
    expect(cal.peakDays[0].concentration).toBe(3);
  });

  test("marks weekends correctly", () => {
    const cal = buildFinancialCalendar([], 0, "2026-04");
    // April 4, 2026 is Saturday
    expect(cal.days[3].isWeekend).toBe(true);
    // April 5, 2026 is Sunday
    expect(cal.days[4].isWeekend).toBe(true);
    // April 6, 2026 is Monday
    expect(cal.days[5].isWeekend).toBe(false);
  });

  test("empty events: balance stays constant", () => {
    const cal = buildFinancialCalendar([], 5000, "2026-04");
    expect(cal.projectedEndBalance).toBe(5000);
    expect(cal.days.every((d) => d.projectedBalance === 5000)).toBe(true);
  });

  test("handles February correctly (28/29 days)", () => {
    const cal = buildFinancialCalendar([], 0, "2026-02");
    expect(cal.days).toHaveLength(28); // 2026 is not a leap year
  });
});

describe("Recurrences to Events", () => {
  test("generates events from recurrences", () => {
    const recs = [
      { id: "r1", description: "Aluguel", amount: -3000, day_of_month: 5 },
      { id: "r2", description: "Salário", amount: 10000, day_of_month: 1 },
    ];
    const events = recurrencesToEvents(recs, "2026-04");
    expect(events).toHaveLength(2);
    expect(events[0].date).toBe("2026-04-05");
    expect(events[0].type).toBe("bill");
    expect(events[1].date).toBe("2026-04-01");
    expect(events[1].type).toBe("income");
  });

  test("clamps day to month length (e.g., day 31 in April)", () => {
    const recs = [
      { id: "r1", description: "Teste", amount: -100, day_of_month: 31 },
    ];
    const events = recurrencesToEvents(recs, "2026-04"); // April has 30 days
    expect(events[0].date).toBe("2026-04-30");
  });

  test("empty recurrences returns empty events", () => {
    expect(recurrencesToEvents([], "2026-04")).toHaveLength(0);
  });
});
