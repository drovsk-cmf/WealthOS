/**
 * Oniefy - Debt Payoff Planner (E37)
 *
 * Calculates optimal strategy to pay off multiple debts.
 * Two methods:
 *   - Snowball: smallest balance first (behavioral momentum)
 *   - Avalanche: highest interest rate first (mathematically optimal)
 *
 * Gap competitivo: Monarch e WalletHub têm. Essencial para Zona 4 (dívidas bancárias).
 */

export interface Debt {
  id: string;
  name: string;
  balance: number; // positive value (how much is owed)
  interestRate: number; // monthly rate as percentage (e.g., 1.99 = 1.99%)
  minimumPayment: number; // minimum monthly payment
}

export type PayoffStrategy = "snowball" | "avalanche";

export interface MonthlySnapshot {
  month: number;
  /** Remaining balance per debt at end of month */
  balances: Record<string, number>;
  /** Payment made per debt this month */
  payments: Record<string, number>;
  /** Interest charged per debt this month */
  interest: Record<string, number>;
  /** Total payment this month */
  totalPayment: number;
  /** Total remaining balance */
  totalBalance: number;
  /** Debt paid off this month (if any) */
  debtPaidOff: string | null;
}

export interface PayoffPlan {
  strategy: PayoffStrategy;
  debts: Debt[];
  monthlyBudget: number;
  /** Order in which debts are targeted */
  payoffOrder: string[];
  /** Month-by-month breakdown */
  timeline: MonthlySnapshot[];
  /** Total months to become debt-free */
  totalMonths: number;
  /** Total interest paid across all debts */
  totalInterestPaid: number;
  /** Total amount paid (principal + interest) */
  totalPaid: number;
  /** Original total debt */
  originalDebt: number;
  /** Estimated payoff date */
  payoffDate: string; // ISO date
}

export interface PayoffComparison {
  snowball: PayoffPlan;
  avalanche: PayoffPlan;
  /** Interest savings of avalanche over snowball */
  interestSavings: number;
  /** Month savings of avalanche over snowball */
  monthSavings: number;
  /** Recommended strategy with reasoning */
  recommendation: PayoffStrategy;
  recommendationReason: string;
}

const MAX_MONTHS = 360; // 30 years safety cap

/**
 * Calculate a debt payoff plan using the specified strategy.
 *
 * @param debts - List of debts
 * @param monthlyBudget - Total monthly amount available for debt payments
 * @param strategy - "snowball" (smallest balance first) or "avalanche" (highest rate first)
 */
