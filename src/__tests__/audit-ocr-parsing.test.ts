/**
 * Auditoria: Testes de edge cases dos parsers OCR
 *
 * Ref: Problema 7 (regex flag `g` inconsistente em parseDate)
 * e cobertura de borda para parseAmount (while loop com regex).
 */

import { parseAmount, parseDate, parseDescription } from "@/lib/services/ocr-service";

describe("OCR parseAmount (Auditoria Loop 3)", () => {
  it("extrai valor de 'R$ 1.234,56'", () => {
    expect(parseAmount("R$ 1.234,56")).toBe(1234.56);
  });

  it("extrai valor de 'R$100,00'", () => {
    expect(parseAmount("R$100,00")).toBe(100);
  });

  it("extrai TOTAL quando maior que subtotal", () => {
    const text = "SUBTOTAL: R$ 50,00\nTOTAL: R$ 55,00";
    expect(parseAmount(text)).toBe(55);
  });

  it("extrai formato VALOR: sem R$", () => {
    expect(parseAmount("VALOR: 250,00")).toBe(250);
  });

  it("extrai formato VLR com espaços", () => {
    expect(parseAmount("VLR: 99,90")).toBe(99.9);
  });

  it("retorna null para texto sem valores", () => {
    expect(parseAmount("Sem valor aqui")).toBeNull();
  });

  it("retorna null para texto vazio", () => {
    expect(parseAmount("")).toBeNull();
  });

  it("ignora valores >= 1.000.000", () => {
    expect(parseAmount("R$ 1.000.000,00")).toBeNull();
  });

  it("ignora valores negativos (zero)", () => {
    expect(parseAmount("R$ 0,00")).toBeNull();
  });

  it("seleciona o maior valor entre múltiplos matches", () => {
    const text = `
      ITEM 1: R$ 15,00
      ITEM 2: R$ 25,00
      ITEM 3: R$ 10,00
      TOTAL: R$ 50,00
    `;
    expect(parseAmount(text)).toBe(50);
  });

  it("lida com valor sem separador de milhar", () => {
    expect(parseAmount("TOTAL: 999,99")).toBe(999.99);
  });

  it("lida com múltiplos separadores de milhar", () => {
    expect(parseAmount("R$ 12.345,67")).toBe(12345.67);
  });
});

describe("OCR parseDate (Auditoria Problema 7)", () => {
  it("parseia DD/MM/YYYY válido", () => {
    expect(parseDate("Data: 15/03/2026")).toBe("2026-03-15");
  });

  it("parseia DD-MM-YYYY válido", () => {
    expect(parseDate("Data: 15-03-2026")).toBe("2026-03-15");
  });

  it("parseia DD/MM/YY (ano curto)", () => {
    expect(parseDate("01/01/26")).toBe("2026-01-01");
  });

  it("retorna null para texto sem data", () => {
    expect(parseDate("Nenhuma data aqui")).toBeNull();
  });

  it("retorna null para texto vazio", () => {
    expect(parseDate("")).toBeNull();
  });

  it("rejeita data com mês > 12", () => {
    expect(parseDate("15/13/2026")).toBeNull();
  });

  it("rejeita data com dia > 31", () => {
    expect(parseDate("32/03/2026")).toBeNull();
  });

  it("rejeita ano fora do range 2020-2030", () => {
    expect(parseDate("15/03/2019")).toBeNull();
    expect(parseDate("15/03/2031")).toBeNull();
  });

  it("aceita limites do range 2020-2030", () => {
    expect(parseDate("01/01/2020")).toBe("2020-01-01");
    expect(parseDate("31/12/2030")).toBe("2030-12-31");
  });

  it("seleciona a primeira data válida no texto", () => {
    const text = "Emissão: 10/03/2026\nVencimento: 15/03/2026";
    expect(parseDate(text)).toBe("2026-03-10");
  });

  it("parseia dia 1 (single digit) com padding correto", () => {
    expect(parseDate("01/01/2026")).toBe("2026-01-01");
  });
});

describe("OCR parseDescription", () => {
  it("extrai primeira linha significativa", () => {
    const text = "12345\nMERCADO BOM PRECO\nCNPJ: 12.345.678/0001-99";
    expect(parseDescription(text)).toBe("MERCADO BOM PRECO");
  });

  it("ignora linhas que são apenas números", () => {
    const text = "123456789\n0001\nLOJA EXEMPLO LTDA";
    expect(parseDescription(text)).toBe("LOJA EXEMPLO LTDA");
  });

  it("ignora linhas de separadores", () => {
    const text = "==========\n----------\nRESTAURANTE X";
    expect(parseDescription(text)).toBe("RESTAURANTE X");
  });

  it("ignora linhas com menos de 5 caracteres", () => {
    const text = "NF\n01\nPADARIA DO JOAO";
    expect(parseDescription(text)).toBe("PADARIA DO JOAO");
  });

  it("limita a 60 caracteres", () => {
    const longName = "A".repeat(100);
    expect(parseDescription(longName)!.length).toBe(60);
  });

  it("normaliza espaços duplos", () => {
    expect(parseDescription("LOJA   DO    ZE")).toBe("LOJA DO ZE");
  });

  it("retorna null para texto vazio", () => {
    expect(parseDescription("")).toBeNull();
  });

  it("retorna null quando todas as linhas são curtas ou numéricas", () => {
    expect(parseDescription("01\n02\n123\nAB")).toBeNull();
  });

  it("considera apenas as 5 primeiras linhas", () => {
    const text = "1\n2\n3\n4\n5\nESTABELECIMENTO REAL NA LINHA 6";
    expect(parseDescription(text)).toBeNull();
  });
});
