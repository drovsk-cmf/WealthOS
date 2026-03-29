"use client";

/**
 * Calculadora Comprar vs Alugar (NPV)
 *
 * Compara o custo total de comprar (entrada + financiamento + custos incorridos)
 * com alugar (aluguel + investir a diferença).
 *
 * Ref: FINANCIAL-METHODOLOGY.md §3 Fase 2, financial-math §1.2
 */

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";

export function BuyVsRentCalculator() {
  // Buy inputs
  const [propertyValue, setPropertyValue] = useState("500000");
  const [downPaymentPct, setDownPaymentPct] = useState("20");
  const [financingRate, setFinancingRate] = useState("0.95");
  const [financingTerm, setFinancingTerm] = useState("360");
  const [condoFee, setCondoFee] = useState("800");
  const [iptuMonthly, setIptuMonthly] = useState("300");
  const [maintenancePct, setMaintenancePct] = useState("1");
  const [appreciation, setAppreciation] = useState("3");

  // Rent inputs
  const [monthlyRent, setMonthlyRent] = useState("2500");
  const [rentAdjustment, setRentAdjustment] = useState("5");

  // Common
  const [horizon, setHorizon] = useState("120");
  const [opportunityCost, setOpportunityCost] = useState("1.0");

  const result = useMemo(() => {
    const value = parseFloat(propertyValue) || 0;
    const downPct = (parseFloat(downPaymentPct) || 0) / 100;
    const fRate = (parseFloat(financingRate) || 0) / 100;
    const fTerm = parseInt(financingTerm) || 0;
    const condo = parseFloat(condoFee) || 0;
    const iptu = parseFloat(iptuMonthly) || 0;
    const maintPct = (parseFloat(maintenancePct) || 0) / 100;
    const apprAnnual = (parseFloat(appreciation) || 0) / 100;
    const rent = parseFloat(monthlyRent) || 0;
    const rentAdj = (parseFloat(rentAdjustment) || 0) / 100;
    const months = parseInt(horizon) || 0;
    const oppRate = (parseFloat(opportunityCost) || 0) / 100;

    if (value <= 0 || months <= 0) return null;

    const downPayment = value * downPct;
    const financed = value - downPayment;
    const monthlyMaint = value * maintPct / 12;
    const apprMonthly = (1 + apprAnnual) ** (1 / 12) - 1;
    // Financing payment (Price)
    let fPayment = 0;
    if (financed > 0 && fRate > 0 && fTerm > 0) {
      fPayment = financed * (fRate * (1 + fRate) ** fTerm) / ((1 + fRate) ** fTerm - 1);
    }

    // Build month-by-month comparison
    let buyCumulative = downPayment; // upfront cost
    let rentCumulative = 0;
    let rentInvestBalance = downPayment; // renter invests the down payment
    let currentPropertyValue = value;
    let currentRent = rent;

    for (let t = 1; t <= months; t++) {
      // Buy costs
      const buyMonthly = (t <= fTerm ? fPayment : 0) + condo + iptu + monthlyMaint;
      buyCumulative += buyMonthly;

      // Property appreciates
      currentPropertyValue *= (1 + apprMonthly);

      // Rent costs
      if (t > 1 && t % 12 === 1) currentRent *= (1 + rentAdj); // annual adjustment
      rentCumulative += currentRent;

      // Renter invests the difference
      const rentSaving = buyMonthly - currentRent;
      rentInvestBalance = rentInvestBalance * (1 + oppRate) + (rentSaving > 0 ? rentSaving : 0);
    }

    // Net position at end of horizon
    // Buyer: property value - remaining debt
    const fRemaining = fTerm > months
      ? financed * ((1 + fRate) ** fTerm - (1 + fRate) ** months) / ((1 + fRate) ** fTerm - 1)
      : 0;
    const buyNetWealth = currentPropertyValue - fRemaining;

    // Renter: investment balance
    const rentNetWealth = rentInvestBalance;

    const buyAdvantage = buyNetWealth - rentNetWealth;

    return {
      downPayment,
      financed,
      fPayment,
      buyCumulative,
      rentCumulative,
      currentPropertyValue,
      buyNetWealth,
      rentNetWealth,
      buyAdvantage,
      monthlyBuyCost: (buyCumulative) / months,
      decision: buyAdvantage > 0 ? "comprar" : "alugar",
    };
  }, [propertyValue, downPaymentPct, financingRate, financingTerm, condoFee,
    iptuMonthly, maintenancePct, appreciation, monthlyRent, rentAdjustment,
    horizon, opportunityCost]);

  return (
    <div className="space-y-5">
      {/* Buy section */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Comprar</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="calc-bvr-value" className="text-xs font-medium">Valor do imóvel (R$)</label>
            <input id="calc-bvr-value" type="number" value={propertyValue} onChange={(e) => setPropertyValue(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="space-y-1">
            <label htmlFor="calc-bvr-down" className="text-xs font-medium">Entrada (%)</label>
            <input id="calc-bvr-down" type="number" step="1" value={downPaymentPct} onChange={(e) => setDownPaymentPct(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="space-y-1">
            <label htmlFor="calc-bvr-frate" className="text-xs font-medium">Taxa financiamento (% a.m.)</label>
            <input id="calc-bvr-frate" type="number" step="0.01" value={financingRate} onChange={(e) => setFinancingRate(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="space-y-1">
            <label htmlFor="calc-bvr-fterm" className="text-xs font-medium">Prazo financiamento (meses)</label>
            <input id="calc-bvr-fterm" type="number" value={financingTerm} onChange={(e) => setFinancingTerm(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="space-y-1">
            <label htmlFor="calc-bvr-condo" className="text-xs font-medium">Condomínio (R$/mês)</label>
            <input id="calc-bvr-condo" type="number" value={condoFee} onChange={(e) => setCondoFee(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="space-y-1">
            <label htmlFor="calc-bvr-iptu" className="text-xs font-medium">IPTU (R$/mês)</label>
            <input id="calc-bvr-iptu" type="number" value={iptuMonthly} onChange={(e) => setIptuMonthly(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="space-y-1">
            <label htmlFor="calc-bvr-maint" className="text-xs font-medium">Manutenção (% a.a. do valor)</label>
            <input id="calc-bvr-maint" type="number" step="0.1" value={maintenancePct} onChange={(e) => setMaintenancePct(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="space-y-1">
            <label htmlFor="calc-bvr-appr" className="text-xs font-medium">Valorização (% a.a.)</label>
            <input id="calc-bvr-appr" type="number" step="0.1" value={appreciation} onChange={(e) => setAppreciation(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
        </div>
      </div>

      {/* Rent section */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Alugar</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label htmlFor="calc-bvr-rent" className="text-xs font-medium">Aluguel (R$/mês)</label>
            <input id="calc-bvr-rent" type="number" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="space-y-1">
            <label htmlFor="calc-bvr-rentadj" className="text-xs font-medium">Reajuste anual (%)</label>
            <input id="calc-bvr-rentadj" type="number" step="0.1" value={rentAdjustment} onChange={(e) => setRentAdjustment(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="space-y-1">
            <label htmlFor="calc-bvr-opp" className="text-xs font-medium">Custo oportunidade (% a.m.)</label>
            <input id="calc-bvr-opp" type="number" step="0.01" value={opportunityCost} onChange={(e) => setOpportunityCost(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
        </div>
      </div>

      {/* Horizon */}
      <div className="space-y-1">
        <label htmlFor="calc-bvr-horizon" className="text-xs font-medium">Horizonte de análise (meses)</label>
        <input id="calc-bvr-horizon" type="number" value={horizon} onChange={(e) => setHorizon(e.target.value)}
          className="flex h-9 w-48 rounded-md border border-input bg-background px-3 py-1 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-3 rounded-lg bg-muted/50 p-4">
          <div className={`rounded-lg p-4 text-center border ${
            result.decision === "comprar"
              ? "bg-verdant/10 border-verdant/20"
              : "bg-burnished/10 border-burnished/20"
          }`}>
            <p className="text-xs text-muted-foreground">
              Em {parseInt(horizon) / 12 | 0} anos, melhor opção:
            </p>
            <p className={`text-xl font-bold ${
              result.decision === "comprar" ? "text-verdant" : "text-burnished"
            }`}>
              {result.decision === "comprar" ? "Comprar" : "Alugar"}
            </p>
            <p className="text-sm font-mono tabular-nums text-muted-foreground">
              Vantagem de {formatCurrency(Math.abs(result.buyAdvantage))}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
              <p className="text-sm font-semibold">Comprar</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entrada</span>
                <span className="font-mono tabular-nums">{formatCurrency(result.downPayment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parcela financiamento</span>
                <span className="font-mono tabular-nums">{formatCurrency(result.fPayment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Desembolso total</span>
                <span className="font-mono tabular-nums">{formatCurrency(result.buyCumulative)}</span>
              </div>
              <div className="flex justify-between font-medium pt-1 border-t border-border/50">
                <span className="text-muted-foreground">Patrimônio líquido</span>
                <span className="font-mono tabular-nums text-verdant">{formatCurrency(result.buyNetWealth)}</span>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
              <p className="text-sm font-semibold">Alugar + investir</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total aluguel pago</span>
                <span className="font-mono tabular-nums">{formatCurrency(result.rentCumulative)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Imóvel ao final</span>
                <span className="font-mono tabular-nums">{formatCurrency(result.currentPropertyValue)}</span>
              </div>
              <div className="flex justify-between">&nbsp;<span>&nbsp;</span></div>
              <div className="flex justify-between font-medium pt-1 border-t border-border/50">
                <span className="text-muted-foreground">Patrimônio líquido</span>
                <span className="font-mono tabular-nums text-verdant">{formatCurrency(result.rentNetWealth)}</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
            Compra: entrada + financiamento (Price) + condomínio + IPTU + manutenção. Patrimônio = valor do imóvel valorizado - saldo devedor.
            Aluguel: aluguel com reajuste anual. Patrimônio = entrada investida a custo de oportunidade + diferença mensal investida.
            Não inclui ITBI, escritura, corretagem, IR sobre ganho de capital ou rendimento.
          </p>
        </div>
      )}
    </div>
  );
}
