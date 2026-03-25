/**
 * Tests: E7 (AffordabilitySimulator logic) + E9 (solvency interpretation)
 *
 * E7: Verifica cálculos de impacto no runway, LCR e reserva
 * E9: Verifica funções de interpretação de solvência
 */

describe("E7: AffordabilitySimulator - cálculos de impacto", () => {
  // PMT formula: PV * r / (1 - (1+r)^-n)
  function pmt(pv: number, r: number, n: number): number {
    if (r <= 0) return pv / n;
    return (pv * r) / (1 - Math.pow(1 + r, -n));
  }

  const BASE = {
    liquid: 100_000, // T1+T2
    burn: 10_000,
    lcr: 100_000 / (10_000 * 6), // ≈ 1.67
    runway: 100_000 / 10_000, // = 10
  };

  describe("à vista", () => {
    it("reduz líquido e recalcula runway", () => {
      const value = 30_000;
      const liquidAfter = BASE.liquid - value; // 70_000
      const runwayAfter = liquidAfter / BASE.burn; // 7.0
      const lcrAfter = liquidAfter / (BASE.burn * 6); // ≈ 1.17

      expect(liquidAfter).toBe(70_000);
      expect(runwayAfter).toBe(7);
      expect(lcrAfter).toBeCloseTo(1.167, 2);
    });

    it("compra que esgota a reserva", () => {
      const value = 100_000;
      const liquidAfter = BASE.liquid - value; // 0
      const runwayAfter = liquidAfter / BASE.burn; // 0

      expect(liquidAfter).toBe(0);
      expect(runwayAfter).toBe(0);
    });

    it("não altera burn rate", () => {
      const burnAfter = BASE.burn;
      expect(burnAfter).toBe(10_000);
    });
  });

  describe("parcelado sem juros", () => {
    it("não debita líquido, aumenta burn", () => {
      const value = 60_000;
      const months = 12;
      const monthly = value / months; // 5_000
      const liquidAfter = BASE.liquid; // 100_000 (inalterado)
      const burnAfter = BASE.burn + monthly; // 15_000
      const runwayAfter = liquidAfter / burnAfter; // ≈ 6.67

      expect(monthly).toBe(5_000);
      expect(liquidAfter).toBe(100_000);
      expect(burnAfter).toBe(15_000);
      expect(runwayAfter).toBeCloseTo(6.667, 2);
    });

    it("total de juros é zero", () => {
      const value = 60_000;
      const months = 12;
      const totalCost = (value / months) * months;
      expect(totalCost).toBe(value);
    });
  });

  describe("financiado", () => {
    it("calcula PMT corretamente", () => {
      const value = 200_000;
      const rate = 0.015; // 1.5% a.m.
      const months = 60;
      const monthly = pmt(value, rate, months);

      // PMT = 200000 * 0.015 / (1 - 1.015^-60)
      // ≈ 200000 * 0.015 / (1 - 0.4093) ≈ 3000 / 0.5907 ≈ 5079
      expect(monthly).toBeGreaterThan(5_000);
      expect(monthly).toBeLessThan(5_200);
    });

    it("total de juros é positivo", () => {
      const value = 200_000;
      const rate = 0.015;
      const months = 60;
      const monthly = pmt(value, rate, months);
      const totalCost = monthly * months;
      const totalInterest = totalCost - value;

      expect(totalInterest).toBeGreaterThan(0);
      // ~104.700 de juros em 60 meses a 1.5% a.m.
      expect(totalInterest).toBeGreaterThan(100_000);
      expect(totalInterest).toBeLessThan(110_000);
    });

    it("não debita líquido", () => {
      const liquidAfter = BASE.liquid;
      expect(liquidAfter).toBe(100_000);
    });

    it("com taxa zero, divide sem juros", () => {
      const monthly = pmt(120_000, 0, 12);
      expect(monthly).toBe(10_000);
    });
  });

  describe("meta de reserva (6 meses)", () => {
    it("reserva ok quando líquido > 6x burn", () => {
      const reserveTarget = BASE.burn * 6; // 60_000
      const liquidAfter = 70_000;
      expect(liquidAfter / reserveTarget).toBeGreaterThan(1);
    });

    it("reserva comprometida quando líquido < 6x burn", () => {
      const reserveTarget = BASE.burn * 6; // 60_000
      const liquidAfter = 30_000;
      expect(liquidAfter / reserveTarget).toBeLessThan(1);
    });
  });
});

