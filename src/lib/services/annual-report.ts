/**
 * Oniefy - Annual Report Data Aggregator (E34)
 *
 * Two output formats:
 * (a) PDF formal para consultor/contador
 * (b) Wrapped-style insights ("este fornecedor foi seu sócio: 20% da receita")
 *
 * This module prepares the data. Rendering (PDF/UI) is a separate concern.
 *
 * Ref: docs/FEATURES-ROADMAP-SPEC.md §3 item #14
 */

export interface AnnualTransaction {
  amount: number;
  date: string;
  category_name: string | null;
  description: string | null;
  account_name: string | null;
  type: "income" | "expense" | "transfer";
}

export interface TopItem {
  name: string;
  total: number;
  pctOfTotal: number;
  count: number;
}

export interface MonthlyBreakdown {
  month: string; // YYYY-MM
  income: number;
  expenses: number;
  net: number;
}

export interface WrappedInsight {
  type: "top_merchant" | "category_shift" | "savings_rate" | "biggest_month" | "streak" | "fun_fact";
  title: string;
  description: string;
  value?: number;
}

export interface AnnualReportData {
  year: number;
  /** Summary */
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number; // percentage
  /** Monthly breakdown */
  monthly: MonthlyBreakdown[];
  /** Top categories by spending */
  topExpenseCategories: TopItem[];
  /** Top income sources */
  topIncomeSources: TopItem[];
  /** Top merchants/descriptions by spending */
  topMerchants: TopItem[];
  /** Biggest single expense */
  biggestExpense: { amount: number; description: string; date: string } | null;
  /** Wrapped-style insights */
  insights: WrappedInsight[];
}

/**
 * Build annual report from transaction data.
 */
export function buildAnnualReport(
  transactions: AnnualTransaction[],
  year: number
): AnnualReportData {
  const yearTxs = transactions.filter((t) => t.date.startsWith(String(year)));

  const income = yearTxs.filter((t) => t.type === "income");
  const expenses = yearTxs.filter((t) => t.type === "expense");

  const totalIncome = round2(income.reduce((s, t) => s + t.amount, 0));
  const totalExpenses = round2(expenses.reduce((s, t) => s + Math.abs(t.amount), 0));
  const netSavings = round2(totalIncome - totalExpenses);
  const savingsRate = totalIncome > 0 ? round2((netSavings / totalIncome) * 100) : 0;

  // Monthly breakdown
  const monthly = buildMonthly(yearTxs, year);

  // Top expense categories
  const topExpenseCategories = buildTopItems(
    expenses,
    (t) => t.category_name ?? "Sem categoria",
    totalExpenses
  );

  // Top income sources
  const topIncomeSources = buildTopItems(
    income,
    (t) => t.category_name ?? t.description ?? "Outras receitas",
    totalIncome
  );

  // Top merchants
  const topMerchants = buildTopItems(
    expenses,
    (t) => t.description ?? "Desconhecido",
    totalExpenses
  );

  // Biggest single expense
  const sorted = [...expenses].sort((a, b) => a.amount - b.amount);
  const biggestExpense = sorted.length > 0
    ? { amount: Math.abs(sorted[0].amount), description: sorted[0].description ?? "", date: sorted[0].date }
    : null;

  // Wrapped insights
  const insights = generateInsights(
    totalIncome, totalExpenses, savingsRate, monthly, topMerchants, topExpenseCategories, biggestExpense
  );

  return {
    year,
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    monthly,
    topExpenseCategories,
    topIncomeSources,
    topMerchants,
    biggestExpense,
    insights,
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildMonthly(txs: AnnualTransaction[], year: number): MonthlyBreakdown[] {
  const months: MonthlyBreakdown[] = [];
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, "0")}`;
    const monthTxs = txs.filter((t) => t.date.startsWith(key));
    const inc = monthTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const exp = monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
    months.push({ month: key, income: round2(inc), expenses: round2(exp), net: round2(inc - exp) });
  }
  return months;
}

function buildTopItems(
  txs: AnnualTransaction[],
  keyFn: (t: AnnualTransaction) => string,
  total: number,
  limit = 10
): TopItem[] {
  const map = new Map<string, { sum: number; count: number }>();
  for (const t of txs) {
    const key = keyFn(t);
    const cur = map.get(key) ?? { sum: 0, count: 0 };
    cur.sum += Math.abs(t.amount);
    cur.count++;
    map.set(key, cur);
  }

  return Array.from(map.entries())
    .map(([name, { sum, count }]) => ({
      name,
      total: round2(sum),
      pctOfTotal: total > 0 ? round2((sum / total) * 100) : 0,
      count,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

function generateInsights(
  totalIncome: number,
  totalExpenses: number,
  savingsRate: number,
  monthly: MonthlyBreakdown[],
  topMerchants: TopItem[],
  topCategories: TopItem[],
  biggestExpense: { amount: number; description: string; date: string } | null
): WrappedInsight[] {
  const insights: WrappedInsight[] = [];

  // Top merchant insight
  if (topMerchants.length > 0) {
    const top = topMerchants[0];
    insights.push({
      type: "top_merchant",
      title: `Seu maior parceiro financeiro: ${top.name}`,
      description: `Você gastou R$ ${fmt(top.total)} com ${top.name} (${top.pctOfTotal.toFixed(0)}% das despesas, ${top.count} transações).`,
      value: top.total,
    });
  }

  // Savings rate
  insights.push({
    type: "savings_rate",
    title: savingsRate >= 20 ? "Poupador exemplar!" : savingsRate >= 0 ? "No azul." : "Atenção: saldo negativo.",
    description: savingsRate >= 0
      ? `Você guardou ${savingsRate.toFixed(1)}% da renda (R$ ${fmt(totalIncome - totalExpenses)}).`
      : `Gastos superaram a renda em R$ ${fmt(totalExpenses - totalIncome)}.`,
    value: savingsRate,
  });

  // Biggest month
  const biggestMonth = [...monthly].sort((a, b) => b.expenses - a.expenses)[0];
  if (biggestMonth && biggestMonth.expenses > 0) {
    const monthNames = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const m = parseInt(biggestMonth.month.slice(5), 10);
    insights.push({
      type: "biggest_month",
      title: `${monthNames[m]} foi o mês mais caro`,
      description: `R$ ${fmt(biggestMonth.expenses)} em despesas nesse mês.`,
      value: biggestMonth.expenses,
    });
  }

  // Top category
  if (topCategories.length > 0 && topCategories[0].pctOfTotal >= 20) {
    const top = topCategories[0];
    insights.push({
      type: "category_shift",
      title: `${top.name} dominou seus gastos`,
      description: `${top.pctOfTotal.toFixed(0)}% de tudo que você gastou foi em ${top.name}.`,
    });
  }

  // Biggest single expense
  if (biggestExpense) {
    insights.push({
      type: "fun_fact",
      title: "Maior gasto do ano",
      description: `R$ ${fmt(biggestExpense.amount)} em "${biggestExpense.description}" (${biggestExpense.date}).`,
      value: biggestExpense.amount,
    });
  }

  return insights;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function fmt(v: number): string {
  return Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
