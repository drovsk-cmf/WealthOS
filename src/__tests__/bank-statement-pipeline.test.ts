/**
 * Tests: Bank Statement Pipeline (E68)
 * Ref: docs/IMPORT-ENGINE-SPEC.md §4
 */
import { parseBankStatement, countInstallments, type ParseResult } from "@/lib/parsers/bank-statement-pipeline";
import type { BankDetection } from "@/lib/parsers/bank-detection";

// ── Helper: criar detecção fake ──

function makeDetection(overrides: Partial<BankDetection>): BankDetection {
  return {
    bankId: "test",
    bankName: "Test Bank",
    confidence: 0.95,
    fileType: "extrato",
    mapping: { date: 0, description: 1, amount: 2 },
    signedAmounts: true,
    dateFormat: "DD/MM/YYYY",
    decimalSeparator: ",",
    skipRows: 0,
    ...overrides,
  };
}

// ── Nubank Fatura ──

describe("parseBankStatement: Nubank fatura", () => {
  const detection = makeDetection({
    bankId: "nubank_fatura",
    bankName: "Nubank",
    fileType: "fatura",
    mapping: { date: 0, description: 1, amount: 2 },
    signedAmounts: false,
    dateFormat: "YYYY-MM-DD",
    decimalSeparator: ".",
  });

  it("parse fatura Nubank com 3 lançamentos", () => {
    const rows = [
      ["date", "title", "amount"],
      ["2026-03-05", "IFOOD *IFOOD SAO PAULO", "45.90"],
      ["2026-03-06", "UBER *UBER TRIP", "18.50"],
      ["2026-03-07", "MERCADOLIVRE*RESOLVE Parcela 3 de 10", "55.00"],
    ];

    const result = parseBankStatement(rows, detection);
    expect(result.transactions).toHaveLength(3);
    expect(result.bankId).toBe("nubank_fatura");

    // Todos são expense (fatura de cartão)
    expect(result.transactions.every((t) => t.type === "expense")).toBe(true);

    // Terceiro tem parcela detectada
    const installment = result.transactions[2].installment;
    expect(installment).not.toBeNull();
    expect(installment!.current).toBe(3);
    expect(installment!.total).toBe(10);
  });
});

// ── Nubank Extrato ──

describe("parseBankStatement: Nubank extrato", () => {
  const detection = makeDetection({
    bankId: "nubank_extrato",
    bankName: "Nubank",
    fileType: "extrato",
    mapping: { date: 0, amount: 1, description: 3 },
    signedAmounts: true,
    dateFormat: "DD/MM/YYYY",
    decimalSeparator: ",",
  });

  it("parse extrato com receita e despesa (signed amounts)", () => {
    const rows = [
      ["data", "valor", "identificador", "descrição"],
      ["05/03/2026", "-45,90", "abc123", "PIX Enviado Supermercado"],
      ["06/03/2026", "3.500,00", "def456", "Transferência recebida Empresa"],
    ];

    const result = parseBankStatement(rows, detection);
    expect(result.transactions).toHaveLength(2);

    expect(result.transactions[0].type).toBe("expense");
    expect(result.transactions[0].amount).toBe(45.90);

    expect(result.transactions[1].type).toBe("income");
    expect(result.transactions[1].amount).toBe(3500.00);
  });
});

// ── XP com coluna parcela ──

describe("parseBankStatement: XP com coluna parcela", () => {
  const detection = makeDetection({
    bankId: "xp",
    bankName: "XP Investimentos",
    fileType: "extrato",
    mapping: { date: 0, description: 1, amount: 2 },
    signedAmounts: true,
    dateFormat: "DD/MM/YYYY",
    decimalSeparator: ",",
  });

  it("extrai parcela da coluna dedicada", () => {
    const rows = [
      ["data", "movimentação", "valor", "parcela"],
      ["10/03/2026", "AMAZON MARKETPLACE", "-299,90", "14 de 18"],
    ];

    const result = parseBankStatement(rows, detection);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].installment).not.toBeNull();
    expect(result.transactions[0].installment!.current).toBe(14);
    expect(result.transactions[0].installment!.total).toBe(18);
    expect(result.transactions[0].installment!.matchMethod).toBe("column");
  });
});

