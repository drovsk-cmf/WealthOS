/**
 * Oniefy - Debt Payoff Planner Tests (E37)
 */

import {
  calculatePayoffPlan,
  comparePayoffStrategies,
  type Debt,
} from "@/lib/services/debt-payoff-planner";

const DEBTS: Debt[] = [
  { id: "cc", name: "Cartão de Crédito", balance: 5000, interestRate: 12, minimumPayment: 250 },
  { id: "car", name: "Financiamento Carro", balance: 25000, interestRate: 1.5, minimumPayment: 800 },
  { id: "personal", name: "Empréstimo Pessoal", balance: 8000, interestRate: 3.5, minimumPayment: 400 },
];

describe("Debt Payoff Planner — Snowball", () => {
  test("targets smallest balance first", () => {
    const plan = calculatePayoffPlan(DEBTS, 2000, "snowball");
    // Snowball order: CC (5k) → Personal (8k) → Car (25k)
    expect(plan.payoffOrder[0]).toBe("cc");
    expect(plan.payoffOrder[1]).toBe("personal");
    expect(plan.payoffOrder[2]).toBe("car");
  });

  test("all debts reach zero", () => {
    const plan = calculatePayoffPlan(DEBTS, 2000, "snowball");
    const lastSnapshot = plan.timeline[plan.timeline.length - 1];
    expect(lastSnapshot.totalBalance).toBeLessThan(1);
  });

  test("total paid > original debt (due to interest)", () => {
    const plan = calculatePayoffPlan(DEBTS, 2000, "snowball");
    expect(plan.totalPaid).toBeGreaterThan(plan.originalDebt);
    expect(plan.totalInterestPaid).toBeGreaterThan(0);
  });

  test("records when each debt is paid off", () => {
    const plan = calculatePayoffPlan(DEBTS, 2000, "snowball");
    const paidOffMonths = plan.timeline
      .filter((s) => s.debtPaidOff !== null)
      .map((s) => ({ month: s.month, debt: s.debtPaidOff }));
    expect(paidOffMonths.length).toBeGreaterThanOrEqual(2);
    // CC should be paid off first (smallest balance)
    expect(paidOffMonths[0].debt).toBe("cc");
  });
});

describe("Debt Payoff Planner — Avalanche", () => {
  test("targets highest interest rate first", () => {
    const plan = calculatePayoffPlan(DEBTS, 2000, "avalanche");
    // Avalanche order: CC (12%) → Personal (3.5%) → Car (1.5%)
    expect(plan.payoffOrder[0]).toBe("cc");
    expect(plan.payoffOrder[1]).toBe("personal");
    expect(plan.payoffOrder[2]).toBe("car");
  });

  test("pays less total interest than snowball", () => {
    const snowball = calculatePayoffPlan(DEBTS, 2000, "snowball");
    const avalanche = calculatePayoffPlan(DEBTS, 2000, "avalanche");
    expect(avalanche.totalInterestPaid).toBeLessThanOrEqual(snowball.totalInterestPaid);
  });
});

describe("Debt Payoff Planner — Comparison", () => {
  test("returns both plans with savings calculation", () => {
    const comp = comparePayoffStrategies(DEBTS, 2000);
    expect(comp.snowball.strategy).toBe("snowball");
    expect(comp.avalanche.strategy).toBe("avalanche");
    expect(comp.interestSavings).toBeGreaterThanOrEqual(0);
    expect(comp.recommendation).toBeDefined();
    expect(comp.recommendationReason.length).toBeGreaterThan(0);
  });

  test("recommends avalanche when savings are significant", () => {
    // High-interest debt scenario
    const highInterestDebts: Debt[] = [
      { id: "a", name: "Rotativo", balance: 10000, interestRate: 14, minimumPayment: 500 },
      { id: "b", name: "Cheque Especial", balance: 3000, interestRate: 8, minimumPayment: 150 },
      { id: "c", name: "Consignado", balance: 20000, interestRate: 1.5, minimumPayment: 600 },
    ];
    const comp = comparePayoffStrategies(highInterestDebts, 1500);
    expect(comp.interestSavings).toBeGreaterThan(0);
  });

  test("handles single debt (both strategies identical)", () => {
    const single: Debt[] = [
      { id: "only", name: "Único", balance: 5000, interestRate: 2, minimumPayment: 300 },
    ];
    const comp = comparePayoffStrategies(single, 500);
    expect(comp.snowball.totalMonths).toBe(comp.avalanche.totalMonths);
    expect(comp.snowball.totalInterestPaid).toBeCloseTo(comp.avalanche.totalInterestPaid, 0);
    expect(comp.interestSavings).toBeCloseTo(0, 0);
  });

  test("handles empty debts", () => {
    const comp = comparePayoffStrategies([], 1000);
    expect(comp.snowball.totalMonths).toBe(0);
    expect(comp.avalanche.totalMonths).toBe(0);
  });

  test("budget below minimums: uses sum of minimums", () => {
    const plan = calculatePayoffPlan(DEBTS, 100, "snowball"); // way below minimums
    // Should use total minimums (250 + 800 + 400 = 1450) instead
    expect(plan.monthlyBudget).toBeGreaterThanOrEqual(1450);
  });

  test("payoff date is in the future", () => {
    const plan = calculatePayoffPlan(DEBTS, 2000, "avalanche");
    const payoffDate = new Date(plan.payoffDate);
    expect(payoffDate.getTime()).toBeGreaterThan(Date.now());
  });

  test("monthly payments don't exceed budget", () => {
    const plan = calculatePayoffPlan(DEBTS, 2000, "avalanche");
    for (const snapshot of plan.timeline) {
      // Allow small floating point tolerance
      expect(snapshot.totalPayment).toBeLessThanOrEqual(2000.01);
    }
  });
});
