"use client";

/**
 * Oniefy - Reconciliation Panel (Camada 3)
 *
 * Side-by-side view: pending transactions (left) vs imported (right).
 * User selects one from each column and clicks "Conciliar" to match.
 */

import { useState, useMemo } from "react";
import { Link, ArrowLeftRight, CircleCheck, AlertTriangle, Filter, Clock, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useUnmatchedImports,
  usePendingUnmatched,
  useMatchTransactions,
  type UnmatchedTransaction,
} from "@/lib/hooks/use-reconciliation";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string; Icon: LucideIcon }> = {
    pending: { label: "Pendente", classes: "bg-burnished/15 text-burnished", Icon: Clock },
    overdue: { label: "Atrasada", classes: "bg-terracotta/15 text-terracotta", Icon: AlertTriangle },
    paid: { label: "Paga", classes: "bg-verdant/15 text-verdant", Icon: CircleCheck },
    cancelled: { label: "Cancelada", classes: "bg-muted text-muted-foreground", Icon: XCircle },
  };
  const c = config[status] ?? { label: status, classes: "bg-muted text-muted-foreground", Icon: Clock };
  const BadgeIcon = c.Icon;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${c.classes}`}
      role="status" aria-label={c.label}>
      <BadgeIcon className="h-2.5 w-2.5" aria-hidden="true" />
      {c.label}
    </span>
  );
}

function TxRow({
  tx,
  selected,
  onSelect,
}: {
  tx: UnmatchedTransaction;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border p-3 text-left transition-all ${
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border bg-card hover:bg-accent/30"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {tx.description || "Sem descrição"}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>{formatDate(tx.due_date || tx.date)}</span>
            <span className="text-border">·</span>
            <span>{tx.account_name}</span>
            {tx.category_name && (
              <>
                <span className="text-border">·</span>
                <span>{tx.category_name}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-sm font-semibold tabular-nums ${
            tx.type === "expense" ? "text-terracotta" : "text-verdant"
          }`}>
            <Mv>{formatCurrency(tx.amount)}</Mv>
          </span>
          <StatusBadge status={tx.payment_status} />
        </div>
      </div>
    </button>
  );
}

export function ReconciliationPanel() {
  const [accountFilter, setAccountFilter] = useState<string>("");
  const [selectedPending, setSelectedPending] = useState<string | null>(null);
  const [selectedImported, setSelectedImported] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ adjustment: number } | null>(null);

  const { data: accounts } = useAccounts();
  const { data: pending, isLoading: loadingPending } = usePendingUnmatched(accountFilter || undefined);
  const { data: imports, isLoading: loadingImports } = useUnmatchedImports(accountFilter || undefined);
  const matchMutation = useMatchTransactions();

  const selectedPendingTx = useMemo(
    () => pending?.find((t) => t.id === selectedPending),
    [pending, selectedPending]
  );
  const selectedImportedTx = useMemo(
    () => imports?.find((t) => t.id === selectedImported),
    [imports, selectedImported]
  );

  const canMatch = selectedPending && selectedImported && selectedPendingTx && selectedImportedTx
    && selectedPendingTx.account_id === selectedImportedTx.account_id;

  const amountDiff = selectedPendingTx && selectedImportedTx
    ? selectedImportedTx.amount - selectedPendingTx.amount
    : 0;

  async function handleMatch() {
    if (!selectedPending || !selectedImported) return;
    const result = await matchMutation.mutateAsync({
      pendingId: selectedPending,
      importedId: selectedImported,
    });
    setLastResult({ adjustment: result.adjustment });
    setSelectedPending(null);
    setSelectedImported(null);
  }

  const isLoading = loadingPending || loadingImports;
  const hasPending = (pending?.length ?? 0) > 0;
  const hasImports = (imports?.length ?? 0) > 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!hasPending && !hasImports) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-verdant/15">
          <CircleCheck className="h-7 w-7 text-verdant" />
        </div>
        <h2 className="text-lg font-semibold">Tudo conciliado</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sem transações pendentes de conciliação.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Account filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          value={accountFilter}
          onChange={(e) => {
            setAccountFilter(e.target.value);
            setSelectedPending(null);
            setSelectedImported(null);
          }}
          className="rounded-md border bg-card px-3 py-1.5 text-sm"
        >
          <option value="">Todas as contas</option>
          {accounts?.filter((a) => a.is_active).map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted-foreground">
          {pending?.length ?? 0} pendentes · {imports?.length ?? 0} importadas
        </span>
      </div>

      {/* Success toast */}
      {lastResult && (
        <div className="flex items-center gap-2 rounded-lg border border-verdant/30 bg-verdant/10 px-4 py-2.5 text-sm">
          <Link className="h-4 w-4 text-verdant" />
          <span className="font-medium text-verdant">Conciliação realizada</span>
          {lastResult.adjustment !== 0 && (
            <span className="text-muted-foreground">
              (ajuste: {formatCurrency(Math.abs(lastResult.adjustment))})
            </span>
          )}
          <button type="button"
            onClick={() => setLastResult(null)}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Left: Pending/Overdue */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Pendentes ({pending?.length ?? 0})
          </h3>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto rounded-lg border bg-muted/30 p-2">
            {!hasPending ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sem transações pendentes
              </p>
            ) : (
              pending?.map((tx) => (
                <TxRow
                  key={tx.id}
                  tx={tx}
                  selected={selectedPending === tx.id}
                  onSelect={() => setSelectedPending(selectedPending === tx.id ? null : tx.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: Imported */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Importadas ({imports?.length ?? 0})
          </h3>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto rounded-lg border bg-muted/30 p-2">
            {!hasImports ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sem transações importadas sem par
              </p>
            ) : (
              imports?.map((tx) => (
                <TxRow
                  key={tx.id}
                  tx={tx}
                  selected={selectedImported === tx.id}
                  onSelect={() => setSelectedImported(selectedImported === tx.id ? null : tx.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Match action bar */}
      {(selectedPending || selectedImported) && (
        <div className="sticky bottom-4 flex items-center justify-between rounded-lg border bg-card px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3 text-sm">
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            {selectedPendingTx && selectedImportedTx ? (
              <div className="flex items-center gap-2">
                <span className="font-medium"><Mv>{formatCurrency(selectedPendingTx.amount)}</Mv></span>
                <span className="text-muted-foreground">↔</span>
                <span className="font-medium"><Mv>{formatCurrency(selectedImportedTx.amount)}</Mv></span>
                {amountDiff !== 0 && (
                  <span className="flex items-center gap-1 text-xs">
                    <AlertTriangle className="h-3 w-3 text-burnished" />
                    <span className="text-burnished">
                      Ajuste: {amountDiff > 0 ? "+" : ""}<Mv>{formatCurrency(amountDiff)}</Mv>
                    </span>
                  </span>
                )}
                {selectedPendingTx.account_id !== selectedImportedTx.account_id && (
                  <span className="text-xs text-terracotta">Contas diferentes</span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">
                Selecione uma pendente e uma importada para conciliar
              </span>
            )}
          </div>
          <button type="button"
            onClick={handleMatch}
            disabled={!canMatch || matchMutation.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {matchMutation.isPending ? "Conciliando..." : "Conciliar"}
          </button>
        </div>
      )}
    </div>
  );
}
