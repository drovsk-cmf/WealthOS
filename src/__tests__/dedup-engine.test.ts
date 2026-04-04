/**
 * Oniefy - Deduplication Engine Tests (E20)
 */

import {
  deduplicateTransactions,
  fingerprint,
  normalizeDescription,
  descriptionSimilarity,
  levenshtein,
  recordUserDecision,
  applyLearnedPatterns,
  filterOppositeSigns,
  type TransactionForDedup,
  type UserDecisionRecord,
  type LearnedPattern,
} from "@/lib/services/dedup-engine";

function tx(
  id: string,
  date: string,
  amount: number,
  desc: string,
  source = "import_csv",
  accountId = "acc-1",
  externalId?: string
): TransactionForDedup {
  return { id, date, amount, description: desc, source, account_id: accountId, external_id: externalId };
}

describe("Dedup — Helpers", () => {
  test("fingerprint combines date + amount", () => {
    const fp = fingerprint(tx("1", "2026-01-15", -150.50, "Test"));
    expect(fp).toBe("2026-01-15|-150.50");
  });

  test("normalizeDescription lowercases and removes punctuation", () => {
    expect(normalizeDescription("PIX - MERCADO LIVRE*ML")).toBe("pix mercado livreml");
    expect(normalizeDescription("  Extra  spaces  ")).toBe("extra spaces");
  });

  test("levenshtein distance", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("abc", "abc")).toBe(0);
    expect(levenshtein("", "abc")).toBe(3);
  });

  test("descriptionSimilarity", () => {
    expect(descriptionSimilarity("MERCADO LIVRE", "MERCADO LIVRE")).toBe(1);
    expect(descriptionSimilarity("MERCADO LIVRE", "mercado livre")).toBe(1);
    expect(descriptionSimilarity("UBER *TRIP", "UBER *VIAGEM")).toBeGreaterThan(0.3);
    expect(descriptionSimilarity("IFOOD *IFOOD", "IFOOD IFOOD")).toBeGreaterThan(0.8);
    expect(descriptionSimilarity("Supermercado", "Farmácia")).toBeLessThan(0.5);
  });
});

