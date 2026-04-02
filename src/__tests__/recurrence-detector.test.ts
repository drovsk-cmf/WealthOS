/**
 * Oniefy - Recurrence Detector Tests (E26)
 * Ref: docs/FEATURES-ROADMAP-SPEC.md §3.2
 */

import {
  detectRecurrences,
  type TransactionForDetection,
} from "@/lib/services/recurrence-detector";

function tx(
  id: string,
  desc: string,
  amount: number,
  date: string,
  accountId = "acc-1",
  categoryId: string | null = "cat-1"
): TransactionForDetection {
  return { id, description: desc, amount, date, account_id: accountId, category_id: categoryId };
}

describe("Recurrence Detector", () => {
  test("detects monthly subscription (fixed amount, 4 months)", () => {
    const txs = [
      tx("1", "Netflix", -49.90, "2026-01-15"),
      tx("2", "Netflix", -49.90, "2026-02-15"),
      tx("3", "Netflix", -49.90, "2026-03-15"),
      tx("4", "Netflix", -49.90, "2026-04-15"),
    ];
    const results = detectRecurrences(txs);
    expect(results).toHaveLength(1);
    expect(results[0].description).toContain("netflix");
    expect(results[0].frequency).toBe("monthly");
    expect(results[0].type).toBe("subscription");
    expect(results[0].averageAmount).toBeCloseTo(49.90, 1);
    expect(results[0].monthsDetected).toBe(4);
    expect(results[0].amountCV).toBeLessThan(0.01);
  });

  test("detects variable bill (utility, moderate variation)", () => {
    const txs = [
      tx("1", "CPFL Energia 03/2026", -250, "2026-01-10"),
      tx("2", "CPFL Energia 04/2026", -310, "2026-02-10"),
      tx("3", "CPFL Energia 05/2026", -280, "2026-03-10"),
      tx("4", "CPFL Energia 06/2026", -340, "2026-04-10"),
    ];
    const results = detectRecurrences(txs);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe("variable_bill");
    expect(results[0].amountCV).toBeGreaterThan(0.01);
    expect(results[0].amountCV).toBeLessThan(0.3);
  });

  test("ignores transactions with < 3 months", () => {
    const txs = [
      tx("1", "Gym", -150, "2026-01-05"),
      tx("2", "Gym", -150, "2026-02-05"),
    ];
    const results = detectRecurrences(txs);
    expect(results).toHaveLength(0);
  });

  test("ignores income transactions", () => {
    const txs = [
      tx("1", "Salary", 10000, "2026-01-05"),
      tx("2", "Salary", 10000, "2026-02-05"),
      tx("3", "Salary", 10000, "2026-03-05"),
      tx("4", "Salary", 10000, "2026-04-05"),
    ];
    const results = detectRecurrences(txs);
    expect(results).toHaveLength(0);
  });

  test("ignores highly variable amounts (CV > 30%)", () => {
    const txs = [
      tx("1", "Supermercado Extra", -200, "2026-01-10"),
      tx("2", "Supermercado Extra", -450, "2026-02-15"),
      tx("3", "Supermercado Extra", -100, "2026-03-08"),
      tx("4", "Supermercado Extra", -600, "2026-04-20"),
    ];
    const results = detectRecurrences(txs);
    expect(results).toHaveLength(0);
  });

  test("excludes already-tracked recurrences", () => {
    const txs = [
      tx("1", "Netflix", -49.90, "2026-01-15"),
      tx("2", "Netflix", -49.90, "2026-02-15"),
      tx("3", "Netflix", -49.90, "2026-03-15"),
    ];
    const results = detectRecurrences(txs, ["Netflix"]);
    expect(results).toHaveLength(0);
  });

  test("separates by account", () => {
    const txs = [
      tx("1", "Plano Saude", -800, "2026-01-10", "acc-1"),
      tx("2", "Plano Saude", -800, "2026-02-10", "acc-1"),
      tx("3", "Plano Saude", -800, "2026-03-10", "acc-1"),
      tx("4", "Plano Saude", -800, "2026-01-10", "acc-2"),
      tx("5", "Plano Saude", -800, "2026-02-10", "acc-2"),
      // Only 2 months on acc-2, so only acc-1 detected
    ];
    const results = detectRecurrences(txs);
    expect(results).toHaveLength(1);
    expect(results[0].accountId).toBe("acc-1");
  });

  test("normalizes descriptions with dates", () => {
    const txs = [
      tx("1", "Cond Residence 01/2026", -1200, "2026-01-10"),
      tx("2", "Cond Residence 02/2026", -1200, "2026-02-10"),
      tx("3", "Cond Residence 03/2026", -1200, "2026-03-10"),
    ];
    const results = detectRecurrences(txs);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe("subscription"); // fixed amount
  });

  test("estimates day of month correctly", () => {
    const txs = [
      tx("1", "Spotify", -21.90, "2026-01-07"),
      tx("2", "Spotify", -21.90, "2026-02-07"),
      tx("3", "Spotify", -21.90, "2026-03-08"), // slight variation
      tx("4", "Spotify", -21.90, "2026-04-07"),
    ];
    const results = detectRecurrences(txs);
    expect(results).toHaveLength(1);
    expect(results[0].estimatedDay).toBe(7); // rounded average
  });

  test("detects multiple recurrences in same dataset", () => {
    const txs = [
      // Netflix
      tx("1", "Netflix", -49.90, "2026-01-15"),
      tx("2", "Netflix", -49.90, "2026-02-15"),
      tx("3", "Netflix", -49.90, "2026-03-15"),
      // Spotify
      tx("4", "Spotify", -21.90, "2026-01-07"),
      tx("5", "Spotify", -21.90, "2026-02-07"),
      tx("6", "Spotify", -21.90, "2026-03-07"),
      // Electricity
      tx("7", "CPFL Energia", -280, "2026-01-10"),
      tx("8", "CPFL Energia", -295, "2026-02-10"),
      tx("9", "CPFL Energia", -310, "2026-03-10"),
    ];
    const results = detectRecurrences(txs);
    expect(results).toHaveLength(3);
  });

  test("confidence is higher for more months matched", () => {
    const txs = [
      // 6 months
      tx("1", "Seguro Auto", -350, "2025-11-15"),
      tx("2", "Seguro Auto", -350, "2025-12-15"),
      tx("3", "Seguro Auto", -350, "2026-01-15"),
      tx("4", "Seguro Auto", -350, "2026-02-15"),
      tx("5", "Seguro Auto", -350, "2026-03-15"),
      tx("6", "Seguro Auto", -350, "2026-04-15"),
      // 3 months
      tx("7", "Gym Pass", -99, "2026-02-05"),
      tx("8", "Gym Pass", -99, "2026-03-05"),
      tx("9", "Gym Pass", -99, "2026-04-05"),
    ];
    const results = detectRecurrences(txs);
    expect(results).toHaveLength(2);
    const seguro = results.find((r) => r.description.includes("seguro"));
    const gym = results.find((r) => r.description.includes("gym"));
    expect(seguro!.confidence).toBeGreaterThan(gym!.confidence);
  });

  test("returns empty for empty input", () => {
    expect(detectRecurrences([])).toHaveLength(0);
  });

  test("skips transactions with null/empty description", () => {
    const txs = [
      tx("1", "", -100, "2026-01-10"),
      tx("2", "", -100, "2026-02-10"),
      tx("3", "", -100, "2026-03-10"),
    ];
    const results = detectRecurrences(txs);
    expect(results).toHaveLength(0);
  });
});
