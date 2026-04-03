"use client";

/**
 * Oniefy - Calculadora de Quitação de Dívidas
 *
 * Wires the E37 debt-payoff-planner engine to an interactive UI.
 * Compare snowball vs avalanche strategies side by side.
 */

import { useState, useMemo } from "react";
import { comparePayoffStrategies, type Debt } from "@/lib/services/debt-payoff-planner";
import { formatCurrency } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";
import { Trash2, Plus, TrendingDown, Snowflake } from "lucide-react";

interface DebtInput {
  id: string;
  name: string;
  balance: string;
  rate: string;
  minPayment: string;
}

let nextId = 1;

function emptyDebt(): DebtInput {
  return { id: String(nextId++), name: "", balance: "", rate: "", minPayment: "" };
}

export default function DebtPayoffPage() {
  const [debts, setDebts] = useState<DebtInput[]>([emptyDebt(), emptyDebt()]);
  const [extraPayment, setExtraPayment] = useState("500");

  function addDebt() {
    setDebts((d) => [...d, emptyDebt()]);
  }

  function removeDebt(id: string) {
    setDebts((d) => d.filter((x) => x.id !== id));
  }

  function updateDebt(id: string, field: keyof DebtInput, value: string) {
    setDebts((d) => d.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
  }

  const parsedDebts: Debt[] = useMemo(() => {
    return debts
      .filter((d) => d.name && d.balance && d.rate && d.minPayment)
      .map((d) => ({
        id: d.id,
        name: d.name,
        balance: parseFloat(d.balance.replace(/\./g, "").replace(",", ".")) || 0,
        interestRate: (parseFloat(d.rate.replace(",", ".")) || 0) / 12, // annual → monthly
        minimumPayment: parseFloat(d.minPayment.replace(/\./g, "").replace(",", ".")) || 0,
      }))
      .filter((d) => d.balance > 0 && d.minimumPayment > 0);
  }, [debts]);

  const extra = parseFloat(extraPayment.replace(/\./g, "").replace(",", ".")) || 0;

  const comparison = useMemo(() => {
    if (parsedDebts.length < 1) return null;
    return comparePayoffStrategies(parsedDebts, extra);
  }, [parsedDebts, extra]);

  const totalDebt = parsedDebts.reduce((s, d) => s + d.balance, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quitação de Dívidas</h1>
        <p className="text-sm text-muted-foreground">
          Compare estratégias snowball vs avalanche para eliminar dívidas.
        </p>
      </div>

      {/* Debt inputs */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Suas dívidas</p>
        {debts.map((d, i) => (
          <div key={d.id} className="grid grid-cols-12 gap-2 items-end rounded-lg border bg-card p-3">
            <div className="col-span-12 sm:col-span-3">
              {i === 0 && <label className="text-[10px] text-muted-foreground">Nome</label>}
              <input
                type="text"
                value={d.name}
                onChange={(e) => updateDebt(d.id, "name", e.target.value)}
                placeholder="Ex: Cartão Nubank"
                className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              />
            </div>
            <div className="col-span-4 sm:col-span-3">
              {i === 0 && <label className="text-[10px] text-muted-foreground">Saldo (R$)</label>}
              <input
                type="text"
                inputMode="decimal"
                value={d.balance}
                onChange={(e) => updateDebt(d.id, "balance", e.target.value.replace(/[^\d.,]/g, ""))}
                placeholder="5.000"
                className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              />
            </div>
            <div className="col-span-3 sm:col-span-2">
              {i === 0 && <label className="text-[10px] text-muted-foreground">Taxa a.a. %</label>}
              <input
                type="text"
                inputMode="decimal"
                value={d.rate}
                onChange={(e) => updateDebt(d.id, "rate", e.target.value.replace(/[^\d.,]/g, ""))}
                placeholder="180"
                className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              />
            </div>
            <div className="col-span-4 sm:col-span-3">
              {i === 0 && <label className="text-[10px] text-muted-foreground">Pgto mínimo (R$)</label>}
              <input
                type="text"
                inputMode="decimal"
                value={d.minPayment}
                onChange={(e) => updateDebt(d.id, "minPayment", e.target.value.replace(/[^\d.,]/g, ""))}
                placeholder="200"
                className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              />
            </div>
            <div className="col-span-1 flex justify-end">
              {debts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDebt(d.id)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remover dívida"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addDebt}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <Plus className="h-3 w-3" /> Adicionar dívida
        </button>
      </div>

      {/* Extra payment */}
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <label className="text-sm font-medium">Pagamento extra mensal (R$)</label>
        <input
          type="text"
          inputMode="decimal"
          value={extraPayment}
          onChange={(e) => setExtraPayment(e.target.value.replace(/[^\d.,]/g, ""))}
          placeholder="500"
          className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
        />
        <p className="text-[10px] text-muted-foreground">
          Valor adicional ao mínimo que você pode direcionar para quitar dívidas mais rápido.
        </p>
      </div>

      {/* Summary */}
      {totalDebt > 0 && (
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Dívida total</p>
          <p className="text-2xl font-bold text-terracotta tabular-nums">
            <Mv>{formatCurrency(totalDebt)}</Mv>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {parsedDebts.length} {parsedDebts.length === 1 ? "dívida" : "dívidas"}
          </p>
        </div>
      )}

      {/* Comparison results */}
      {comparison && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Comparação de Estratégias</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Snowball */}
            <div className={`rounded-lg border p-4 space-y-3 ${
              comparison.recommendation === "snowball" ? "border-primary bg-primary/5" : ""
            }`}>
              <div className="flex items-center gap-2">
                <Snowflake className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Snowball</p>
                  <p className="text-[10px] text-muted-foreground">Menor saldo primeiro</p>
                </div>
                {comparison.recommendation === "snowball" && (
                  <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    Recomendado
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Meses</span>
                  <span className="font-medium tabular-nums">{comparison.snowball.totalMonths}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Juros pagos</span>
                  <span className="font-medium tabular-nums text-terracotta">
                    <Mv>{formatCurrency(comparison.snowball.totalInterestPaid)}</Mv>
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total pago</span>
                  <span className="font-medium tabular-nums">
                    <Mv>{formatCurrency(comparison.snowball.totalPaid)}</Mv>
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Quita a menor dívida primeiro. Motivação psicológica: vitórias rápidas.
              </p>
            </div>

            {/* Avalanche */}
            <div className={`rounded-lg border p-4 space-y-3 ${
              comparison.recommendation === "avalanche" ? "border-primary bg-primary/5" : ""
            }`}>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-verdant" />
                <div>
                  <p className="text-sm font-semibold">Avalanche</p>
                  <p className="text-[10px] text-muted-foreground">Maior taxa primeiro</p>
                </div>
                {comparison.recommendation === "avalanche" && (
                  <span className="ml-auto rounded-full bg-verdant/10 px-2 py-0.5 text-[10px] font-medium text-verdant">
                    Recomendado
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Meses</span>
                  <span className="font-medium tabular-nums">{comparison.avalanche.totalMonths}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Juros pagos</span>
                  <span className="font-medium tabular-nums text-terracotta">
                    <Mv>{formatCurrency(comparison.avalanche.totalInterestPaid)}</Mv>
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total pago</span>
                  <span className="font-medium tabular-nums">
                    <Mv>{formatCurrency(comparison.avalanche.totalPaid)}</Mv>
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Quita a maior taxa primeiro. Matematicamente ótimo: paga menos juros.
              </p>
            </div>
          </div>

          {/* Savings comparison */}
          {comparison.interestSavings > 10 && (
            <div className="rounded-lg border border-verdant/30 bg-verdant/5 p-4 text-center">
              <p className="text-xs text-muted-foreground">
                Escolhendo {comparison.recommendation === "avalanche" ? "avalanche" : "snowball"} você economiza
              </p>
              <p className="text-xl font-bold text-verdant tabular-nums">
                <Mv>{formatCurrency(comparison.interestSavings)}</Mv>
              </p>
              <p className="text-xs text-muted-foreground">
                em juros vs a outra estratégia
                {comparison.monthSavings > 0 && ` (${comparison.monthSavings} ${comparison.monthSavings === 1 ? "mês" : "meses"} mais rápido)`}
              </p>
            </div>
          )}

          {/* Payoff order */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Ordem de quitação ({comparison.recommendation === "avalanche" ? "Avalanche" : "Snowball"})
            </p>
            {(() => {
              const plan = comparison.recommendation === "avalanche" ? comparison.avalanche : comparison.snowball;
              return plan.payoffOrder.map((debtId, i) => {
                const debt = parsedDebts.find((d) => d.id === debtId);
                return (
                  <div key={debtId} className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <span>{debt?.name ?? debtId}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {!comparison && parsedDebts.length === 0 && totalDebt === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          Preencha pelo menos uma dívida para ver a comparação.
        </p>
      )}
    </div>
  );
}
