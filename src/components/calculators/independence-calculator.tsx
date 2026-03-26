"use client";

/**
 * Calculadora de Independência Financeira (Perpetuidade)
 *
 * Capital necessário = Despesa anual / Retorno real anual
 * Gordon Growth: PV = PMT / (r - g) onde g = inflação
 *
 * Ref: CFA-ONIEFY-MAPPING.md §3 Fase 2, financial-math §4.4
 */

import { useState, useMemo } from "react";
import { formatCurrency, formatDecimalBR } from "@/lib/utils";

export function IndependenceCalculator() {
  const [monthlyExpense, setMonthlyExpense] = useState("10000");
  const [nominalReturn, setNominalReturn] = useState("12");
  const [inflation, setInflation] = useState("4.5");
  const [currentSavings, setCurrentSavings] = useState("0");
  const [monthlySaving, setMonthlySaving] = useState("3000");

  const result = useMemo(() => {
    const expense = parseFloat(monthlyExpense) || 0;
    const nominal = parseFloat(nominalReturn) / 100 || 0;
    const infl = parseFloat(inflation) / 100 || 0;
    const savings = parseFloat(currentSavings) || 0;
    const monthly = parseFloat(monthlySaving) || 0;

    if (expense <= 0 || nominal <= infl) return null;

    // Real return: (1 + nominal) / (1 + inflation) - 1
    const realReturn = (1 + nominal) / (1 + infl) - 1;
    const annualExpense = expense * 12;

    // Capital needed (growing perpetuity): PV = annual_expense / real_return
    const capitalNeeded = annualExpense / realReturn;

    // Gap
    const gap = Math.max(0, capitalNeeded - savings);

    // Time to reach (FV of annuity = gap)
    // FV = PMT × [(1+r)^n - 1] / r  → solve for n
    // n = ln(1 + gap × r / PMT) / ln(1 + r)
    const monthlyReal = (1 + realReturn) ** (1 / 12) - 1;
    let monthsToReach = Infinity;
    if (monthly > 0 && monthlyReal > 0) {
      const ratio = 1 + (gap * monthlyReal) / monthly;
      if (ratio > 0) {
        monthsToReach = Math.log(ratio) / Math.log(1 + monthlyReal);
      }
    }

    const yearsToReach = monthsToReach / 12;

    return {
      realReturn: realReturn * 100,
      annualExpense,
      capitalNeeded,
      gap,
      yearsToReach: yearsToReach === Infinity ? null : yearsToReach,
      monthlyPassiveIncome: savings * monthlyReal,
    };
  }, [monthlyExpense, nominalReturn, inflation, currentSavings, monthlySaving]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="calc-fi-expense" className="text-sm font-medium">
            Despesa mensal desejada (R$)
          </label>
          <input
            id="calc-fi-expense"
            type="number"
            value={monthlyExpense}
            onChange={(e) => setMonthlyExpense(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="calc-fi-return" className="text-sm font-medium">
            Retorno nominal (% a.a.)
          </label>
          <input
            id="calc-fi-return"
            type="number"
            step="0.1"
            value={nominalReturn}
            onChange={(e) => setNominalReturn(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="calc-fi-inflation" className="text-sm font-medium">
            Inflação estimada (% a.a.)
          </label>
          <input
            id="calc-fi-inflation"
            type="number"
            step="0.1"
            value={inflation}
            onChange={(e) => setInflation(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="calc-fi-savings" className="text-sm font-medium">
            Patrimônio atual (R$)
          </label>
          <input
            id="calc-fi-savings"
            type="number"
            value={currentSavings}
            onChange={(e) => setCurrentSavings(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <label htmlFor="calc-fi-monthly" className="text-sm font-medium">
            Aporte mensal (R$)
          </label>
          <input
            id="calc-fi-monthly"
            type="number"
            value={monthlySaving}
            onChange={(e) => setMonthlySaving(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {result && (
        <div className="space-y-3 rounded-lg bg-muted/50 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Retorno real</p>
              <p className="text-lg font-semibold font-mono tabular-nums">
                {formatDecimalBR(result.realReturn)}% a.a.
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Despesa anual</p>
              <p className="text-lg font-semibold font-mono tabular-nums">
                {formatCurrency(result.annualExpense)}
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-verdant/10 border border-verdant/20 p-4">
            <p className="text-xs text-muted-foreground">Capital necessário</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-verdant">
              {formatCurrency(result.capitalNeeded)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              = {formatCurrency(result.annualExpense)} / {formatDecimalBR(result.realReturn)}% (perpetuidade)
            </p>
          </div>

          {result.gap > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Falta acumular</p>
                <p className="text-lg font-semibold font-mono tabular-nums">
                  {formatCurrency(result.gap)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tempo estimado</p>
                <p className="text-lg font-semibold font-mono tabular-nums">
                  {result.yearsToReach != null
                    ? `${formatDecimalBR(result.yearsToReach, 1)} anos`
                    : "Defina aporte mensal"}
                </p>
              </div>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
            Premissas: perpetuidade simples (PV = Despesa anual / Retorno real).
            Retorno real = (1 + nominal) / (1 + inflação) - 1. Não considera impostos sobre rendimento.
          </p>
        </div>
      )}
    </div>
  );
}
