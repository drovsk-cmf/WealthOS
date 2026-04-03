/**
 * Oniefy - Annual Report Tests (E34)
 */

import {
  buildAnnualReport,
  type AnnualTransaction,
} from "@/lib/services/annual-report";

function tx(
  amount: number,
  date: string,
  type: "income" | "expense",
  category: string | null = null,
  desc: string | null = null
): AnnualTransaction {
  return { amount, date, type, category_name: category, description: desc, account_name: null };
}

const YEAR_DATA: AnnualTransaction[] = [
  // Income
  ...Array.from({ length: 12 }, (_, i) =>
    tx(10000, `2025-${String(i + 1).padStart(2, "0")}-05`, "income", "Salário", "Empresa X")
  ),
  tx(5000, "2025-06-15", "income", "Freelance", "Projeto Y"),
  // Expenses
  ...Array.from({ length: 12 }, (_, i) =>
    tx(-3000, `2025-${String(i + 1).padStart(2, "0")}-10`, "expense", "Moradia", "Aluguel")
  ),
  ...Array.from({ length: 12 }, (_, i) =>
    tx(-2000, `2025-${String(i + 1).padStart(2, "0")}-15`, "expense", "Alimentação", "iFood")
  ),
  tx(-800, "2025-03-20", "expense", "Saúde", "Dentista"),
  tx(-15000, "2025-11-25", "expense", "Viagem", "Passagem aérea"),
];

describe("Annual Report", () => {
  const report = buildAnnualReport(YEAR_DATA, 2025);

  test("calculates totals correctly", () => {
    expect(report.totalIncome).toBeCloseTo(125000, -2); // 10k*12 + 5k
    expect(report.totalExpenses).toBeGreaterThan(70000);
    expect(report.netSavings).toBe(report.totalIncome - report.totalExpenses);
  });

  test("savings rate as percentage", () => {
    expect(report.savingsRate).toBeGreaterThan(0);
    expect(report.savingsRate).toBeLessThan(100);
  });

  test("monthly breakdown has 12 entries", () => {
    expect(report.monthly).toHaveLength(12);
    expect(report.monthly[0].month).toBe("2025-01");
    expect(report.monthly[11].month).toBe("2025-12");
  });

  test("monthly income/expenses are non-negative", () => {
    for (const m of report.monthly) {
      expect(m.income).toBeGreaterThanOrEqual(0);
      expect(m.expenses).toBeGreaterThanOrEqual(0);
    }
  });

  test("top expense categories sorted by total", () => {
    expect(report.topExpenseCategories.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < report.topExpenseCategories.length; i++) {
      expect(report.topExpenseCategories[i].total).toBeLessThanOrEqual(
        report.topExpenseCategories[i - 1].total
      );
    }
  });

  test("top merchants sorted by total", () => {
    expect(report.topMerchants.length).toBeGreaterThanOrEqual(2);
    expect(report.topMerchants[0].total).toBeGreaterThanOrEqual(report.topMerchants[1].total);
  });

  test("biggest expense identified", () => {
    expect(report.biggestExpense).not.toBeNull();
    expect(report.biggestExpense!.amount).toBe(15000);
    expect(report.biggestExpense!.description).toContain("Passagem");
  });

  test("generates wrapped insights", () => {
    expect(report.insights.length).toBeGreaterThanOrEqual(3);
    const types = report.insights.map((i) => i.type);
    expect(types).toContain("top_merchant");
    expect(types).toContain("savings_rate");
    expect(types).toContain("biggest_month");
  });

  test("empty transactions returns zeroed report", () => {
    const empty = buildAnnualReport([], 2025);
    expect(empty.totalIncome).toBe(0);
    expect(empty.totalExpenses).toBe(0);
    expect(empty.monthly).toHaveLength(12);
    expect(empty.biggestExpense).toBeNull();
  });

  test("filters only target year", () => {
    const mixed = [
      tx(10000, "2024-12-05", "income", "Salário"),
      tx(10000, "2025-01-05", "income", "Salário"),
      tx(10000, "2026-01-05", "income", "Salário"),
    ];
    const r = buildAnnualReport(mixed, 2025);
    expect(r.totalIncome).toBeCloseTo(10000, 0);
  });
});
