/**
 * Oniefy - DARF Investment Motor (E44)
 *
 * Calculates monthly DARF obligations from investment operations.
 * Handles: stock trades, FIIs, crypto, loss carryforward.
 *
 * Key rules:
 * - Stocks (common): 15% on net gain. Exempt if total sales <= R$ 20k/month.
 * - Stocks (day trade): 20% on net gain. No exemption.
 * - FIIs: 20% on capital gain. Dividends exempt.
 * - Crypto: progressive (15-22.5%). Exempt if total sales <= R$ 35k/month.
 * - Losses from one month can offset gains in future months (same type only).
 *
 * DARF due date: last business day of month following the operation.
 *
 * Ref: docs/TAX-ENGINE-SPEC.md §5.4
 */

export interface InvestmentOperation {
  id: string;
  date: string; // ISO date
  type: "stock" | "stock_daytrade" | "fii" | "crypto";
  ticker?: string;
  /** Sale amount (gross proceeds) */
  saleAmount: number;
  /** Purchase cost (total cost basis) */
  costBasis: number;
  /** Transaction costs (brokerage, fees) */
  costs: number;
}

export interface MonthlyDARF {
  month: string; // YYYY-MM
  /** Due date for DARF payment (last biz day of following month) */
  dueDate: string;
  /** Breakdown by type */
  byType: {
    type: InvestmentOperation["type"];
    totalSales: number;
    totalCost: number;
    totalCosts: number;
    grossGain: number;
    lossOffset: number;
    netGain: number;
    isExempt: boolean;
    exemptionReason?: string;
    rate: number;
    tax: number;
    darfCode: string;
  }[];
  /** Total tax due this month */
  totalTax: number;
  /** Whether any DARF is required */
  hasDARF: boolean;
}

export interface LossCarryforward {
  stock: number;
  stock_daytrade: number;
  fii: number;
  crypto: number;
}

export interface DARFResult {
  months: MonthlyDARF[];
  /** Accumulated losses available for offset */
  lossCarryforward: LossCarryforward;
  /** Total tax paid across all months */
  totalTaxPaid: number;
  /** Total gains realized */
  totalGains: number;
  /** Total losses realized */
  totalLosses: number;
}

const RATES: Record<string, number> = {
  stock: 15,
  stock_daytrade: 20,
  fii: 20,
  crypto: 15, // simplified; progressive for large gains
};

const DARF_CODES: Record<string, string> = {
  stock: "6015",
  stock_daytrade: "8468",
  fii: "6015",
  crypto: "4600",
};

const EXEMPTIONS: Record<string, number> = {
  stock: 20000,
  crypto: 35000,
};

/**
 * Calculate monthly DARF obligations from a list of operations.
 * Operations should span the analysis period (typically 1 year).
 *
 * @param operations - Investment buy/sell operations
 * @param initialLosses - Losses carried forward from previous period
 */
export function calculateMonthlyDARFs(
  operations: InvestmentOperation[],
  initialLosses: LossCarryforward = { stock: 0, stock_daytrade: 0, fii: 0, crypto: 0 }
): DARFResult {
  // Group operations by month
  const byMonth = new Map<string, InvestmentOperation[]>();
  for (const op of operations) {
    const month = op.date.slice(0, 7);
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(op);
  }

  // Sort months chronologically
  const sortedMonths = Array.from(byMonth.keys()).sort();

  const losses: LossCarryforward = { ...initialLosses };
  const months: MonthlyDARF[] = [];
  let totalTaxPaid = 0;
  let totalGains = 0;
  let totalLosses = 0;

  for (const month of sortedMonths) {
    const ops = byMonth.get(month)!;

    // Group by type within month
    const typeGroups = new Map<string, InvestmentOperation[]>();
    for (const op of ops) {
      if (!typeGroups.has(op.type)) typeGroups.set(op.type, []);
      typeGroups.get(op.type)!.push(op);
    }

    const byType: MonthlyDARF["byType"] = [];
    let monthTax = 0;

    for (const [type, typeOps] of typeGroups) {
      const totalSales = typeOps.reduce((s, o) => s + o.saleAmount, 0);
      const totalCost = typeOps.reduce((s, o) => s + o.costBasis, 0);
      const totalCosts = typeOps.reduce((s, o) => s + o.costs, 0);
      const grossGain = round2(totalSales - totalCost - totalCosts);

      // Check exemption
      const exemptionLimit = EXEMPTIONS[type];
      const isExempt = !!exemptionLimit && totalSales <= exemptionLimit && type !== "stock_daytrade";

      if (isExempt) {
        // Even if exempt, track gains/losses
        if (grossGain > 0) totalGains += grossGain;
        else totalLosses += Math.abs(grossGain);

        byType.push({
          type: type as InvestmentOperation["type"],
          totalSales: round2(totalSales),
          totalCost: round2(totalCost),
          totalCosts: round2(totalCosts),
          grossGain,
          lossOffset: 0,
          netGain: 0,
          isExempt: true,
          exemptionReason: `Vendas (R$ ${totalSales.toFixed(2)}) abaixo da isenção de R$ ${exemptionLimit.toFixed(2)}`,
          rate: 0,
          tax: 0,
          darfCode: DARF_CODES[type] ?? "6015",
        });
        continue;
      }

      // Apply loss carryforward (same type only)
      const lossKey = type as keyof LossCarryforward;
      let lossOffset = 0;
      let netGain = grossGain;

      if (grossGain > 0 && losses[lossKey] > 0) {
        lossOffset = Math.min(losses[lossKey], grossGain);
        losses[lossKey] = round2(losses[lossKey] - lossOffset);
        netGain = round2(grossGain - lossOffset);
      } else if (grossGain < 0) {
        // Accumulate loss for future offset
        losses[lossKey] = round2(losses[lossKey] + Math.abs(grossGain));
        netGain = 0;
        totalLosses += Math.abs(grossGain);
      }

      if (grossGain > 0) totalGains += grossGain;

      const rate = RATES[type] ?? 15;
      const tax = netGain > 0 ? round2(netGain * (rate / 100)) : 0;
      monthTax += tax;

      byType.push({
        type: type as InvestmentOperation["type"],
        totalSales: round2(totalSales),
        totalCost: round2(totalCost),
        totalCosts: round2(totalCosts),
        grossGain,
        lossOffset: round2(lossOffset),
        netGain: round2(netGain),
        isExempt: false,
        rate,
        tax,
        darfCode: DARF_CODES[type] ?? "6015",
      });
    }

    // Due date: last business day of following month
    const [y, m] = month.split("-").map(Number);
    const dueDate = getLastBusinessDay(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1);

    totalTaxPaid += monthTax;

    months.push({
      month,
      dueDate,
      byType,
      totalTax: round2(monthTax),
      hasDARF: monthTax > 0,
    });
  }

  return {
    months,
    lossCarryforward: losses,
    totalTaxPaid: round2(totalTaxPaid),
    totalGains: round2(totalGains),
    totalLosses: round2(totalLosses),
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getLastBusinessDay(year: number, month: number): string {
  const lastDay = new Date(year, month, 0);
  while (lastDay.getDay() === 0 || lastDay.getDay() === 6) {
    lastDay.setDate(lastDay.getDate() - 1);
  }
  return lastDay.toISOString().slice(0, 10);
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