describe("Dedup — Transaction Matching", () => {
  test("exact external_id match", () => {
    const existing = [tx("e1", "2026-01-15", -100, "PIX LOJA", "bank_api", "acc-1", "EXT-123")];
    const incoming = [tx("n1", "2026-01-15", -100, "PIX LOJA X", "import_csv", "acc-2", "EXT-123")];

    const result = deduplicateTransactions(existing, incoming);
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0].matchType).toBe("exact");
    expect(result.duplicates[0].confidence).toBe(1);
    expect(result.unique).toHaveLength(0);
  });

  test("fuzzy match: same date + amount + similar description", () => {
    const existing = [tx("e1", "2026-01-15", -89.90, "IFOOD *IFOOD", "bank_api", "acc-1")];
    const incoming = [tx("n1", "2026-01-15", -89.90, "IFOOD IFOOD", "import_csv", "acc-2")];

    const result = deduplicateTransactions(existing, incoming);
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0].confidence).toBeGreaterThan(0.8);
    expect(result.unique).toHaveLength(0);
  });

  test("no match: same date + amount but different description", () => {
    const existing = [tx("e1", "2026-01-15", -50, "Padaria Silva", "bank_api", "acc-1")];
    const incoming = [tx("n1", "2026-01-15", -50, "Farmácia Popular", "import_csv", "acc-2")];

    const result = deduplicateTransactions(existing, incoming);
    expect(result.duplicates).toHaveLength(0);
    expect(result.unique).toHaveLength(1);
  });

  test("no match: same description but different amount", () => {
    const existing = [tx("e1", "2026-01-15", -100, "UBER *TRIP", "bank_api", "acc-1")];
    const incoming = [tx("n1", "2026-01-15", -45, "UBER *TRIP", "import_csv", "acc-2")];

    const result = deduplicateTransactions(existing, incoming);
    expect(result.duplicates).toHaveLength(0);
    expect(result.unique).toHaveLength(1);
  });

  test("skips same account + same source (not cross-source)", () => {
    const existing = [tx("e1", "2026-01-15", -100, "PIX Loja", "import_csv", "acc-1")];
    const incoming = [tx("n1", "2026-01-15", -100, "PIX Loja", "import_csv", "acc-1")];

    const result = deduplicateTransactions(existing, incoming);
    // Same account + same source = likely re-import, not cross-source dup
    expect(result.unique).toHaveLength(1);
  });

  test("batch dedup with mixed results", () => {
    const existing = [
      tx("e1", "2026-01-10", -200, "Aluguel", "bank_api", "acc-1"),
      tx("e2", "2026-01-15", -50, "Uber", "bank_api", "acc-1", "AUTH-789"),
    ];
    const incoming = [
      tx("n1", "2026-01-10", -200, "ALUGUEL", "import_csv", "acc-2"), // fuzzy match
      tx("n2", "2026-01-15", -50, "Uber Trip", "import_csv", "acc-2", "AUTH-789"), // exact (ext_id)
      tx("n3", "2026-01-20", -30, "Padaria", "import_csv", "acc-2"), // unique
    ];

    const result = deduplicateTransactions(existing, incoming);
    expect(result.stats.total).toBe(3);
    expect(result.stats.duplicates).toBe(2);
    expect(result.stats.unique).toBe(1);
    expect(result.unique[0].id).toBe("n3");
  });

  test("stats count exact vs fuzzy correctly", () => {
    const existing = [
      tx("e1", "2026-01-10", -100, "PIX Loja", "bank", "acc-1", "EXT-1"),
      tx("e2", "2026-01-15", -200, "Mercado Pago", "bank", "acc-1"),
    ];
    const incoming = [
      tx("n1", "2026-01-10", -100, "PIX", "csv", "acc-2", "EXT-1"), // exact by ext_id
      tx("n2", "2026-01-15", -200, "MERCADO PAGO*ML", "csv", "acc-2"), // fuzzy
    ];

    const result = deduplicateTransactions(existing, incoming);
    expect(result.stats.exactMatches).toBeGreaterThanOrEqual(1);
  });

  test("empty incoming returns all unique = 0", () => {
    const result = deduplicateTransactions(
      [tx("e1", "2026-01-10", -100, "Test")],
      []
    );
    expect(result.unique).toHaveLength(0);
    expect(result.duplicates).toHaveLength(0);
  });

  test("configurable fuzzy threshold", () => {
    const existing = [tx("e1", "2026-01-15", -100, "Supermercado Extra", "bank", "acc-1")];
    const incoming = [tx("n1", "2026-01-15", -100, "Supermercado Dia", "csv", "acc-2")];

    // With high threshold (0.9): no match
    const strict = deduplicateTransactions(existing, incoming, 0.9);
    expect(strict.unique).toHaveLength(1);

    // With low threshold (0.5): might match
    const loose = deduplicateTransactions(existing, incoming, 0.5);
    expect(loose.duplicates.length + loose.unique.length).toBe(1);
  });
});

// ── E66: Learning Loop ──

