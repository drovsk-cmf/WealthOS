"use client";

/**
 * Fluxo de Caixa - FIX #14
 *
 * Visão consolidada de entradas e saídas por período (dia, mês, ano).
 * Mostra saldo acumulado e variação por período.
 */

import { useState, useMemo } from "react";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { formatCurrency } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";
import { TrendingUp, ArrowRight, GitFork } from "lucide-react";
import { SankeyFlowChart } from "@/components/charts/sankey-flow-chart";
import { AnnualComparisonCard } from "@/components/charts/annual-comparison-card";
import type { TransactionForSankey } from "@/lib/services/sankey-data";

type Granularity = "daily" | "monthly" | "yearly";

interface PeriodRow {
  key: string;
  label: string;
  income: number;
  expense: number;
  net: number;
  runningBalance: number;
  txCount: number;
}

function formatPeriodLabel(key: string, gran: Granularity): string {
  if (gran === "yearly") return key;
  if (gran === "monthly") {
    const [y, m] = key.split("-");
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${months[parseInt(m, 10) - 1]} ${y}`;
  }
  // daily
  const [y, m, d] = key.split("-");
  const dow = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${dow[dt.getDay()]}, ${d}/${months[parseInt(m, 10) - 1]}/${y}`;
}

function getPeriodKey(dateStr: string, gran: Granularity): string {
  // dateStr = "YYYY-MM-DD"
  if (gran === "yearly") return dateStr.slice(0, 4);
  if (gran === "monthly") return dateStr.slice(0, 7);
  return dateStr;
}

export default function CashFlowPage() {
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [showCount, setShowCount] = useState(24);
  const [showSankey, setShowSankey] = useState(false);

  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { data: accounts } = useAccounts();

  const rows = useMemo<PeriodRow[]>(() => {
    if (!transactions) return [];

    // Filter
    let filtered = transactions.filter((t) => !t.is_deleted);
    if (accountFilter !== "all") {
      filtered = filtered.filter((t) => t.account_id === accountFilter);
    }

    // Group by period
    const groups = new Map<string, { income: number; expense: number; count: number }>();
    for (const tx of filtered) {
      const key = getPeriodKey(tx.date, granularity);
      const existing = groups.get(key) || { income: 0, expense: 0, count: 0 };
      if (tx.type === "income") {
        existing.income += Number(tx.amount);
      } else if (tx.type === "expense") {
        existing.expense += Number(tx.amount);
      }
      existing.count++;
      groups.set(key, existing);
    }

    // Sort chronologically and compute running balance
    const sorted = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    let running = 0;
    return sorted.map(([key, data]) => {
      const net = data.income - data.expense;
      running += net;
      return {
        key,
        label: formatPeriodLabel(key, granularity),
        income: data.income,
        expense: data.expense,
        net,
        runningBalance: running,
        txCount: data.count,
      };
    });
  }, [transactions, granularity, accountFilter]);

  // Show latest first
  const displayRows = useMemo(() => {
    return [...rows].reverse().slice(0, showCount);
  }, [rows, showCount]);

  // Totals for visible range
  const totals = useMemo(() => {
    return displayRows.reduce(
      (acc, r) => ({ income: acc.income + r.income, expense: acc.expense + r.expense, net: acc.net + r.net }),
      { income: 0, expense: 0, net: 0 }
    );
  }, [displayRows]);

  // Sankey data (E41) — transform current transactions for flow diagram
  const sankeyTxs: TransactionForSankey[] = useMemo(() => {
    if (!transactions) return [];
    return transactions
      .filter((t) => t.type === "income" || t.type === "expense")
      .filter((t) => accountFilter === "all" || t.account_id === accountFilter)
      .map((t) => ({
        amount: t.amount,
        category_name: t.category_name ?? null,
        description: t.description,
        type: t.type as "income" | "expense",
      }));
  }, [transactions, accountFilter]);

  if (txLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Fluxo de Caixa</h1>
        <div className="flex gap-2">
          {/* Granularity */}
          <div className="flex rounded-lg border bg-muted/50 p-0.5">
            {([
              { key: "daily" as Granularity, label: "Dia" },
              { key: "monthly" as Granularity, label: "Mês" },
              { key: "yearly" as Granularity, label: "Ano" },
            ]).map((opt) => (
              <button key={opt.key} type="button"
                onClick={() => { setGranularity(opt.key); setShowCount(opt.key === "daily" ? 60 : opt.key === "monthly" ? 24 : 10); }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  granularity === opt.key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Account filter */}
          <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}
            aria-label="Filtrar por conta"
            className="h-9 rounded-md border border-input bg-background px-2 text-xs">
            <option value="all">Todas as contas</option>
            {accounts?.filter((a) => a.is_active).map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sankey toggle (E41) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowSankey((v) => !v)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            showSankey
              ? "bg-primary text-primary-foreground"
              : "border bg-card text-muted-foreground hover:bg-accent"
          }`}
        >
          <GitFork className="h-3.5 w-3.5" />
          Diagrama de fluxo
        </button>
      </div>

      {/* Sankey chart (E41) */}
      {showSankey && (
        <div className="rounded-lg border bg-card p-4">
          <p className="mb-2 text-sm font-medium">Para onde vai seu dinheiro</p>
          <SankeyFlowChart transactions={sankeyTxs} height={350} />
        </div>
      )}

      {/* Annual comparison (E32) */}
      {granularity === "monthly" && transactions && transactions.length > 0 && (
        <AnnualComparisonCard
          transactions={transactions
            .filter((t) => t.type === "income" || t.type === "expense")
            .filter((t) => accountFilter === "all" || t.account_id === accountFilter)
            .map((t) => ({ amount: t.amount, date: t.date }))}
        />
      )}

      {/* Summary cards */}
      {displayRows.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Entradas (período visível)</p>
            <p className="mt-1 text-xl font-semibold text-verdant">
              <Mv>+{formatCurrency(totals.income)}</Mv>
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Saídas (período visível)</p>
            <p className="mt-1 text-xl font-semibold text-terracotta">
              <Mv>-{formatCurrency(totals.expense)}</Mv>
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Resultado líquido</p>
            <p className={`mt-1 text-xl font-semibold ${totals.net >= 0 ? "text-verdant" : "text-terracotta"}`}>
              <Mv>{totals.net >= 0 ? "+" : ""}{formatCurrency(totals.net)}</Mv>
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <TrendingUp className="mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Sem dados de fluxo de caixa</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Importe extratos ou cadastre transações para visualizar seu fluxo de caixa ao longo do tempo.
          </p>
        </div>
      )}

      {/* Timeline */}
      {displayRows.length > 0 && (
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground">
            <div className="col-span-4">Período</div>
            <div className="col-span-2 text-right">Entradas</div>
            <div className="col-span-2 text-right">Saídas</div>
            <div className="col-span-2 text-right">Líquido</div>
            <div className="col-span-2 text-right">Acumulado</div>
          </div>

          {displayRows.map((row) => (
            <div key={row.key}
              className="grid grid-cols-12 items-center gap-2 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/50">
              <div className="col-span-4">
                <p className="text-sm font-medium">{row.label}</p>
                <p className="text-xs text-muted-foreground">{row.txCount} transações</p>
              </div>
              <div className="col-span-2 text-right">
                <p className="text-sm tabular-nums text-verdant">
                  <Mv>+{formatCurrency(row.income)}</Mv>
                </p>
              </div>
              <div className="col-span-2 text-right">
                <p className="text-sm tabular-nums text-terracotta">
                  <Mv>-{formatCurrency(row.expense)}</Mv>
                </p>
              </div>
              <div className="col-span-2 text-right">
                <p className={`text-sm font-medium tabular-nums ${row.net >= 0 ? "text-verdant" : "text-terracotta"}`}>
                  <Mv>{row.net >= 0 ? "+" : ""}{formatCurrency(row.net)}</Mv>
                </p>
              </div>
              <div className="col-span-2 text-right">
                <p className={`text-sm tabular-nums ${row.runningBalance >= 0 ? "" : "text-terracotta"}`}>
                  <Mv>{formatCurrency(row.runningBalance)}</Mv>
                </p>
              </div>
            </div>
          ))}

          {/* Load more */}
          {showCount < rows.length && (
            <button type="button" onClick={() => setShowCount((c) => c + (granularity === "daily" ? 60 : 24))}
              className="flex w-full items-center justify-center gap-2 rounded-lg border bg-card py-3 text-sm text-muted-foreground hover:bg-accent/50">
              Carregar mais períodos ({rows.length - showCount} restantes)
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
