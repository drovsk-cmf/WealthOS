import { getUncategorizedDescriptions } from "@/lib/hooks/use-ai-categorize";

describe("P11: AI categorize helpers", () => {
  describe("getUncategorizedDescriptions", () => {
    it("retorna apenas transações sem categoria", () => {
      const txs = [
        { description: "Supermercado", category_id: "cat-1" },
        { description: "Loja XYZ", category_id: null },
        { description: "Farmácia", category_id: undefined },
        { description: "Uber", category_id: "cat-2" },
      ];
      const result = getUncategorizedDescriptions(txs);
      expect(result).toEqual(["Loja XYZ", "Farmácia"]);
    });

    it("ignora transações sem descrição", () => {
      const txs = [
        { description: null, category_id: null },
        { description: "", category_id: null },
        { description: "   ", category_id: null },
        { description: "Válida", category_id: null },
      ];
      const result = getUncategorizedDescriptions(txs);
      expect(result).toEqual(["Válida"]);
    });

    it("deduplica descrições iguais", () => {
      const txs = [
        { description: "Uber", category_id: null },
        { description: "Uber", category_id: null },
        { description: "uber", category_id: null },
        { description: "iFood", category_id: null },
      ];
      const result = getUncategorizedDescriptions(txs);
      // "Uber" e "uber" são diferentes (case-sensitive)
      expect(result).toEqual(["Uber", "uber", "iFood"]);
    });

    it("retorna vazio quando todas têm categoria", () => {
      const txs = [
        { description: "A", category_id: "cat-1" },
        { description: "B", category_id: "cat-2" },
      ];
      expect(getUncategorizedDescriptions(txs)).toEqual([]);
    });

    it("retorna vazio para array vazio", () => {
      expect(getUncategorizedDescriptions([])).toEqual([]);
    });

    it("faz trim nas descrições", () => {
      const txs = [{ description: "  Uber  ", category_id: null }];
      expect(getUncategorizedDescriptions(txs)).toEqual(["Uber"]);
    });
  });
});

describe("P11: AI rate limit response shape", () => {
  it("shape esperado do rate limit", () => {
    // Simula o retorno esperado da RPC check_ai_rate_limit
    const rateLimit = { used: 5, limit: 50, remaining: 45, allowed: true };
    expect(rateLimit.allowed).toBe(true);
    expect(rateLimit.remaining).toBe(45);
    expect(rateLimit.used + rateLimit.remaining).toBe(rateLimit.limit);
  });

  it("bloqueado quando used >= limit", () => {
    const rateLimit = { used: 50, limit: 50, remaining: 0, allowed: false };
    expect(rateLimit.allowed).toBe(false);
    expect(rateLimit.remaining).toBe(0);
  });
});
