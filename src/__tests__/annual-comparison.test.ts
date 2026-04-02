/**
 * Oniefy - Annual Comparison + Price Increase Detector Tests (E32)
 */

import {
  compareAnnualSpending,
  detectPriceIncreases,
  type AnnualExpense,
} from "@/lib/services/annual-comparison";

function tx(amount: number, date: string): AnnualExpense {
  return { amount, date };
}

const TRANSACTIONS: AnnualExpense[] = [
  // 2025: ~R$ 120k in expenses
  ...Array.from({ length: 12 }, (_, i) =>
    tx(-10000, `2025-${String(i + 1).padStart(2, "0")}-15`)
  ),
  // 2026: ~R$ 11k/month (10% increase), only 6 months elapsed
  ...Array.from({ length: 6 }, (_, i) =>
    tx(-11000, `2026-${String(i + 1).padStart(2, "0")}-15`)
  ),
];

describe("Annual Comparison", () => {
  test("compares two complete years correctly", () => {
    const fullData = [
      ...Array.from({ length: 12 }, (_, i) =>
        tx(-8000, `2024-${String(i + 1).padStart(2, "0")}-15`)
      ),
      ...Array.from({ length: 12 }, (_, i) =>
        tx(-9000, `2025-${String(i + 1).padStart(2, "0")}-15`)
      ),
    ];
    const result = compareAnnualSpending(fullData, 2024, 2025, 5.2);
    expect(result.totalA).toBeCloseTo(96000, -2);
    expect(result.totalB).toBeCloseTo(108000, -2);
    expect(result.changePct).toBeCloseTo(12.5, 0);
    expect(result.aboveInflation).toBe(true);
    expect(result.summary).toContain("2024");
    expect(result.summary).toContain("2025");
  });

  test("projects incomplete year based on current month", () => {
    // 2026 has 6 months of data at R$ 11k/month = R$ 66k actual
    // But current month is April (4), so projection = 66k / 4 * 12 = 198k
    const result = compareAnnualSpending(TRANSACTIONS, 2025, 2026, 5.2);
    expect(result.totalA).toBeCloseTo(120000, -2);
    expect(result.totalB).toBeCloseTo(66000, -2);
    // Projection uses current month (April=4), not data months
    const currentMonth = new Date().getMonth() + 1;
    const expectedProjection = (66000 / currentMonth) * 12;
    expect(result.projectedB).toBeCloseTo(expectedProjection, -2);
  });

  test("detects when change is within inflation", () => {
    const data = [
      ...Array.from({ length: 12 }, (_, i) =>
        tx(-10000, `2024-${String(i + 1).padStart(2, "0")}-15`)
      ),
      ...Array.from({ length: 12 }, (_, i) =>
        tx(-10400, `2025-${String(i + 1).padStart(2, "0")}-15`)
      ),
    ];
    const result = compareAnnualSpending(data, 2024, 2025, 5.2);
    // 4% increase, below 5.2% inflation
    expect(result.changePct).toBeCloseTo(4, 0);
    expect(result.aboveInflation).toBe(false);
    expect(result.summary).toContain("dentro da inflação");
  });

  test("handles zero spending in yearA", () => {
    const result = compareAnnualSpending([], 2024, 2025, 5.2);
    expect(result.totalA).toBe(0);
    expect(result.changePct).toBe(0);
  });
});

describe("Price Increase Detector", () => {
  test("detects excessive increase (3x inflation)", () => {
    const alerts = detectPriceIncreases(
      [{ description: "Condomínio", previousAmount: 850, currentAmount: 980 }],
      5.2
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("excessive");
    expect(alerts[0].changePct).toBeCloseTo(15.3, 0);
    expect(alerts[0].inflationMultiple).toBeGreaterThan(2);
    expect(alerts[0].message).toContain("Condomínio");
    expect(alerts[0].message).toContain("inflação");
  });

  test("detects above-inflation increase", () => {
    const alerts = detectPriceIncreases(
      [{ description: "Internet", previousAmount: 100, currentAmount: 108 }],
      5.2
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("above_inflation");
    expect(alerts[0].changePct).toBeCloseTo(8, 0);
  });

  test("ignores increases within inflation", () => {
    const alerts = detectPriceIncreases(
      [{ description: "Streaming", previousAmount: 39.90, currentAmount: 41.50 }],
      5.2
    );
    // 4% increase, below 5.2% inflation
    expect(alerts).toHaveLength(0);
  });

  test("ignores price decreases", () => {
    const alerts = detectPriceIncreases(
      [{ description: "Telefone", previousAmount: 120, currentAmount: 99 }],
      5.2
    );
    expect(alerts).toHaveLength(0);
  });

  test("sorts by inflation multiple descending", () => {
    const alerts = detectPriceIncreases(
      [
        { description: "Internet", previousAmount: 100, currentAmount: 108 },
        { description: "Condomínio", previousAmount: 850, currentAmount: 980 },
        { description: "Energia", previousAmount: 200, currentAmount: 260 },
      ],
      5.2
    );
    expect(alerts.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < alerts.length; i++) {
      expect(alerts[i].inflationMultiple).toBeLessThanOrEqual(alerts[i - 1].inflationMultiple);
    }
  });

  test("handles zero previous amount", () => {
    const alerts = detectPriceIncreases(
      [{ description: "Novo", previousAmount: 0, currentAmount: 100 }],
      5.2
    );
    expect(alerts).toHaveLength(0);
  });
});
