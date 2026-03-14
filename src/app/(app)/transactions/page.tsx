"use client";

import { useState, useCallback } from "react";
import { ArrowLeftRight, ArrowUpRight, ArrowDownRight, Repeat } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useReverseTransaction } from "@/lib/services/transaction-engine";
import { useAutoReset } from "@/lib/hooks/use-dialog-helpers";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TransactionFilters, TransactionWithRelations } from "@/lib/hooks/use-transactions";
import type { Database } from "@/types/database";

const PAGE_SIZE = 50;

type TransactionType = Database["public"]["Enums"]["transaction_type"];

const TYPE_BADGES: Record<TransactionType, { label: string; class: string; Icon: LucideIcon }> = {
  income: { label: "Receita", class: "bg-verdant/15 text-verdant", Icon: ArrowUpRight },
  expense: { label: "Despesa", class: "bg-terracotta/15 text-terracotta", Icon: ArrowDownRight },
  transfer: { label: "Transf.", class: "bg-info-slate/15 text-info-slate", Icon: Repeat },
};

export default function TransactionsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [confirmReverse, setConfirmReverse] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const paginatedFilters = { ...filters, limit: PAGE_SIZE, offset: page * PAGE_SIZE };
  const { data: transactions, isLoading } = useTransactions(paginatedFilters);
  const { data: accounts } = useAccounts();
  const reverseTransaction = useReverseTransaction();

  // UX-04: Auto-reset confirm state after 5 seconds
  useAutoReset(confirmReverse, setConfirmReverse);

  // Reset page when filters change
  const updateFilter = useCallback(<K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) => {
    setPage(0);
    setFilters((prev) => {
      const next = { ...prev, [key]: value || undefined };
      Object.keys(next).forEach((k) => {
        if (next[k as K] === undefined || next[k as K] === "") {
          delete next[k as K];
        }
      });
      return next;
    });
  }, []);

  async function handleReverse(id: string) {
    await reverseTransaction.mutateAsync(id);
    setConfirmReverse(null);
  }

  function getAmountDisplay(tx: TransactionWithRelations) {
    if (tx.type === "income") return { text: `+ ${formatCurrency(tx.amount)}`, class: "text-verdant" };
    if (tx.type === "expense") return { text: `- ${formatCurrency(tx.amount)}`, class: "text-terracotta" };
    return { text: formatCurrency(tx.amount), class: "text-info-slate" };
  }

  // ─── Loading ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Transações</h1>
        <button
          onClick={() => setFormOpen(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + Nova transação
        </button>
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={filters.search ?? ""}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder="Buscar por descrição"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
            showFilters || Object.keys(filters).some((k) => k !== "search" && filters[k as keyof TransactionFilters])
              ? "border-primary bg-primary/5 text-primary"
              : "border-input hover:bg-accent"
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border bg-card p-4 sm:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tipo</label>
            <select
              value={filters.type ?? ""}
              onChange={(e) => updateFilter("type", e.target.value as TransactionType)}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              <option value="">Todos</option>
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
              <option value="transfer">Transferência</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Conta</label>
            <select
              value={filters.accountId ?? ""}
              onChange={(e) => updateFilter("accountId", e.target.value)}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              <option value="">Todas</option>
              {accounts?.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">De</label>
            <input
              type="date"
              value={filters.dateFrom ?? ""}
              onChange={(e) => updateFilter("dateFrom", e.target.value)}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Até</label>
            <input
              type="date"
              value={filters.dateTo ?? ""}
              onChange={(e) => updateFilter("dateTo", e.target.value)}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
            />
          </div>

          {Object.keys(filters).some((k) => k !== "search" && filters[k as keyof TransactionFilters]) && (
            <button
              onClick={() => setFilters(filters.search ? { search: filters.search } : {})}
              className="col-span-2 text-xs text-primary hover:underline sm:col-span-4"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {transactions && transactions.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ArrowLeftRight className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">
            {Object.keys(filters).length > 0
              ? "Nenhuma transação encontrada para os filtros selecionados."
              : "Nenhuma transação registrada."}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {Object.keys(filters).length > 0
              ? "Ajuste os filtros ou limpe a busca."
              : "Registre uma transação para iniciar."}
          </p>
          {Object.keys(filters).length === 0 && (
            <button
              onClick={() => setFormOpen(true)}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Nova transação
            </button>
          )}
        </div>
      )}

      {/* Transaction list */}
      {transactions && transactions.length > 0 && (
        <div className="space-y-2">
          {transactions.map((tx) => {
            const amountDisplay = getAmountDisplay(tx);

            return (
              <div
                key={tx.id}
                className={`flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/50 ${
                  tx.is_deleted ? "opacity-50" : ""
                }`}
              >
                {/* Category color / account color */}
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{
                    backgroundColor:
                      tx.category_color || tx.account_color || "#7E9487",
                  }}
                >
                  {(tx.category_icon || tx.type.charAt(0)).slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">
                      {tx.description || "Sem descrição"}
                    </p>
                    {tx.is_deleted && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Estornado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(tx.date)}</span>
                    {(() => {
                      const badge = TYPE_BADGES[tx.type];
                      const BadgeIcon = badge.Icon;
                      return (
                        <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${badge.class}`}
                          role="status" aria-label={badge.label}>
                          <BadgeIcon className="h-2.5 w-2.5" aria-hidden="true" />
                          {badge.label}
                        </span>
                      );
                    })()}
                    {tx.category_name && <span>{tx.category_name}</span>}
                    {!tx.is_paid && (
                      <span className="rounded bg-burnished/15 px-1.5 py-0.5 text-[10px] font-medium text-burnished"
                        role="status" aria-label="Pendente">
                        Pendente
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <p className={`font-semibold ${amountDisplay.class}`}>
                  {amountDisplay.text}
                </p>

                {/* Reverse button */}
                {!tx.is_deleted && (
                  <>
                    {confirmReverse === tx.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleReverse(tx.id)}
                          disabled={reverseTransaction.isPending}
                          className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground"
                        >
                          Estornar
                        </button>
                        <button
                          onClick={() => setConfirmReverse(null)}
                          className="rounded-md px-2 py-1 text-xs text-muted-foreground"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmReverse(tx.id)}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Estornar"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-30"
            >
              Anterior
            </button>
            <span className="text-xs text-muted-foreground tabular-nums">
              Página {page + 1}{transactions.length < PAGE_SIZE ? ` (última)` : ""}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={transactions.length < PAGE_SIZE}
              className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-30"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {/* Form dialog */}
      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}
