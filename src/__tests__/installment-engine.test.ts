/**
 * Tests: Motor de Parcelamento (E67)
 * Ref: docs/INSTALLMENT-SYSTEM-SPEC.md
 */
import {
  splitInstallments,
  parseInstallmentInfo,
  calculateInstallmentDates,
  generateInstallmentTransactions,
  projectFutureBills,
  reconcileInstallment,
  estimateTotalFromInstallment,
} from "@/lib/services/installment-engine";

// ── splitInstallments ──

describe("splitInstallments", () => {
  it("divide R$ 143,17 em 5x com aritmética do centavo", () => {
    const result = splitInstallments(143.17, 5);
    expect(result).toHaveLength(5);
    // base = floor(14317/5) = 2863 centavos = R$ 28,63
    // resto = 14317 - 2863*5 = 2 centavos
    // 1ª parcela = 28,63 + 0,02 = 28,65
    expect(result[0]).toEqual({ number: 1, amount: 28.65 });
    expect(result[1]).toEqual({ number: 2, amount: 28.63 });
    expect(result[4]).toEqual({ number: 5, amount: 28.63 });
    // Soma deve bater exatamente
    const total = result.reduce((s, r) => s + Math.round(r.amount * 100), 0);
    expect(total).toBe(14317);
  });

  it("divide R$ 100,00 em 3x (dízima)", () => {
    const result = splitInstallments(100.0, 3);
    // base = floor(10000/3) = 3333 centavos = R$ 33,33
    // resto = 10000 - 3333*3 = 1 centavo
    // 1ª = 33,34, demais = 33,33
    expect(result[0].amount).toBe(33.34);
    expect(result[1].amount).toBe(33.33);
    expect(result[2].amount).toBe(33.33);
    const total = result.reduce((s, r) => s + Math.round(r.amount * 100), 0);
    expect(total).toBe(10000);
  });

  it("divide valor exato sem resto", () => {
    const result = splitInstallments(100.0, 4);
    // 10000 / 4 = 2500 exatos
    expect(result.every((r) => r.amount === 25.0)).toBe(true);
  });

  it("divide R$ 1,01 em 2x", () => {
    const result = splitInstallments(1.01, 2);
    expect(result[0].amount).toBe(0.51);
    expect(result[1].amount).toBe(0.50);
  });

  it("rejeita menos de 2 parcelas", () => {
    expect(() => splitInstallments(100, 1)).toThrow("mínimo 2");
  });

  it("rejeita valor negativo", () => {
    expect(() => splitInstallments(-50, 3)).toThrow("positivo");
  });

  it("divide R$ 3.499,00 em 10x (spec §7.1)", () => {
    const result = splitInstallments(3499.0, 10);
    // 349900 / 10 = 34990 exatos = R$ 349,90
    expect(result[0].amount).toBe(349.90);
    expect(result[9].amount).toBe(349.90);
    const total = result.reduce((s, r) => s + Math.round(r.amount * 100), 0);
    expect(total).toBe(349900);
  });
});

// ── parseInstallmentInfo ──

