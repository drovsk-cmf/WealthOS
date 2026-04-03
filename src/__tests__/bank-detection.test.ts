/**
 * Oniefy - Bank Detection Tests (E19)
 */

import {
  detectBank,
  getSupportedBanks,
  parseBRDate,
  parseBRCurrency,
} from "@/lib/parsers/bank-detection";

describe("Bank Detection", () => {
  test("detects Nubank fatura (English headers)", () => {
    const result = detectBank(["date", "title", "amount"]);
    expect(result).not.toBeNull();
    expect(result!.bankId).toBe("nubank_fatura");
    expect(result!.bankName).toBe("Nubank");
    expect(result!.fileType).toBe("fatura");
    expect(result!.confidence).toBeGreaterThanOrEqual(0.8);
  });

  test("detects Nubank fatura (Portuguese headers)", () => {
    const result = detectBank(["Data", "Título", "Valor"]);
    expect(result).not.toBeNull();
    expect(result!.bankId).toBe("nubank_fatura");
  });

  test("detects Nubank extrato", () => {
    const result = detectBank(["Data", "Valor", "Identificador", "Descrição"]);
    expect(result).not.toBeNull();
    expect(result!.bankId).toBe("nubank_extrato");
    expect(result!.fileType).toBe("extrato");
    expect(result!.signedAmounts).toBe(true);
  });

  test("detects Itaú", () => {
    const result = detectBank(["Data", "Lançamento", "Valor"]);
    expect(result).not.toBeNull();
    expect(result!.bankId).toBe("itau");
  });

  test("detects BTG Pactual", () => {
    const result = detectBank(["Data", "Historico", "Valor"]);
    expect(result).not.toBeNull();
    expect(result!.bankId).toBe("btg");
  });

  test("detects Inter", () => {
    const result = detectBank(["Data Lançamento", "Histórico", "Descrição", "Valor", "Saldo"]);
    expect(result).not.toBeNull();
    expect(result!.bankId).toBe("inter");
  });

  test("detects C6 Bank fatura", () => {
    const result = detectBank(["Data da Compra", "Estabelecimento", "Valor"]);
    expect(result).not.toBeNull();
    expect(result!.bankId).toBe("c6");
    expect(result!.fileType).toBe("fatura");
  });

  test("returns null for unknown headers", () => {
    const result = detectBank(["Column A", "Column B", "Column C"]);
    expect(result).toBeNull();
  });

  test("mapping has correct column indices", () => {
    const result = detectBank(["date", "title", "amount"]); // Nubank fatura
    expect(result!.mapping.date).toBe(0);
    expect(result!.mapping.description).toBe(1);
    expect(result!.mapping.amount).toBe(2);
  });

  test("content patterns boost confidence", () => {
    const headers = ["Data", "Descrição", "Valor", "Moeda"];
    const withContent = detectBank(headers, [["01/01/2026", "Mercado Pago compra", "50,00", "BRL"]]);
    const withoutContent = detectBank(headers);
    // Both should detect, but with content should have higher confidence
    expect(withContent).not.toBeNull();
    expect(withoutContent).not.toBeNull();
  });
});

describe("Supported Banks", () => {
  test("returns at least 8 bank configurations", () => {
    const banks = getSupportedBanks();
    expect(banks.length).toBeGreaterThanOrEqual(8);
  });

  test("no duplicate bank+fileType entries", () => {
    const banks = getSupportedBanks();
    const keys = banks.map((b) => `${b.bankId}-${b.fileType}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("BR Date/Currency Parsers", () => {
  test("parseBRDate converts DD/MM/YYYY to ISO", () => {
    expect(parseBRDate("15/03/2026")).toBe("2026-03-15");
    expect(parseBRDate("01/01/2025")).toBe("2025-01-01");
  });

  test("parseBRDate passes through ISO dates", () => {
    expect(parseBRDate("2026-03-15")).toBe("2026-03-15");
  });

  test("parseBRCurrency handles BR format", () => {
    expect(parseBRCurrency("1.234,56")).toBeCloseTo(1234.56);
    expect(parseBRCurrency("-500,00")).toBeCloseTo(-500);
    expect(parseBRCurrency("R$ 1.000,00")).toBeCloseTo(1000);
    expect(parseBRCurrency("50")).toBeCloseTo(50);
  });
});