export function calculatePayoffPlan(
  debts: Debt[],
  monthlyBudget: number,
  strategy: PayoffStrategy
): PayoffPlan {
  if (debts.length === 0) {
    return emptyPlan(strategy, monthlyBudget);
  }

  // Validate budget covers minimums
  const totalMinimum = debts.reduce((s, d) => s + d.minimumPayment, 0);
  const effectiveBudget = Math.max(monthlyBudget, totalMinimum);

  // Sort by strategy
  const sorted = [...debts].sort((a, b) => {
    if (strategy === "snowball") return a.balance - b.balance; // smallest first
    return b.interestRate - a.interestRate; // highest rate first
  });

  const payoffOrder = sorted.map((d) => d.id);

  // Simulate month by month
  const balances: Record<string, number> = {};
  for (const d of debts) balances[d.id] = d.balance;

  const timeline: MonthlySnapshot[] = [];
  let totalInterestPaid = 0;
  let totalPaid = 0;
  const originalDebt = debts.reduce((s, d) => s + d.balance, 0);

  for (let month = 1; month <= MAX_MONTHS; month++) {
    const totalRemaining = Object.values(balances).reduce((s, v) => s + v, 0);
    if (totalRemaining <= 0.01) break;

    const monthPayments: Record<string, number> = {};
    const monthInterest: Record<string, number> = {};
    let debtPaidOff: string | null = null;

    // Step 1: Apply interest to all active debts
    for (const d of debts) {
      if (balances[d.id] <= 0.01) continue;
      const interest = round2(balances[d.id] * (d.interestRate / 100));
      balances[d.id] += interest;
      monthInterest[d.id] = interest;
      totalInterestPaid += interest;
    }

    // Step 2: Pay minimums first
    let budgetLeft = effectiveBudget;
    for (const d of debts) {
      if (balances[d.id] <= 0.01) {
        monthPayments[d.id] = 0;
        continue;
      }
      const payment = Math.min(d.minimumPayment, balances[d.id], budgetLeft);
      balances[d.id] = round2(balances[d.id] - payment);
      monthPayments[d.id] = payment;
      budgetLeft -= payment;
      totalPaid += payment;

      if (balances[d.id] <= 0.01) {
        balances[d.id] = 0;
        debtPaidOff = d.id;
      }
    }

    // Step 3: Apply extra to target debt (strategy order)
    for (const targetId of payoffOrder) {
      if (budgetLeft <= 0.01) break;
      if (balances[targetId] <= 0.01) continue;

      const extra = Math.min(budgetLeft, balances[targetId]);
      balances[targetId] = round2(balances[targetId] - extra);
      monthPayments[targetId] = round2((monthPayments[targetId] ?? 0) + extra);
      budgetLeft -= extra;
      totalPaid += extra;

      if (balances[targetId] <= 0.01) {
        balances[targetId] = 0;
        debtPaidOff = targetId;
      }
    }

    const totalBalance = Object.values(balances).reduce((s, v) => s + v, 0);
    const totalPayment = Object.values(monthPayments).reduce((s, v) => s + v, 0);

    timeline.push({
      month,
      balances: { ...balances },
      payments: monthPayments,
      interest: monthInterest,
      totalPayment: round2(totalPayment),
      totalBalance: round2(totalBalance),
      debtPaidOff,
    });

    if (totalBalance <= 0.01) break;
  }

  const totalMonths = timeline.length;
  const now = new Date();
  const payoffDate = new Date(
    now.getFullYear(),
    now.getMonth() + totalMonths,
    1
  ).toISOString().slice(0, 10);

  return {
    strategy,
    debts,
    monthlyBudget: effectiveBudget,
    payoffOrder,
    timeline,
    totalMonths,
    totalInterestPaid: round2(totalInterestPaid),
    totalPaid: round2(totalPaid),
    originalDebt: round2(originalDebt),
    payoffDate,
  };
}

/**
 * Compare snowball vs avalanche strategies.
 * Returns both plans + recommendation.
 */
export function comparePayoffStrategies(
  debts: Debt[],
  monthlyBudget: number
): PayoffComparison {
  const snowball = calculatePayoffPlan(debts, monthlyBudget, "snowball");
  const avalanche = calculatePayoffPlan(debts, monthlyBudget, "avalanche");

  const interestSavings = round2(
    snowball.totalInterestPaid - avalanche.totalInterestPaid
  );
  const monthSavings = snowball.totalMonths - avalanche.totalMonths;

  // Recommend based on savings magnitude
  let recommendation: PayoffStrategy;
  let recommendationReason: string;

  if (interestSavings <= 50 && monthSavings <= 1) {
    // Negligible difference: recommend snowball for behavioral benefits
    recommendation = "snowball";
    recommendationReason =
      "A diferença entre os métodos é insignificante. " +
      "O método Snowball (menor saldo primeiro) oferece vitórias rápidas que mantêm a motivação.";
  } else if (interestSavings > 500) {
    recommendation = "avalanche";
    recommendationReason =
      `O método Avalanche economiza R$ ${interestSavings.toFixed(2).replace(".", ",")} em juros ` +
      `e quita ${monthSavings} ${monthSavings === 1 ? "mês" : "meses"} antes. ` +
      "Matematicamente superior neste cenário.";
  } else {
    recommendation = "avalanche";
    recommendationReason =
      `O método Avalanche economiza R$ ${interestSavings.toFixed(2).replace(".", ",")} em juros. ` +
      "Se motivação for um fator, o Snowball pode ser melhor apesar do custo extra.";
  }

  return {
    snowball,
    avalanche,
    interestSavings,
    monthSavings,
    recommendation,
    recommendationReason,
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function emptyPlan(strategy: PayoffStrategy, budget: number): PayoffPlan {
  return {
    strategy,
    debts: [],
    monthlyBudget: budget,
    payoffOrder: [],
    timeline: [],
    totalMonths: 0,
    totalInterestPaid: 0,
    totalPaid: 0,
    originalDebt: 0,
    payoffDate: new Date().toISOString().slice(0, 10),
  };
}
