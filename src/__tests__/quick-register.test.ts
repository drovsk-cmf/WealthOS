/**
 * Oniefy - Quick Register Suggestions Tests (E21)
 */

import {
  getSuggestions,
  aggregateHistory,
  type HistoricalEntry,
} from "@/lib/services/quick-register";

function entry(
  desc: string,
  amount: number,
  cat: string | null,
  hour: number,
  dow: number,
  count: number
): HistoricalEntry {
  return { description: desc, amount, category_name: cat, category_id: null, hour, dayOfWeek: dow, count };
}

describe("Quick Register Suggestions", () => {
  const HISTORY: HistoricalEntry[] = [
    entry("Padaria do Zé", -8.50, "Alimentação", 7, 1, 30),   // frequent morning
    entry("iFood", -35, "Delivery", 20, 5, 20),                // frequent evening/friday
    entry("Uber", -25, "Transporte", 8, 1, 15),                // frequent morning
    entry("Mercado Livre", -250, "Compras", 14, 3, 3),         // infrequent afternoon
    entry("Almoço restaurante", -45, "Alimentação", 12, 2, 25), // frequent lunch
  ];

  test("returns suggestions sorted by confidence", () => {
    const suggestions = getSuggestions(HISTORY, 12, 2); // Tuesday noon
    expect(suggestions.length).toBeGreaterThan(0);
    for (let i = 1; i < suggestions.length; i++) {
      expect(suggestions[i].confidence).toBeLessThanOrEqual(suggestions[i - 1].confidence);
    }
  });

  test("boosts lunch suggestions at noon", () => {
    const suggestions = getSuggestions(HISTORY, 12, 2); // Tuesday noon
    const lunch = suggestions.find((s) => s.description.includes("Almoço"));
    expect(lunch).toBeDefined();
    expect(lunch!.reason).toContain("almoço");
  });

  test("boosts breakfast suggestions in the morning", () => {
    const suggestions = getSuggestions(HISTORY, 7, 1); // Monday 7am
    const padaria = suggestions.find((s) => s.description.includes("Padaria"));
    expect(padaria).toBeDefined();
    expect(padaria!.confidence).toBeGreaterThan(0.3);
  });

  test("boosts delivery suggestions in the evening", () => {
    const suggestions = getSuggestions(HISTORY, 20, 5); // Friday 8pm
    const ifood = suggestions.find((s) => s.description.includes("iFood"));
    expect(ifood).toBeDefined();
  });

  test("respects limit parameter", () => {
    const suggestions = getSuggestions(HISTORY, 12, 2, 2);
    expect(suggestions).toHaveLength(2);
  });

  test("confidence is capped at 1.0", () => {
    const suggestions = getSuggestions(HISTORY, 12, 2);
    for (const s of suggestions) {
      expect(s.confidence).toBeLessThanOrEqual(1);
      expect(s.confidence).toBeGreaterThanOrEqual(0);
    }
  });

  test("empty history returns empty suggestions", () => {
    expect(getSuggestions([], 12, 2)).toHaveLength(0);
  });
});

describe("Aggregate History", () => {
  test("groups same description+amount", () => {
    const txs = [
      { description: "Padaria", amount: -8.50, category_name: "Alimentação", category_id: null, date: "2026-01-05T07:30:00" },
      { description: "Padaria", amount: -8.50, category_name: "Alimentação", category_id: null, date: "2026-01-06T07:45:00" },
      { description: "Padaria", amount: -8.50, category_name: "Alimentação", category_id: null, date: "2026-01-07T08:00:00" },
    ];
    const agg = aggregateHistory(txs);
    expect(agg).toHaveLength(1);
    expect(agg[0].count).toBe(3);
  });

  test("different amounts create separate entries", () => {
    const txs = [
      { description: "Uber", amount: -15, category_name: "Transporte", category_id: null, date: "2026-01-05" },
      { description: "Uber", amount: -25, category_name: "Transporte", category_id: null, date: "2026-01-06" },
    ];
    const agg = aggregateHistory(txs);
    expect(agg).toHaveLength(2);
  });
});
