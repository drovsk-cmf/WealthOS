/**
 * Tests for Oniefy template parser (detectOniefyTemplate, parseStandardTemplate, parseCardTemplate)
 * and setup journey hooks/types.
 */

import {
  detectOniefyTemplate,
  parseStandardTemplate,
  parseCardTemplate,
  ONIEFY_TEMPLATE_HEADERS,
} from "@/lib/parsers/oniefy-template";

// ─── detectOniefyTemplate ──────────────────────────────────

describe("detectOniefyTemplate", () => {
  it("detects standard template with exact headers", () => {
    expect(detectOniefyTemplate([...ONIEFY_TEMPLATE_HEADERS])).toBe("standard");
  });

  it("detects standard template with extra headers", () => {
    expect(
      detectOniefyTemplate(["Data", "Tipo", "Valor", "Descrição", "Extra"])
    ).toBe("standard");
  });

  it("detects standard template case-insensitive", () => {
    expect(
      detectOniefyTemplate(["data", "tipo", "valor", "descrição"])
    ).toBe("standard");
  });

  it("detects card template", () => {
    expect(
      detectOniefyTemplate([
        "Data",
        "Descrição Original",
        "Descrição Personalizada",
        "Valor",
        "Parcela",
        "Categoria",
      ])
    ).toBe("card");
  });

  it("detects card template with minimum required headers", () => {
    expect(
      detectOniefyTemplate(["Data", "Descrição Original", "Valor"])
    ).toBe("card");
  });

  it("returns null for unrecognized headers", () => {
    expect(detectOniefyTemplate(["Date", "Amount", "Description"])).toBeNull();
  });

  it("returns null for empty headers", () => {
    expect(detectOniefyTemplate([])).toBeNull();
  });

  it("prefers standard over card when both match", () => {
    // Standard requires Data+Tipo+Valor+Descrição, which is checked first
    expect(
      detectOniefyTemplate(["Data", "Tipo", "Valor", "Descrição", "Descrição Original"])
    ).toBe("standard");
  });
});

// ─── parseStandardTemplate ─────────────────────────────────

describe("parseStandardTemplate", () => {
  const headers = ["Data", "Tipo", "Valor", "Descrição", "Categoria", "Notas", "Tags"];

  it("parses valid expense row", () => {
    const rows = [["15/03/2026", "Despesa", "150,00", "Supermercado", "Alimentação", "", ""]];
    const result = parseStandardTemplate(headers, rows);

    expect(result.errors).toHaveLength(0);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0]).toMatchObject({
      date: "2026-03-15",
      amount: 150,
      description: "Supermercado",
      type: "expense",
    });
  });

  it("parses valid income row", () => {
    const rows = [["01/03/2026", "Receita", "8500,00", "Salário", "", "", ""]];
    const result = parseStandardTemplate(headers, rows);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].type).toBe("income");
    expect(result.transactions[0].amount).toBe(8500);
  });

  it("parses R$ prefix in amounts", () => {
    const rows = [["01/03/2026", "Despesa", "R$ 1.500,00", "Aluguel", "", "", ""]];
    const result = parseStandardTemplate(headers, rows);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].amount).toBe(1500);
  });

  it("infers type from sign when Tipo is empty", () => {
    const rows = [
      ["01/03/2026", "", "500,00", "Pagamento recebido", "", "", ""],
      ["02/03/2026", "", "-120,00", "Conta de luz", "", "", ""],
    ];
    const result = parseStandardTemplate(headers, rows);

    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0].type).toBe("income");
    expect(result.transactions[1].type).toBe("expense");
  });

  it("skips empty rows", () => {
    const rows = [
      ["15/03/2026", "Despesa", "50,00", "Café", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["16/03/2026", "Despesa", "30,00", "Uber", "", "", ""],
    ];
    const result = parseStandardTemplate(headers, rows);

    expect(result.transactions).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it("reports invalid date errors", () => {
    const rows = [["not-a-date", "Despesa", "50,00", "Café", "", "", ""]];
    const result = parseStandardTemplate(headers, rows);

    expect(result.transactions).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Data inválida");
  });

  it("reports invalid amount errors", () => {
    const rows = [["15/03/2026", "Despesa", "abc", "Café", "", "", ""]];
    const result = parseStandardTemplate(headers, rows);

    expect(result.transactions).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Valor inválido");
  });

  it("handles ISO date format YYYY-MM-DD", () => {
    const rows = [["2026-03-15", "Despesa", "100", "Compra", "", "", ""]];
    const result = parseStandardTemplate(headers, rows);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].date).toBe("2026-03-15");
  });

  it("returns error when required columns missing", () => {
    const result = parseStandardTemplate(["Foo", "Bar"], [["x", "y"]]);

    expect(result.transactions).toHaveLength(0);
    expect(result.errors[0]).toContain("Colunas obrigatórias");
  });
});

// ─── parseCardTemplate ─────────────────────────────────────

describe("parseCardTemplate", () => {
  const headers = ["Data", "Descrição Original", "Descrição Personalizada", "Valor", "Parcela", "Categoria"];

  it("parses valid card transaction", () => {
    const rows = [["10/03/2026", "RAPPI*RAPPIBANK", "iFood/Rappi", "45,90", "1/1", "Alimentação"]];
    const result = parseCardTemplate(headers, rows);

    expect(result.errors).toHaveLength(0);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0]).toMatchObject({
      date: "2026-03-10",
      amount: 45.9,
      description: "iFood/Rappi", // uses custom when available
      type: "expense",
    });
  });

  it("falls back to original description when custom is empty", () => {
    const rows = [["10/03/2026", "NETFLIX.COM", "", "55,90", "1/1", "Lazer"]];
    const result = parseCardTemplate(headers, rows);

    expect(result.transactions[0].description).toBe("NETFLIX.COM");
  });

  it("all transactions are expense type", () => {
    const rows = [
      ["10/03/2026", "RAPPI*RAPPIBANK", "", "45,90", "", ""],
      ["12/03/2026", "NETFLIX.COM", "", "55,90", "", ""],
    ];
    const result = parseCardTemplate(headers, rows);

    expect(result.transactions.every((t) => t.type === "expense")).toBe(true);
  });

  it("handles missing required columns gracefully", () => {
    const result = parseCardTemplate(["Foo", "Bar"], [["x", "y"]]);

    expect(result.transactions).toHaveLength(0);
    expect(result.errors[0]).toContain("Colunas obrigatórias");
  });

  it("skips empty rows", () => {
    const rows = [
      ["10/03/2026", "RAPPI*RAPPIBANK", "", "45,90", "", ""],
      ["", "", "", "", "", ""],
    ];
    const result = parseCardTemplate(headers, rows);

    expect(result.transactions).toHaveLength(1);
  });

  it("generates unique externalIds", () => {
    const rows = [
      ["10/03/2026", "A", "", "10", "", ""],
      ["11/03/2026", "B", "", "20", "", ""],
    ];
    const result = parseCardTemplate(headers, rows);
    const ids = result.transactions.map((t) => t.externalId);

    expect(new Set(ids).size).toBe(2);
  });
});
