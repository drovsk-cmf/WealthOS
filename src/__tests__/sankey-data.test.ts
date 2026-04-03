/**
 * Oniefy - Sankey Data Tests (E41)
 */

import {
  buildSankeyData,
  type TransactionForSankey,
} from "@/lib/services/sankey-data";

function tx(amount: number, type: "income" | "expense", category: string | null, desc?: string): TransactionForSankey {
  return { amount, type, category_name: category, description: desc ?? null };
}

describe("Sankey Data Builder", () => {
  const TRANSACTIONS: TransactionForSankey[] = [
    // Income
    tx(10000, "income", "Salário", "Salário CLT"),
    tx(3000, "income", "Freelance", "Projeto X"),
    // Expenses
    tx(-3000, "expense", "Moradia"),
    tx(-2000, "expense", "Alimentação"),
    tx(-1500, "expense", "Transporte"),
    tx(-800, "expense", "Saúde"),
    tx(-500, "expense", "Educação"),
    tx(-300, "expense", "Lazer"),
  ];

  test("builds nodes and links from transactions", () => {
    const data = buildSankeyData(TRANSACTIONS);
    expect(data.nodes.length).toBeGreaterThan(0);
    expect(data.links.length).toBeGreaterThan(0);
  });

  test("income sources flow into central node", () => {
    const data = buildSankeyData(TRANSACTIONS);
    const centralIdx = data.nodes.findIndex((n) => n.name === "Receita Total");
    expect(centralIdx).toBeGreaterThan(-1);
    const incomeLinks = data.links.filter((l) => l.target === centralIdx);
    expect(incomeLinks.length).toBe(2); // Salário + Freelance
    expect(incomeLinks.reduce((s, l) => s + l.value, 0)).toBeCloseTo(13000, 0);
  });

  test("expense categories receive from central node", () => {
    const data = buildSankeyData(TRANSACTIONS);
    const centralIdx = data.nodes.findIndex((n) => n.name === "Receita Total");
    const expenseLinks = data.links.filter((l) => l.source === centralIdx);
    expect(expenseLinks.length).toBeGreaterThanOrEqual(6); // 6 categories + surplus
  });

  test("surplus node shows positive balance", () => {
    const data = buildSankeyData(TRANSACTIONS);
    expect(data.surplus).toBeCloseTo(4900, 0); // 13000 - 8100
    const surplusNode = data.nodes.find((n) => n.name.includes("Poupança"));
    expect(surplusNode).toBeDefined();
  });

  test("no surplus node when expenses exceed income", () => {
    const deficit = [
      tx(5000, "income", "Salário"),
      tx(-6000, "expense", "Moradia"),
    ];
    const data = buildSankeyData(deficit);
    expect(data.surplus).toBeLessThan(0);
    const surplusNode = data.nodes.find((n) => n.name.includes("Poupança"));
    expect(surplusNode).toBeUndefined();
  });

  test("groups small categories into 'Outros' when topN exceeded", () => {
    const many = [
      tx(10000, "income", "Salário"),
      ...Array.from({ length: 15 }, (_, i) =>
        tx(-100, "expense", `Cat ${i + 1}`)
      ),
    ];
    const data = buildSankeyData(many, 5);
    const outros = data.nodes.find((n) => n.name === "Outros");
    expect(outros).toBeDefined();
  });

  test("empty transactions returns empty data", () => {
    const data = buildSankeyData([]);
    expect(data.nodes).toHaveLength(0);
    expect(data.links).toHaveLength(0);
    expect(data.totalIncome).toBe(0);
  });

  test("totals are calculated correctly", () => {
    const data = buildSankeyData(TRANSACTIONS);
    expect(data.totalIncome).toBeCloseTo(13000, 0);
    expect(data.totalExpenses).toBeCloseTo(8100, 0);
    expect(data.surplus).toBeCloseTo(4900, 0);
  });

  test("transactions without category use fallback names", () => {
    const nocat = [
      tx(5000, "income", null, "Pagamento cliente"),
      tx(-1000, "expense", null),
    ];
    const data = buildSankeyData(nocat);
    expect(data.nodes.some((n) => n.name === "Sem categoria")).toBe(true);
  });
});
