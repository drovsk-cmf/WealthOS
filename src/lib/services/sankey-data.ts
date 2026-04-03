/**
 * Oniefy - Sankey Data Preparation (E41)
 *
 * Transforms transaction data into Sankey diagram format (Recharts).
 * Flow: Income Sources → Total Income → Expense Categories
 *
 * Ref: PENDENCIAS E41, gap competitivo Monarch
 */

export interface SankeyNode {
  name: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
  totalIncome: number;
  totalExpenses: number;
  surplus: number;
}

export interface TransactionForSankey {
  amount: number;
  category_name: string | null;
  /** For income: source description (e.g., "Salário CLT", "Freelance") */
  description: string | null;
  type: "income" | "expense";
}

/**
 * Build Sankey data from transactions.
 * Structure: [Income sources] → "Receita Total" → [Expense categories] → "Poupança/Investimento"
 *
 * @param transactions - Transactions for the period
 * @param topN - Maximum number of expense categories to show (rest grouped as "Outros")
 */
export function buildSankeyData(
  transactions: TransactionForSankey[],
  topN = 10
): SankeyData {
  // Separate income and expenses
  const incomeBySource = new Map<string, number>();
  const expenseByCategory = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type === "income" && tx.amount > 0) {
      const source = tx.category_name || tx.description || "Outras receitas";
      incomeBySource.set(source, (incomeBySource.get(source) ?? 0) + tx.amount);
    } else if (tx.type === "expense" && tx.amount < 0) {
      const cat = tx.category_name || "Sem categoria";
      expenseByCategory.set(cat, (expenseByCategory.get(cat) ?? 0) + Math.abs(tx.amount));
    }
  }

  if (incomeBySource.size === 0 && expenseByCategory.size === 0) {
    return { nodes: [], links: [], totalIncome: 0, totalExpenses: 0, surplus: 0 };
  }

  // Sort and limit expense categories
  const sortedExpenses = Array.from(expenseByCategory.entries())
    .sort((a, b) => b[1] - a[1]);

  const topExpenses = sortedExpenses.slice(0, topN);
  const otherExpenses = sortedExpenses.slice(topN);
  const otherTotal = otherExpenses.reduce((s, [, v]) => s + v, 0);

  // Build nodes: income sources → "Receita Total" → expense categories → "Poupança"
  const nodes: SankeyNode[] = [];
  const nodeIndex = new Map<string, number>();

  function addNode(name: string): number {
    if (nodeIndex.has(name)) return nodeIndex.get(name)!;
    const idx = nodes.length;
    nodes.push({ name });
    nodeIndex.set(name, idx);
    return idx;
  }

  // Add income source nodes
  const incomeEntries = Array.from(incomeBySource.entries()).sort((a, b) => b[1] - a[1]);
  for (const [source] of incomeEntries) {
    addNode(source);
  }

  // Central node
  const centralIdx = addNode("Receita Total");

  // Expense category nodes
  for (const [cat] of topExpenses) {
    addNode(cat);
  }
  if (otherTotal > 0) {
    addNode("Outros");
  }

  // Surplus node
  const totalIncome = Array.from(incomeBySource.values()).reduce((s, v) => s + v, 0);
  const totalExpenses = Array.from(expenseByCategory.values()).reduce((s, v) => s + v, 0);
  const surplus = totalIncome - totalExpenses;

  if (surplus > 0) {
    addNode("Poupança / Sobra");
  }

  // Build links
  const links: SankeyLink[] = [];

  // Income → Central
  for (const [source, amount] of incomeEntries) {
    links.push({
      source: nodeIndex.get(source)!,
      target: centralIdx,
      value: round2(amount),
    });
  }

  // Central → Expenses
  for (const [cat, amount] of topExpenses) {
    links.push({
      source: centralIdx,
      target: nodeIndex.get(cat)!,
      value: round2(amount),
    });
  }
  if (otherTotal > 0) {
    links.push({
      source: centralIdx,
      target: nodeIndex.get("Outros")!,
      value: round2(otherTotal),
    });
  }

  // Central → Surplus
  if (surplus > 0) {
    links.push({
      source: centralIdx,
      target: nodeIndex.get("Poupança / Sobra")!,
      value: round2(surplus),
    });
  }

  return {
    nodes,
    links,
    totalIncome: round2(totalIncome),
    totalExpenses: round2(totalExpenses),
    surplus: round2(surplus),
  };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