describe("parseInstallmentInfo", () => {
  it("extrai 'Parcela 15 de 18' (Mercado Pago)", () => {
    const r = parseInstallmentInfo("MERCADOLIVRE*RESOLVE Parcela 15 de 18");
    expect(r.current).toBe(15);
    expect(r.total).toBe(18);
    expect(r.matchMethod).toBe("regex");
    expect(r.cleanDescription).toBe("MERCADOLIVRE*RESOLVE");
  });

  it("extrai '(13/13)' (Bradescard)", () => {
    const r = parseInstallmentInfo("AMAZON MARKETPLACE SAO PAULO(13/13)");
    expect(r.current).toBe(13);
    expect(r.total).toBe(13);
    expect(r.cleanDescription).toBe("AMAZON MARKETPLACE SAO PAULO");
  });

  it("extrai '*I 19/24' (Itaú)", () => {
    const r = parseInstallmentInfo("SAMSUNG *I 19/24");
    expect(r.current).toBe(19);
    expect(r.total).toBe(24);
    expect(r.cleanDescription).toBe("SAMSUNG");
  });

  it("extrai 'PA/05' (Porto Bank, sem total)", () => {
    const r = parseInstallmentInfo("PORTO SEGURO AUTO PA/05 BZ");
    expect(r.current).toBe(5);
    expect(r.total).toBe(0); // Porto não informa total
    expect(r.matchMethod).toBe("regex");
  });

  it("extrai '(9/9)' (BTG)", () => {
    const r = parseInstallmentInfo("Shopee (9/9)");
    expect(r.current).toBe(9);
    expect(r.total).toBe(9);
  });

  it("extrai '6/12' genérico", () => {
    const r = parseInstallmentInfo("Decolar 6/12");
    expect(r.current).toBe(6);
    expect(r.total).toBe(12);
  });

  it("usa coluna dedicada (XP)", () => {
    const r = parseInstallmentInfo("AMAZON MARKETPLACE", undefined, "14 de 18");
    expect(r.current).toBe(14);
    expect(r.total).toBe(18);
    expect(r.matchMethod).toBe("column");
    expect(r.cleanDescription).toBe("AMAZON MARKETPLACE");
  });

  it("detecta 'à vista' via tipo de compra (BTG)", () => {
    const r = parseInstallmentInfo("Supermercado Carrefour", "Compra à vista");
    expect(r.current).toBe(0);
    expect(r.total).toBe(0);
    expect(r.matchMethod).toBe("type_column");
  });

  it("não confunde data 15/03 com parcela", () => {
    const r = parseInstallmentInfo("Compra 15/03 no mercado");
    // 15/03: current=15, total=3 → total < 2 → filtered out by generic_slash
    // Actually total=3 >= 2 but current=15 > total=3 → filtered
    expect(r.matchMethod).toBe("none");
  });

  it("retorna none para descrição sem parcela", () => {
    const r = parseInstallmentInfo("IFOOD IFOOD SAO PAULO BR");
    expect(r.current).toBe(0);
    expect(r.total).toBe(0);
    expect(r.matchMethod).toBe("none");
  });
});

// ── calculateInstallmentDates ──

describe("calculateInstallmentDates", () => {
  it("compra antes do fechamento → 1ª parcela no mês corrente", () => {
    // Compra dia 5, fechamento dia 15 → cai na fatura de janeiro
    const dates = calculateInstallmentDates(new Date(2026, 0, 5), 15, 3);
    expect(dates[0].getMonth()).toBe(0); // janeiro
    expect(dates[1].getMonth()).toBe(1); // fevereiro
    expect(dates[2].getMonth()).toBe(2); // março
  });

  it("compra após fechamento → 1ª parcela no mês seguinte", () => {
    // Compra dia 20, fechamento dia 15 → cai na fatura de fevereiro
    const dates = calculateInstallmentDates(new Date(2026, 0, 20), 15, 3);
    expect(dates[0].getMonth()).toBe(1); // fevereiro
    expect(dates[1].getMonth()).toBe(2); // março
    expect(dates[2].getMonth()).toBe(3); // abril
  });

  it("trata virada de ano", () => {
    const dates = calculateInstallmentDates(new Date(2025, 10, 25), 20, 4);
    // Compra 25/nov, fechamento dia 20 → 1ª fatura dezembro
    expect(dates[0].getMonth()).toBe(11); // dezembro 2025
    expect(dates[1].getFullYear()).toBe(2026);
    expect(dates[1].getMonth()).toBe(0); // janeiro 2026
  });

  it("ajusta dia de fechamento para meses curtos (fevereiro)", () => {
    const dates = calculateInstallmentDates(new Date(2026, 0, 5), 31, 3);
    // Fechamento dia 31. Fevereiro não tem dia 31.
    expect(dates[1].getDate()).toBe(28); // fev 2026 = 28 dias
    expect(dates[0].getDate()).toBe(31); // jan = 31
  });
});

// ── generateInstallmentTransactions ──

