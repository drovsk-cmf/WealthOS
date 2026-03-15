"use client";

import { useState } from "react";
import { CircleCheck, Link, AlertCircle, ArrowRight, Undo2, Loader2 } from "lucide-react";
import { useUndoImportBatch } from "@/lib/hooks/use-bank-connections";

interface Props {
  imported?: number;
  skipped?: number;
  categorized?: number;
  matched?: number;
  batchId?: string | null;
  onReset: () => void;
}

/**
 * ImportStepResult (UX-H1-05 + UX-H2-05)
 *
 * Enhanced post-import summary with:
 * - Total imported with celebration
 * - Auto-categorized vs. pending review count
 * - Reconciliation matches
 * - Actionable CTAs: review uncategorized, view transactions, import another
 * - UX-H2-05: Undo import (soft-delete batch within 72h)
 */
export function ImportStepResult({ imported = 0, skipped = 0, categorized = 0, matched = 0, batchId, onReset }: Props) {
  const uncategorized = Math.max(0, imported - categorized);
  const hasUncategorized = uncategorized > 0;

  const undoImport = useUndoImportBatch();
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [undone, setUndone] = useState(false);

  async function handleUndo() {
    if (!batchId) return;
    try {
      const result = await undoImport.mutateAsync(batchId);
      setUndone(true);
      setConfirmUndo(false);
      // result.undone_count is available if needed
    } catch {
      // Error handled by mutation state
    }
  }

  if (undone) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Undo2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold">Importação desfeita</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            As transações importadas foram removidas.
          </p>
          <button
            onClick={onReset}
            className="mt-6 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Importar outro arquivo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      {/* Success header */}
      <div className="flex flex-col items-center border-b px-6 py-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-verdant/15">
          <CircleCheck className="h-8 w-8 text-verdant" />
        </div>
        <h2 className="text-xl font-bold">Importação concluída</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {imported} {imported === 1 ? "transação importada" : "transações importadas"} com sucesso.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-px border-b bg-border sm:grid-cols-4">
        <div className="flex flex-col items-center bg-card px-4 py-4">
          <span className="text-2xl font-bold tabular-nums text-verdant">{imported}</span>
          <span className="mt-0.5 text-xs text-muted-foreground">Importadas</span>
        </div>
        <div className="flex flex-col items-center bg-card px-4 py-4">
          <span className="text-2xl font-bold tabular-nums">{categorized}</span>
          <span className="mt-0.5 text-xs text-muted-foreground">Categorizadas</span>
        </div>
        <div className="flex flex-col items-center bg-card px-4 py-4">
          <span className={`text-2xl font-bold tabular-nums ${hasUncategorized ? "text-burnished" : "text-verdant"}`}>{uncategorized}</span>
          <span className="mt-0.5 text-xs text-muted-foreground">Para revisar</span>
        </div>
        <div className="flex flex-col items-center bg-card px-4 py-4">
          <span className="text-2xl font-bold tabular-nums text-info-slate">{matched}</span>
          <span className="mt-0.5 text-xs text-muted-foreground">Conciliadas</span>
        </div>
      </div>

      {/* Alerts and info */}
      <div className="space-y-3 px-6 py-5">
        {skipped > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-burnished/10 px-3 py-2.5 text-sm text-burnished">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{skipped} {skipped === 1 ? "duplicada ignorada" : "duplicadas ignoradas"} (já existiam no sistema).</span>
          </div>
        )}
        {matched > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-info-slate/10 px-3 py-2.5 text-sm text-info-slate">
            <Link className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{matched} {matched === 1 ? "transação conciliada" : "transações conciliadas"} automaticamente com pendentes existentes.</span>
          </div>
        )}
        {hasUncategorized && (
          <div className="flex items-start gap-2 rounded-lg bg-burnished/10 px-3 py-2.5 text-sm text-burnished">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{uncategorized} {uncategorized === 1 ? "transação precisa" : "transações precisam"} de categorização manual. Revise na lista de transações.</span>
          </div>
        )}
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-3 border-t px-6 py-5">
        <a
          href="/transactions"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Ver transações
          <ArrowRight className="h-4 w-4" />
        </a>
        <button
          onClick={onReset}
          className="rounded-md border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
        >
          Importar outro arquivo
        </button>
      </div>

      {/* UX-H2-05: Undo import */}
      {batchId && imported > 0 && (
        <div className="border-t px-6 py-4">
          {confirmUndo ? (
            <div className="flex items-center justify-between rounded-lg bg-destructive/10 px-4 py-3">
              <p className="text-sm text-destructive">
                Desfazer {imported} transações importadas?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleUndo}
                  disabled={undoImport.isPending}
                  className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground"
                >
                  {undoImport.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Confirmar"
                  )}
                </button>
                <button
                  onClick={() => setConfirmUndo(false)}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmUndo(true)}
              className="flex w-full items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Desfazer importação (disponível por 72h)
            </button>
          )}
          {undoImport.isError && (
            <p className="mt-2 text-center text-xs text-destructive">
              {undoImport.error instanceof Error
                ? undoImport.error.message
                : "Erro ao desfazer importação."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