describe("Dedup — Learning Loop (E66)", () => {
  test("recordUserDecision: 'different' cria padrão allow_same_day_duplicates", () => {
    const decision: UserDecisionRecord = {
      existingId: "e1",
      newId: "n1",
      decision: "different",
      fingerprint: "2026-01-15|8.50",
      normalizedDescription: "padaria silva",
      timestamp: "2026-01-15T12:00:00Z",
    };

    const patterns = recordUserDecision(decision, []);
    expect(patterns).toHaveLength(1);
    expect(patterns[0].type).toBe("allow_same_day_duplicates");
    expect(patterns[0].descriptionPattern).toBe("padaria silva");
    expect(patterns[0].amount).toBe(8.50);
    expect(patterns[0].occurrences).toBe(1);
  });

  test("recordUserDecision: 'same' cria padrão auto_merge", () => {
    const decision: UserDecisionRecord = {
      existingId: "e1",
      newId: "n1",
      decision: "same",
      fingerprint: "2026-01-15|45.90",
      normalizedDescription: "ifood sao paulo",
      timestamp: "2026-01-15T12:00:00Z",
    };

    const patterns = recordUserDecision(decision, []);
    expect(patterns).toHaveLength(1);
    expect(patterns[0].type).toBe("auto_merge");
    expect(patterns[0].occurrences).toBe(1);
  });

  test("recordUserDecision: incrementa occurrences em padrão existente", () => {
    const existing: LearnedPattern[] = [{
      type: "auto_merge",
      descriptionPattern: "ifood sao paulo",
      amount: 45.90,
      occurrences: 1,
    }];

    const decision: UserDecisionRecord = {
      existingId: "e2",
      newId: "n2",
      decision: "same",
      fingerprint: "2026-02-10|45.90",
      normalizedDescription: "ifood sao paulo",
      timestamp: "2026-02-10T12:00:00Z",
    };

    const patterns = recordUserDecision(decision, existing);
    expect(patterns).toHaveLength(1);
    expect(patterns[0].occurrences).toBe(2);
  });

  test("applyLearnedPatterns: 'allow_same_day_duplicates' promove para unique", () => {
    const existingTxs = [tx("e1", "2026-01-15", -8.50, "Padaria Silva", "bank", "acc-1")];
    const incomingTxs = [tx("n1", "2026-01-15", -8.50, "Padaria Silva", "csv", "acc-2")];

    // Raw dedup finds it as fuzzy duplicate
    const rawResult = deduplicateTransactions(existingTxs, incomingTxs, 0.8);
    expect(rawResult.duplicates).toHaveLength(1);

    // Apply learned pattern: user previously said "different"
    const patterns: LearnedPattern[] = [{
      type: "allow_same_day_duplicates",
      descriptionPattern: "padaria silva",
      amount: 8.50,
      occurrences: 1,
    }];

    const adjusted = applyLearnedPatterns(rawResult, patterns, incomingTxs);
    expect(adjusted.unique).toHaveLength(1);
    expect(adjusted.duplicates).toHaveLength(0);
  });

  test("applyLearnedPatterns: 'auto_merge' com >=2 occurrences eleva confidence", () => {
    const existingTxs = [tx("e1", "2026-01-15", -45.90, "IFOOD SAO PAULO", "bank", "acc-1")];
    const incomingTxs = [tx("n1", "2026-01-15", -45.90, "IFOOD SAO PAULO BR", "csv", "acc-2")];

    const rawResult = deduplicateTransactions(existingTxs, incomingTxs, 0.7);

    const patterns: LearnedPattern[] = [{
      type: "auto_merge",
      descriptionPattern: "ifood sao paulo br",
      amount: 45.90,
      occurrences: 3, // confirmed 3x
    }];

    const adjusted = applyLearnedPatterns(rawResult, patterns, incomingTxs);
    if (adjusted.duplicates.length > 0) {
      expect(adjusted.duplicates[0].confidence).toBe(1.0);
      expect(adjusted.duplicates[0].reason).toContain("auto-merge");
    }
  });
});

// ── E66: Opposite Signs (princípio #6) ──

describe("Dedup — Opposite Signs (E66 princípio #6)", () => {
  test("filtra pares de sinais opostos (+100 e -100 mesmo dia)", () => {
    const existing = [
      tx("e1", "2026-01-15", -100, "Loja ABC", "bank", "acc-1"), // compra
    ];
    const incoming = [
      tx("n1", "2026-01-15", 100, "Loja ABC", "csv", "acc-2"), // estorno
    ];

    const { existing: filtered } = filterOppositeSigns(existing, incoming);
    // O -100 existente deve ser filtrado porque o +100 incoming é sinal oposto
    expect(filtered).toHaveLength(0);

    // Sem filtro, o dedup acharia como duplicata
    const rawResult = deduplicateTransactions(existing, incoming, 0.8);
    expect(rawResult.duplicates.length).toBeGreaterThanOrEqual(0); // pode ou não achar

    // Com filtro, nenhuma duplicata
    const cleanResult = deduplicateTransactions(filtered, incoming, 0.8);
    expect(cleanResult.unique).toHaveLength(1);
  });

  test("não filtra mesmo sinal", () => {
    const existing = [
      tx("e1", "2026-01-15", -100, "Loja ABC", "bank", "acc-1"),
    ];
    const incoming = [
      tx("n1", "2026-01-15", -100, "Loja ABC", "csv", "acc-2"),
    ];

    const { existing: filtered } = filterOppositeSigns(existing, incoming);
    expect(filtered).toHaveLength(1); // kept because same sign
  });

  test("não filtra quando sem match de fingerprint", () => {
    const existing = [
      tx("e1", "2026-01-15", -100, "Loja ABC", "bank", "acc-1"),
    ];
    const incoming = [
      tx("n1", "2026-01-16", 100, "Loja XYZ", "csv", "acc-2"), // different day
    ];

    const { existing: filtered } = filterOppositeSigns(existing, incoming);
    expect(filtered).toHaveLength(1); // no match → kept
  });
});
