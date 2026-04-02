/**
 * Oniefy - DARF Investment Motor Tests (E44)
 */

import {
  calculateMonthlyDARFs,
  type InvestmentOperation,
} from "@/lib/services/darf-investment";

function op(
  id: string,
  date: string,
  type: InvestmentOperation["type"],
  sale: number,
  cost: number,
  fees = 0
): InvestmentOperation {
  return { id, date, type, saleAmount: sale, costBasis: cost, costs: fees };
}

describe("DARF Investment Motor", () => {
  test("stock gain above R$ 20k exemption: 15% DARF", () => {
    const result = calculateMonthlyDARFs([
      op("1", "2026-01-15", "stock", 25000, 20000, 50),
    ]);
    expect(result.months).toHaveLength(1);
    const m = result.months[0];
    expect(m.hasDARF).toBe(true);
    expect(m.byType[0].rate).toBe(15);
    expect(m.byType[0].grossGain).toBeCloseTo(4950, 0);
    expect(m.byType[0].tax).toBeCloseTo(742.5, 0);
    expect(m.byType[0].darfCode).toBe("6015");
  });

  test("stock sales below R$ 20k: exempt", () => {
    const result = calculateMonthlyDARFs([
      op("1", "2026-01-15", "stock", 18000, 15000, 30),
    ]);
    const m = result.months[0];
    expect(m.byType[0].isExempt).toBe(true);
    expect(m.totalTax).toBe(0);
    expect(m.hasDARF).toBe(false);
  });

  test("day trade: 20% no exemption", () => {
    const result = calculateMonthlyDARFs([
      op("1", "2026-01-15", "stock_daytrade", 5000, 4500, 10),
    ]);
    const m = result.months[0];
    expect(m.byType[0].isExempt).toBe(false);
    expect(m.byType[0].rate).toBe(20);
    expect(m.byType[0].tax).toBeCloseTo(98, 0); // (5000-4500-10)*20%
  });

  test("FII capital gain: 20%", () => {
    const result = calculateMonthlyDARFs([
      op("1", "2026-03-10", "fii", 50000, 40000, 100),
    ]);
    const m = result.months[0];
    expect(m.byType[0].rate).toBe(20);
    expect(m.byType[0].grossGain).toBeCloseTo(9900, 0);
    expect(m.byType[0].tax).toBeCloseTo(1980, 0);
  });

  test("loss carryforward offsets future gains (same type)", () => {
    const result = calculateMonthlyDARFs([
      // January: R$ 3k loss on stocks
      op("1", "2026-01-15", "stock", 25000, 28000, 50),
      // February: R$ 5k gain on stocks
      op("2", "2026-02-15", "stock", 30000, 25000, 50),
    ]);
    expect(result.months).toHaveLength(2);

    // January: loss, no DARF
    expect(result.months[0].hasDARF).toBe(false);

    // February: gain offset by January loss
    const feb = result.months[1].byType[0];
    expect(feb.grossGain).toBeCloseTo(4950, 0);
    expect(feb.lossOffset).toBeGreaterThan(0);
    expect(feb.netGain).toBeLessThan(feb.grossGain);
  });

  test("loss carryforward does NOT cross types", () => {
    const result = calculateMonthlyDARFs([
      // January: loss on stocks
      op("1", "2026-01-15", "stock", 25000, 28000, 0),
      // February: gain on FII (different type)
      op("2", "2026-02-15", "fii", 50000, 40000, 0),
    ]);
    // FII gain should NOT be offset by stock loss
    const feb = result.months[1].byType[0];
    expect(feb.lossOffset).toBe(0);
    expect(feb.netGain).toBe(feb.grossGain);
  });

  test("crypto below R$ 35k exemption: exempt", () => {
    const result = calculateMonthlyDARFs([
      op("1", "2026-01-15", "crypto", 30000, 25000, 0),
    ]);
    expect(result.months[0].byType[0].isExempt).toBe(true);
  });

  test("crypto above R$ 35k: taxed", () => {
    const result = calculateMonthlyDARFs([
      op("1", "2026-01-15", "crypto", 40000, 30000, 0),
    ]);
    const m = result.months[0];
    expect(m.byType[0].isExempt).toBe(false);
    expect(m.byType[0].tax).toBeGreaterThan(0);
    expect(m.byType[0].darfCode).toBe("4600");
  });

  test("multiple types in same month", () => {
    const result = calculateMonthlyDARFs([
      op("1", "2026-03-10", "stock", 25000, 22000, 50),
      op("2", "2026-03-15", "fii", 50000, 45000, 100),
    ]);
    expect(result.months).toHaveLength(1);
    expect(result.months[0].byType).toHaveLength(2);
    expect(result.months[0].totalTax).toBeGreaterThan(0);
  });

  test("due date is last biz day of following month", () => {
    const result = calculateMonthlyDARFs([
      op("1", "2026-01-15", "stock", 25000, 20000, 0),
    ]);
    // January operations → DARF due last biz day of February
    expect(result.months[0].dueDate).toMatch(/^2026-02/);
    const dueDate = new Date(result.months[0].dueDate + "T12:00:00");
    expect(dueDate.getDay()).not.toBe(0); // not Sunday
    expect(dueDate.getDay()).not.toBe(6); // not Saturday
  });

  test("totalTaxPaid aggregates across months", () => {
    const result = calculateMonthlyDARFs([
      op("1", "2026-01-15", "stock", 30000, 25000, 0),
      op("2", "2026-02-15", "stock", 30000, 25000, 0),
    ]);
    expect(result.totalTaxPaid).toBeCloseTo(
      result.months.reduce((s, m) => s + m.totalTax, 0),
      1
    );
  });

  test("empty operations returns empty result", () => {
    const result = calculateMonthlyDARFs([]);
    expect(result.months).toHaveLength(0);
    expect(result.totalTaxPaid).toBe(0);
  });

  test("initial loss carryforward is respected", () => {
    const result = calculateMonthlyDARFs(
      [op("1", "2026-01-15", "stock", 30000, 25000, 0)],
      { stock: 3000, stock_daytrade: 0, fii: 0, crypto: 0 }
    );
    // 5000 gain - 3000 carryforward = 2000 net
    const m = result.months[0].byType[0];
    expect(m.lossOffset).toBeCloseTo(3000, 0);
    expect(m.netGain).toBeCloseTo(2000, 0);
    expect(m.tax).toBeCloseTo(300, 0); // 2000 * 15%
  });
});
