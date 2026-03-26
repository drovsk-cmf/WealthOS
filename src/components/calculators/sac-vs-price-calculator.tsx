"use client";

/**
 * Calculadora SAC vs Price
 *
 * Gera tabela comparativa lado a lado com:
 * - Parcela (decrescente no SAC, constante no Price)
 * - Juros e amortização por período
 * - Total pago e total de juros
 *
 * Ref: FINANCIAL-METHODOLOGY.md §3 Fase 2, financial-math §5
 */

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";

interface AmortRow {
  period: number;
  payment: number;
  interest: number;
  amortization: number;
  outstanding: number;
}

function buildSAC(principal: number, rate: number, periods: number): AmortRow[] {
  const amort = principal / periods;
  const rows: AmortRow[] = [];
  let outstanding = principal;
  for (let t = 1; t <= periods; t++) {
    const interest = outstanding * rate;
    const payment = amort + interest;
    outstanding -= amort;
    rows.push({ period: t, payment, interest, amortization: amort, outstanding: Math.max(0, outstanding) });
  }
  return rows;
}

function buildPrice(principal: number, rate: number, periods: number): AmortRow[] {
  const pmt = principal * (rate * (1 + rate) ** periods) / ((1 + rate) ** periods - 1);
  const rows: AmortRow[] = [];
  let outstanding = principal;
  for (let t = 1; t <= periods; t++) {
    const interest = outstanding * rate;
    const amort = pmt - interest;
    outstanding -= amort;
    rows.push({ period: t, payment: pmt, interest, amortization: amort, outstanding: Math.max(0, outstanding) });
  }
  return rows;
}

export function SacVsPriceCalculator() {
  const [principal, setPrincipal] = useState("300000");
  const [rate, setRate] = useState("1.0");
  const [periods, setPeriods] = useState("360");

  const result = useMemo(() => {
    const P = parseFloat(principal) || 0;
    const r = (parseFloat(rate) || 0) / 100;
    const n = parseInt(periods) || 0;

    if (P <= 0 || r <= 0 || n <= 0) return null;

    const sac = buildSAC(P, r, n);
    const price = buildPrice(P, r, n);

    const sacTotalPaid = sac.reduce((s, row) => s + row.payment, 0);
    const sacTotalInterest = sac.reduce((s, row) => s + row.interest, 0);
    const priceTotalPaid = price.reduce((s, row) => s + row.payment, 0);
    const priceTotalInterest = price.reduce((s, row) => s + row.interest, 0);

    return {
      sac, price,
      sacFirst: sac[0]?.payment ?? 0,
      sacLast: sac[n - 1]?.payment ?? 0,
      pricePayment: price[0]?.payment ?? 0,
      sacTotalPaid, sacTotalInterest,
      priceTotalPaid, priceTotalInterest,
      interestDiff: priceTotalInterest - sacTotalInterest,
    };
  }, [principal, rate, periods]);

  // Show sample rows: first 6 + last 3
  const sampleRows = useMemo(() => {
    if (!result) return [];
    const n = result.sac.length;
    if (n <= 12) return result.sac.map((_, i) => i);
    return [0, 1, 2, 3, 4, 5, -1, n - 3, n - 2, n - 1]; // -1 = separator
  }, [result]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="calc-sp-principal" className="text-sm font-medium">
            Valor financiado (R$)
          </label>
          <input
            id="calc-sp-principal"
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="calc-sp-rate" className="text-sm font-medium">
            Taxa (% a.m.)
          </label>
          <input
            id="calc-sp-rate"
            type="number"
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="calc-sp-periods" className="text-sm font-medium">
            Prazo (meses)
          </label>
          <input
            id="calc-sp-periods"
            type="number"
            value={periods}
            onChange={(e) => setPeriods(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Summary comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <p className="text-sm font-semibold">SAC</p>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Primeira parcela</span>
                  <span className="font-mono tabular-nums">{formatCurrency(result.sacFirst)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última parcela</span>
                  <span className="font-mono tabular-nums">{formatCurrency(result.sacLast)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-muted-foreground">Total de juros</span>
                  <span className="font-mono tabular-nums">{formatCurrency(result.sacTotalInterest)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-muted-foreground">Total pago</span>
                  <span className="font-mono tabular-nums">{formatCurrency(result.sacTotalPaid)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <p className="text-sm font-semibold">Price</p>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parcela fixa</span>
                  <span className="font-mono tabular-nums">{formatCurrency(result.pricePayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">&nbsp;</span>
                  <span>&nbsp;</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-muted-foreground">Total de juros</span>
                  <span className="font-mono tabular-nums">{formatCurrency(result.priceTotalInterest)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-muted-foreground">Total pago</span>
                  <span className="font-mono tabular-nums">{formatCurrency(result.priceTotalPaid)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Difference highlight */}
          <div className="rounded-lg bg-burnished/10 border border-burnished/20 p-3 text-center">
            <p className="text-xs text-muted-foreground">Price paga a mais em juros</p>
            <p className="text-lg font-bold font-mono tabular-nums text-burnished">
              + {formatCurrency(result.interestDiff)}
            </p>
          </div>

          {/* Amortization table sample */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-1.5 text-left font-medium">Mês</th>
                  <th className="py-1.5 text-right font-medium">SAC Parcela</th>
                  <th className="py-1.5 text-right font-medium">SAC Juros</th>
                  <th className="py-1.5 text-right font-medium">Price Parcela</th>
                  <th className="py-1.5 text-right font-medium">Price Juros</th>
                  <th className="py-1.5 text-right font-medium">Saldo SAC</th>
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((idx, i) => {
                  if (idx === -1) {
                    return (
                      <tr key={`sep-${i}`}>
                        <td colSpan={6} className="py-1 text-center text-muted-foreground/40">...</td>
                      </tr>
                    );
                  }
                  const s = result.sac[idx];
                  const p = result.price[idx];
                  return (
                    <tr key={s.period} className="border-b border-border/30">
                      <td className="py-1 font-mono tabular-nums">{s.period}</td>
                      <td className="py-1 text-right font-mono tabular-nums">{formatCurrency(s.payment)}</td>
                      <td className="py-1 text-right font-mono tabular-nums text-muted-foreground">{formatCurrency(s.interest)}</td>
                      <td className="py-1 text-right font-mono tabular-nums">{formatCurrency(p.payment)}</td>
                      <td className="py-1 text-right font-mono tabular-nums text-muted-foreground">{formatCurrency(p.interest)}</td>
                      <td className="py-1 text-right font-mono tabular-nums">{formatCurrency(s.outstanding)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
            SAC: amortização constante (parcelas decrescentes). Price: parcela constante (amortização crescente).
            SAC sempre tem menor custo total de juros. Price oferece previsibilidade no fluxo de caixa.
          </p>
        </div>
      )}
    </div>
  );
}
