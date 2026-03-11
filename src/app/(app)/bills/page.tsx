"use client";

/**
 * Oniefy - Contas a Pagar (Phase 4)
 *
 * CAP-01: Criar transação recorrente
 * CAP-02: Editar recorrência
 * CAP-03: Encerrar recorrência
 * CAP-04: Listar contas pendentes
 * CAP-05: Pagar conta pendente (marcar + gerar próxima)
 * CAP-06: Alertas de vencimento (visual badges)
 *
 * Two tabs: "Pendentes" (transactions) + "Recorrências" (rules)
 */

import { useState } from "react";
import {
  useRecurrences,
  usePendingBills,
  usePayBill,
  useDeactivateRecurrence,
  FREQUENCY_LABELS,
} from "@/lib/hooks/use-recurrences";
import { useAutoReset } from "@/lib/hooks/use-dialog-helpers";
import { RecurrenceForm } from "@/components/recurrences/recurrence-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Database } from "@/types/database";

type Frequency = Database["public"]["Enums"]["recurrence_frequency"];
type AdjustmentIndex = Database["public"]["Enums"]["adjustment_index_type"];

type Tab = "pending" | "recurrences";

interface EditData {
  id: string;
  frequency: Frequency;
  interval_count: number;
  end_date: string | null;
  adjustment_index: AdjustmentIndex | null;
  adjustment_rate: number | null;
  template_transaction: Record<string, unknown>;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T12:00:00");
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyBadge(days: number): { text: string; classes: string } {
  if (days < 0) return { text: `${Math.abs(days)}d atrasado`, classes: "bg-terracotta/15 text-terracotta" };
  if (days === 0) return { text: "Hoje", classes: "bg-terracotta/15 text-terracotta" };
  if (days === 1) return { text: "Amanhã", classes: "bg-burnished/15 text-burnished" };
  if (days <= 3) return { text: `${days}d`, classes: "bg-burnished/15 text-burnished" };
  if (days <= 7) return { text: `${days}d`, classes: "bg-burnished/15 text-burnished" };
  return { text: `${days}d`, classes: "bg-muted text-muted-foreground" };
}

export default function BillsPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<EditData | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);
  const [confirmPay, setConfirmPay] = useState<string | null>(null);

  useAutoReset(confirmDeactivate, setConfirmDeactivate);
  useAutoReset(confirmPay, setConfirmPay);

  const { data: pendingBills, isLoading: loadingBills } = usePendingBills();
  const { data: recurrences, isLoading: loadingRec } = useRecurrences();
  const payBill = usePayBill();
  const deactivateRecurrence = useDeactivateRecurrence();

  function handleNew() {
    setEditData(null);
    setFormOpen(true);
  }

  function handleEdit(rec: NonNullable<typeof recurrences>[number]) {
    setEditData({
      id: rec.id,
      frequency: rec.frequency,
      interval_count: rec.interval_count,
      end_date: rec.end_date,
      adjustment_index: rec.adjustment_index,
      adjustment_rate: rec.adjustment_rate ? Number(rec.adjustment_rate) : null,
      template_transaction: rec.template_transaction as Record<string, unknown>,
    });
    setFormOpen(true);
  }

  async function handlePay(txId: string) {
    await payBill.mutateAsync(txId);
    setConfirmPay(null);
  }

  async function handleDeactivate(id: string) {
    await deactivateRecurrence.mutateAsync(id);
    setConfirmDeactivate(null);
  }

  const isLoading = tab === "pending" ? loadingBills : loadingRec;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const totalPending = pendingBills?.reduce((s, b) => s + b.amount, 0) ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contas a Pagar</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas despesas recorrentes
          </p>
        </div>
        <button onClick={handleNew}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          + Nova recorrência
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1">
        {([
          { key: "pending", label: "Pendentes", count: pendingBills?.length ?? 0 },
          { key: "recurrences", label: "Recorrências", count: recurrences?.length ?? 0 },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ═══ TAB: Pendentes (CAP-04, CAP-05, CAP-06) ═══ */}
      {tab === "pending" && (
        <>
          {/* Total bar */}
          {(pendingBills?.length ?? 0) > 0 && (
            <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
              <span className="text-sm text-muted-foreground">Total pendente</span>
              <span className="text-lg font-bold tabular-nums text-terracotta">
                {formatCurrency(totalPending)}
              </span>
            </div>
          )}

          {(!pendingBills || pendingBills.length === 0) ? (
            <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
              
              <h2 className="mt-2 text-lg font-semibold">Nenhuma conta pendente</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sem contas a vencer no período.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingBills.map((bill) => {
                const days = daysUntil(bill.date);
                const badge = urgencyBadge(days);
                return (
                  <div key={bill.id} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/30">
                    {/* Color indicator */}
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: bill.category_color || bill.account_color || "#7E9487" }}>
                      {(bill.category_icon || bill.type.charAt(0)).slice(0, 2).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{bill.description || bill.category_name || "Sem descrição"}</p>
                        <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${badge.classes}`}>
                          {badge.text}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(bill.date)} · {bill.account_name}
                      </p>
                    </div>

                    {/* Amount */}
                    <span className="flex-shrink-0 font-semibold tabular-nums text-terracotta">
                      {formatCurrency(bill.amount)}
                    </span>

                    {/* Pay button (CAP-05) */}
                    {confirmPay === bill.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handlePay(bill.id)} disabled={payBill.isPending}
                          className="rounded-md bg-verdant px-2 py-1 text-xs font-medium text-white">
                          Confirmar
                        </button>
                        <button onClick={() => setConfirmPay(null)}
                          className="rounded-md px-2 py-1 text-xs text-muted-foreground">
                          Não
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmPay(bill.id)}
                        className="rounded-md bg-verdant/15 px-3 py-1.5 text-xs font-medium text-verdant transition-colors hover:bg-verdant/20"
                        title="Marcar como paga">
                        Pagar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══ TAB: Recorrências (CAP-01, CAP-02, CAP-03) ═══ */}
      {tab === "recurrences" && (
        <>
          {(!recurrences || recurrences.length === 0) ? (
            <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
              
              <h2 className="mt-2 text-lg font-semibold">Nenhuma recorrência cadastrada</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sem recorrências cadastradas.
              </p>
              <button onClick={handleNew}
                className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Nova recorrência
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recurrences.map((rec) => {
                const tmpl = rec.template_transaction as Record<string, unknown>;
                return (
                  <div key={rec.id} className="rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{(tmpl.description as string) || "Sem descrição"}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="rounded bg-muted px-1.5 py-0.5 font-medium">
                            {FREQUENCY_LABELS[rec.frequency]}
                          </span>
                          <span>Próx: {formatDate(rec.next_due_date)}</span>
                          {rec.end_date && <span>Até: {formatDate(rec.end_date)}</span>}
                          {rec.adjustment_index && rec.adjustment_index !== "none" && (
                            <span className="rounded bg-info-slate/15 px-1.5 py-0.5 text-info-slate">
                              {rec.adjustment_index === "manual"
                                ? `+${Number(rec.adjustment_rate)}%`
                                : rec.adjustment_index.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold tabular-nums ${
                          (tmpl.type as string) === "expense" ? "text-terracotta" : "text-verdant"
                        }`}>
                          {formatCurrency(Number(tmpl.amount))}
                        </span>

                        {/* Edit */}
                        <button onClick={() => handleEdit(rec)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          title="Editar">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Deactivate (CAP-03) */}
                        {confirmDeactivate === rec.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDeactivate(rec.id)} disabled={deactivateRecurrence.isPending}
                              className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground">
                              Encerrar
                            </button>
                            <button onClick={() => setConfirmDeactivate(null)}
                              className="rounded-md px-2 py-1 text-xs text-muted-foreground">
                              Não
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDeactivate(rec.id)}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            title="Encerrar recorrência">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Form dialog */}
      <RecurrenceForm open={formOpen} onClose={() => { setFormOpen(false); setEditData(null); }} editData={editData} />
    </div>
  );
}