// ── Bradescard com parcela em descrição ──

describe("parseBankStatement: Bradescard parcela", () => {
  const detection = makeDetection({
    bankId: "porto_bradescard",
    bankName: "Porto Bank",
    fileType: "fatura",
    mapping: { date: 0, description: 1, amount: 2 },
    signedAmounts: false,
    dateFormat: "DD/MM/YYYY",
    decimalSeparator: ",",
  });

  it("extrai (13/13) da descrição", () => {
    const rows = [
      ["data", "descrição", "valor", "parcela"],
      ["05/03/2026", "AMAZON MARKETPLACE SAO PAULO(13/13)", "42,90", ""],
    ];

    const result = parseBankStatement(rows, detection);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].installment).not.toBeNull();
    expect(result.transactions[0].installment!.current).toBe(13);
    expect(result.transactions[0].installment!.total).toBe(13);
    expect(result.transactions[0].description).toBe("AMAZON MARKETPLACE SAO PAULO");
  });
});

// ── Rows vazias e erros ──

describe("parseBankStatement: edge cases", () => {
  const detection = makeDetection({});

  it("ignora linhas vazias", () => {
    const rows = [
      ["data", "descrição", "valor"],
      ["05/03/2026", "Compra 1", "100,00"],
      ["", "", ""],
      ["06/03/2026", "Compra 2", "200,00"],
    ];

    const result = parseBankStatement(rows, detection);
    expect(result.transactions).toHaveLength(2);
  });

  it("ignora linhas sem valor", () => {
    const rows = [
      ["data", "descrição", "valor"],
      ["05/03/2026", "Resumo do mês", ""],
    ];

    const result = parseBankStatement(rows, detection);
    expect(result.transactions).toHaveLength(0);
  });

  it("gera external ID determinístico", () => {
    const rows = [
      ["data", "descrição", "valor"],
      ["05/03/2026", "Compra Test", "100,00"],
    ];

    const r1 = parseBankStatement(rows, detection);
    const r2 = parseBankStatement(rows, detection);
    expect(r1.transactions[0].externalId).toBe(r2.transactions[0].externalId);
  });
});

// ── countInstallments ──

describe("countInstallments", () => {
  it("conta parcelas e compras únicas", () => {
    const result: ParseResult = {
      transactions: [
        {
          externalId: "1",
          date: "2026-03-05",
          amount: 100,
          type: "expense",
          description: "TV Samsung",
          originalDescription: "TV Samsung (3/10)",
          installment: { current: 3, total: 10, cleanDescription: "TV Samsung", matchMethod: "regex" },
          bankId: "test",
          fileType: "fatura",
        },
        {
          externalId: "2",
          date: "2026-03-05",
          amount: 50,
          type: "expense",
          description: "Amazon",
          originalDescription: "AMAZON (5/5)",
          installment: { current: 5, total: 5, cleanDescription: "Amazon", matchMethod: "regex" },
          bankId: "test",
          fileType: "fatura",
        },
        {
          externalId: "3",
          date: "2026-03-05",
          amount: 30,
          type: "expense",
          description: "iFood",
          originalDescription: "IFOOD SAO PAULO",
          installment: null,
          bankId: "test",
          fileType: "fatura",
        },
      ],
      bankId: "test",
      bankName: "Test",
      fileType: "fatura",
      warnings: [],
    };

    const counts = countInstallments(result);
    expect(counts.total).toBe(3);
    expect(counts.withInstallment).toBe(2);
    expect(counts.uniquePurchases).toBe(2);
  });
});