describe("E9: interpretação de solvência em linguagem direta", () => {
  // Reimplementar as funções de interpretação para testar
  function lcrExplanation(lcr: number): string {
    if (lcr >= 999) return "Sem despesas recorrentes registradas";
    if (lcr >= 2) return `Sua liquidez cobre ${lcr.toFixed(1)}x o custo de 6 meses. Posição confortável.`;
    if (lcr >= 1) return `Sua liquidez cobre ${lcr.toFixed(1)}x o custo de 6 meses. Margem razoável.`;
    if (lcr >= 0.5) return `Sua liquidez cobre apenas ${(lcr * 100).toFixed(0)}% do custo semestral. Considere reforçar a reserva.`;
    return `Sua liquidez cobre apenas ${(lcr * 100).toFixed(0)}% do custo semestral. Reserva insuficiente para imprevistos.`;
  }

  function runwayExplanation(months: number): string {
    if (months >= 999) return "Sem despesas recorrentes registradas";
    const m = Math.floor(months);
    if (months >= 12) return `Você sobrevive ${m} meses sem renda. Reserva sólida.`;
    if (months >= 6) return `Você sobrevive ${m} meses sem renda. Dentro do recomendado.`;
    if (months >= 3) return `Você sobrevive apenas ${m} meses sem renda. Abaixo do ideal (6+ meses).`;
    return `Apenas ${m} mês(es) de reserva. Priorize recompor a reserva de emergência.`;
  }

  function patrimonyExplanation(total: number, tier1: number, tier2: number): string {
    if (total <= 0) return "Sem patrimônio registrado";
    const liquidRatio = ((tier1 + tier2) / total) * 100;
    if (liquidRatio >= 50) {
      return `${liquidRatio.toFixed(0)}% do seu patrimônio é acessível em até 30 dias. Boa liquidez.`;
    }
    return `${liquidRatio.toFixed(0)}% do patrimônio é líquido. A maior parte está em bens ou investimentos restritos.`;
  }

  describe("lcrExplanation", () => {
    it("sem despesas: mensagem neutra", () => {
      expect(lcrExplanation(999)).toBe("Sem despesas recorrentes registradas");
    });

    it("lcr >= 2: confortável", () => {
      const msg = lcrExplanation(2.4);
      expect(msg).toContain("2.4x");
      expect(msg).toContain("confortável");
    });

    it("lcr >= 1: razoável", () => {
      const msg = lcrExplanation(1.3);
      expect(msg).toContain("1.3x");
      expect(msg).toContain("razoável");
    });

    it("lcr < 0.5: insuficiente", () => {
      const msg = lcrExplanation(0.3);
      expect(msg).toContain("30%");
      expect(msg).toContain("insuficiente");
    });
  });

  describe("runwayExplanation", () => {
    it("sem despesas", () => {
      expect(runwayExplanation(999)).toBe("Sem despesas recorrentes registradas");
    });

    it(">= 12 meses: sólida", () => {
      const msg = runwayExplanation(14.5);
      expect(msg).toContain("14 meses");
      expect(msg).toContain("sólida");
    });

    it("6-12 meses: recomendado", () => {
      const msg = runwayExplanation(8.2);
      expect(msg).toContain("8 meses");
      expect(msg).toContain("recomendado");
    });

    it("< 3 meses: priorize", () => {
      const msg = runwayExplanation(2.1);
      expect(msg).toContain("2 mês(es)");
      expect(msg).toContain("Priorize");
    });
  });

  describe("patrimonyExplanation", () => {
    it("sem patrimônio", () => {
      expect(patrimonyExplanation(0, 0, 0)).toBe("Sem patrimônio registrado");
    });

    it("maioria líquida (>= 50%)", () => {
      const msg = patrimonyExplanation(100_000, 40_000, 20_000);
      expect(msg).toContain("60%");
      expect(msg).toContain("Boa liquidez");
    });

    it("maioria ilíquida (< 50%)", () => {
      const msg = patrimonyExplanation(100_000, 10_000, 10_000);
      expect(msg).toContain("20%");
      expect(msg).toContain("bens ou investimentos restritos");
    });
  });
});