describe("generateInstallmentTransactions", () => {
  it("gera N transações com valores corretos e datas distribuídas", () => {
    const txns = generateInstallmentTransactions(
      "test-uuid-123",
      "TV Samsung 55\"",
      143.17,
      5,
      new Date(2026, 0, 10), // 10 de janeiro
      15 // fechamento dia 15
    );

    expect(txns).toHaveLength(5);
    expect(txns[0].amount).toBe(28.65); // aritmética do centavo
    expect(txns[1].amount).toBe(28.63);
    expect(txns[0].groupId).toBe("test-uuid-123");
    expect(txns[0].installmentCurrent).toBe(1);
    expect(txns[4].installmentCurrent).toBe(5);
    expect(txns[0].description).toBe("TV Samsung 55\" (1/5)");
    expect(txns[4].description).toBe("TV Samsung 55\" (5/5)");
    expect(txns[0].originalAmount).toBe(143.17);

    // Soma exata
    const sum = txns.reduce((s, t) => s + Math.round(t.amount * 100), 0);
    expect(sum).toBe(14317);
  });
});

// ── projectFutureBills ──

describe("projectFutureBills", () => {
  it("agrupa parcelas por mês", () => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();

    const installments = [
      {
        groupId: "a",
        installmentCurrent: 1,
        installmentTotal: 3,
        amount: 100,
        originalAmount: 300,
        projectedDate: new Date(y, m, 15),
        description: "Compra A (1/3)",
      },
      {
        groupId: "a",
        installmentCurrent: 2,
        installmentTotal: 3,
        amount: 100,
        originalAmount: 300,
        projectedDate: new Date(y, m + 1, 15),
        description: "Compra A (2/3)",
      },
      {
        groupId: "b",
        installmentCurrent: 1,
        installmentTotal: 2,
        amount: 50,
        originalAmount: 100,
        projectedDate: new Date(y, m, 15),
        description: "Compra B (1/2)",
      },
    ];

    const bills = projectFutureBills(installments, 15, 25, 3);
    expect(bills.length).toBe(3);

    // Primeiro mês: Compra A (1/3) + Compra B (1/2) = 150
    expect(bills[0].installmentTotal).toBe(150);
    expect(bills[0].installments).toHaveLength(2);

    // Segundo mês: Compra A (2/3) = 100
    expect(bills[1].installmentTotal).toBe(100);
    expect(bills[1].installments).toHaveLength(1);
  });
});

// ── reconcileInstallment ──

describe("reconcileInstallment", () => {
  const projected = {
    groupId: "abc",
    installmentCurrent: 3,
    installmentTotal: 10,
    amount: 349.90,
    originalAmount: 3499.00,
    projectedDate: new Date(2026, 2, 15),
    description: "TV Samsung (3/10)",
  };

  it("matched: valor idêntico", () => {
    const r = reconcileInstallment(projected, {
      description: "TV SAMSUNG",
      amount: 349.90,
      date: new Date(2026, 2, 15),
    });
    expect(r.status).toBe("matched");
  });

  it("matched: diferença ≤ 2 centavos", () => {
    const r = reconcileInstallment(projected, {
      description: "TV SAMSUNG",
      amount: 349.91,
      date: new Date(2026, 2, 15),
    });
    expect(r.status).toBe("matched");
  });

  it("amount_mismatch: diferença > 2 centavos", () => {
    const r = reconcileInstallment(projected, {
      description: "TV SAMSUNG",
      amount: 350.50,
      date: new Date(2026, 2, 15),
    });
    expect(r.status).toBe("amount_mismatch");
    expect(r.difference).toBeCloseTo(0.60, 2);
  });

  it("missing: parcela não encontrada na fatura", () => {
    const r = reconcileInstallment(projected, null);
    expect(r.status).toBe("missing");
    expect(r.message).toContain("não apareceu");
  });
});

// ── estimateTotalFromInstallment ──

describe("estimateTotalFromInstallment", () => {
  it("estima total a partir de parcela intermediária", () => {
    // Parcela 3/10, valor R$ 349,90 (base)
    const r = estimateTotalFromInstallment(349.90, 3, 10);
    expect(r.estimated).toBe(3499.00);
    // Range: 3499.00 a 3499.09
    expect(r.rangeMax).toBeCloseTo(3499.09, 2);
  });

  it("estima total a partir da 1ª parcela", () => {
    // 1ª parcela pode ter centavos extras
    const r = estimateTotalFromInstallment(28.65, 1, 5);
    // Estimativa: 28.65 * 5 = 143.25
    // Range: 143.25 - 4 centavos = 143.21 a 143.25
    expect(r.estimated).toBe(143.25);
    expect(r.rangeMin).toBe(143.21);
  });
});
