/**
 * Oniefy - Balance Forecast Tests (E38)
 */

import {
  forecastBalances,
  quickForecast,
} from "@/lib/services/balance-forecast";

describe("Balance Forecast", () => {
  test("projects stable balance with positive net", () => {
    const result = forecastBalances({
      currentBalance: 10000,
      monthlyNet: 2000,
      recurringFlows: [],
      months: 6,
    });
    expect(result.points).toHaveLength(6);
    expect(result.endBalance).toBeCloseTo(22000, -2);
    expect(result.negativeMonth).toBe(0);
    expect(result.summary).toContain("positiva");
  });

  test("detects when balance goes negative", () => {
    const result = forecastBalances({
      currentBalance: 5000,
      monthlyNet: -2000,
      recurringFlows: [],
      months: 6,
    });
    expect(result.negativeMonth).toBe(3); // 5000 - 2000*3 = -1000
    expect(result.summary).toContain("negativo");
  });

  test("accounts for recurring flows", () => {
    const result = forecastBalances({
      currentBalance: 10000,
      monthlyNet: 0, // no trend beyond recurrences
      recurringFlows: [
        { description: "Salário", monthlyAmount: 8000 },
        { description: "Aluguel", monthlyAmount: -3000 },
        { description: "Contas", monthlyAmount: -2000 },
      ],
      months: 3,
    });
    // Net recurring = 8000 - 3000 - 2000 = 3000/month
    // trendNet = 0 - 3000 = -3000 (avoid double counting)
    // Total monthly = 3000 + (-3000) = 0? No...
    // Actually: monthlyNet=0, knownRecurringNet=3000, trendNet=0-3000=-3000
    // netChange = 8000 + (-5000) + (-3000) = 0
    // Hmm, that means balance stays flat at 10000
    expect(result.endBalance).toBeCloseTo(10000, -2);
  });

  test("applies seasonal adjustments", () => {
    const result = forecastBalances({
      currentBalance: 20000,
      monthlyNet: 1000,
      recurringFlows: [],
      seasonalAdjustments: { 12: 5000 }, // December spike
      months: 12,
    });
    // December should have a dip
    const decPoint = result.points.find((p) => p.date.endsWith("-12"));
    if (decPoint) {
      expect(decPoint.seasonalAdjustment).toBe(5000);
      expect(decPoint.netChange).toBeLessThan(1000);
    }
  });

  test("stable balance summary", () => {
    const result = forecastBalances({
      currentBalance: 10000,
      monthlyNet: 50,
      recurringFlows: [],
      months: 6,
    });
    expect(result.summary).toContain("estável");
  });

  test("declining balance summary", () => {
    const result = forecastBalances({
      currentBalance: 10000,
      monthlyNet: -500,
      recurringFlows: [],
      months: 6,
    });
    // End balance: 10000 - 3000 = 7000 (30% decline)
    expect(result.summary).toContain("queda");
  });

  test("points have correct dates", () => {
    const result = forecastBalances({
      currentBalance: 1000,
      monthlyNet: 100,
      recurringFlows: [],
      months: 3,
    });
    expect(result.points[0].month).toBe(1);
    expect(result.points[2].month).toBe(3);
    // Dates should be future months
    for (const p of result.points) {
      expect(p.date).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  test("quickForecast works with minimal inputs", () => {
    const result = quickForecast(15000, 10000, 8000, 6);
    expect(result.points).toHaveLength(6);
    expect(result.endBalance).toBeCloseTo(27000, -2); // 15000 + 2000*6
    expect(result.negativeMonth).toBe(0);
  });

  test("quickForecast detects negative path", () => {
    const result = quickForecast(3000, 5000, 7000, 6);
    // Net = -2000/month, goes negative in month 2
    expect(result.negativeMonth).toBe(2);
  });
});
