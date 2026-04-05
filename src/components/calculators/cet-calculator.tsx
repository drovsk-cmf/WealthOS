"use client";

/**
 * Calculadora de CET (Custo Efetivo Total)
 *
 * Dado: valor liberado, parcela, prazo, taxas
 * Calcula: taxa efetiva mensal e anual (IRR do fluxo de caixa)
 *
 * Ref: FINANCIAL-METHODOLOGY.md §3 Fase 2, financial-math §1.3
 */

import { useState, useMemo } from "react";
import { formatCurrency, formatDecimalBR } from "@/lib/utils";
import { MoneyInput } from "@/components/ui/money-input";

/**
 * Newton-Raphson IRR solver for equal-payment loan.
 * Cash flow: -netReceived at t=0, +payment at t=1..n
 */
function solveIRR(netReceived: number, payment: number, periods: number): number | null {
  if (netReceived <= 0 || payment <= 0 || periods <= 0) return null;

  let r = payment / netReceived / periods; // initial guess
  for (let iter = 0; iter < 200; iter++) {
    const factor = (1 + r) ** periods;
    const pv = payment * (factor - 1) / (r * factor);
    const npv = pv - netReceived;

    // Derivative of PV w.r.t. r (numerical)
    const dr = r * 0.0001 || 0.000001;
    const factor2 = (1 + r + dr) ** periods;
    const pv2 = payment * (factor2 - 1) / ((r + dr) * factor2);
    const dNpv = (pv2 - pv) / dr;

    if (Math.abs(dNpv) < 1e-12) break;

    const rNew = r - npv / dNpv;
    if (Math.abs(rNew - r) < 1e-10) return rNew;
    r = Math.max(rNew, 1e-8); // prevent negative rate
  }
  return r > 0 ? r : null;
}

export function CetCalculator() {
  const [principal, setPrincipal] = useState(50000);
  const [payment, setPayment] = useState(1500);
  const [periods, setPeriods] = useState("48");
  const [registrationFee, setRegistrationFee] = useState(800);
  const [iof, setIof] = useState("1.5");
  const [insuranceMonthly, setInsuranceMonthly] = useState(50);

  const result = useMemo(() => {
    const P = principal;
    const pmt = payment;
    const n = parseInt(periods) || 0;
    const regFee = registrationFee;
    const iofPct = (parseFloat(iof) || 0) / 100;
    const insurance = insuranceMonthly;

    if (P <= 0 || pmt <= 0 || n <= 0) return null;

    // Net amount received = principal - registration fee - IOF
    const iofValue = P * iofPct;
    const netReceived = P - regFee - iofValue;
    if (netReceived <= 0) return null;

    // Total monthly outflow = payment + insurance
    const totalMonthly = pmt + insurance;

    // Nominal rate (without fees): IRR on principal vs payment
    const nominalRate = solveIRR(P, pmt, n);

    // CET: IRR on net received vs total monthly outflow
    const cetRate = solveIRR(netReceived, totalMonthly, n);

    if (!nominalRate || !cetRate) return null;

    const nominalAnnual = ((1 + nominalRate) ** 12 - 1) * 100;
    const cetAnnual = ((1 + cetRate) ** 12 - 1) * 100;

    const totalPaid = totalMonthly * n + regFee + iofValue;
    const totalInterestAndFees = totalPaid - P;

    return {
      netReceived,
      iofValue,
      nominalRate: nominalRate * 100,
      nominalAnnual,
      cetRate: cetRate * 100,
      cetAnnual,
      totalMonthly,
      totalPaid,
      totalInterestAndFees,
      spreadMonthly: (cetRate - nominalRate) * 100,
      spreadAnnual: cetAnnual - nominalAnnual,
    };
  }, [principal, payment, periods, registrationFee, iof, insuranceMonthly]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="calc-cet-principal" className="text-sm font-medium">
            Valor do empréstimo (R$)
          </label>
          <MoneyInput
            id="calc-cet-principal"
            value={principal}
            onChange={setPrincipal}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="calc-cet-payment" className="text-sm font-medium">
            Parcela mensal (R$)
          </label>
          <MoneyInput
            id="calc-cet-payment"
            value={payment}
            onChange={setPayment}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="calc-cet-periods" className="text-sm font-medium">
            Prazo (meses)
          </label>
          <input
            id="calc-cet-periods"
            type="number"
            value={periods}
            onChange={(e) => setPeriods(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="calc-cet-reg" className="text-sm font-medium">
            Taxa de cadastro (R$)
          </label>
          <MoneyInput
            id="calc-cet-reg"
            value={registrationFee}
            onChange={setRegistrationFee}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="calc-cet-iof" className="text-sm font-medium">
            IOF (%)
          </label>
          <input
            id="calc-cet-iof"
            type="number"
            step="0.1"
            value={iof}
            onChange={(e) => setIof(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="calc-cet-insurance" className="text-sm font-medium">
            Seguro mensal (R$)
          </label>
          <MoneyInput
            id="calc-cet-insurance"
            value={insuranceMonthly}
            onChange={setInsuranceMonthly}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {result && (
        <div className="space-y-3 rounded-lg bg-muted/50 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Taxa nominal</p>
              <p className="text-lg font-semibold font-mono tabular-nums">
                {formatDecimalBR(result.nominalRate)}% a.m.
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDecimalBR(result.nominalAnnual)}% a.a.
              </p>
            </div>
            <div className="rounded-lg bg-terracotta/10 border border-terracotta/20 p-3">
              <p className="text-xs text-muted-foreground">CET (custo real)</p>
              <p className="text-lg font-bold font-mono tabular-nums text-terracotta">
                {formatDecimalBR(result.cetRate)}% a.m.
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDecimalBR(result.cetAnnual)}% a.a.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-burnished/10 border border-burnished/20 p-3">
            <p className="text-xs text-muted-foreground">
              Spread CET vs nominal (custo oculto)
            </p>
            <p className="text-base font-semibold font-mono tabular-nums text-burnished">
              +{formatDecimalBR(result.spreadMonthly)} p.p./mês (+{formatDecimalBR(result.spreadAnnual)} p.p./ano)
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Valor líquido recebido</p>
              <p className="font-mono tabular-nums font-medium">{formatCurrency(result.netReceived)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total pago</p>
              <p className="font-mono tabular-nums font-medium">{formatCurrency(result.totalPaid)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Juros + taxas</p>
              <p className="font-mono tabular-nums font-medium">{formatCurrency(result.totalInterestAndFees)}</p>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
            CET = IRR do fluxo: valor líquido recebido (principal - IOF - cadastro) vs parcela total (parcela + seguro).
            O banco anuncia a taxa nominal; o CET revela o custo real incluindo todas as taxas.
          </p>
        </div>
      )}
    </div>
  );
}
