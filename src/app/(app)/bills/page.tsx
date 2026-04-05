"use client";

import { toast } from "sonner";

/**
 * Oniefy - Recorrências (Phase 4)
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
import { CalendarClock, Repeat, AlertTriangle, Clock, ChevronLeft, ChevronRight, CreditCard } from "lucide-react";
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
import { Mv } from "@/components/ui/masked-value";
import type { Database } from "@/types/database";

type Frequency = Database["public"]["Enums"]["recurrence_frequency"];
type AdjustmentIndex = Database["public"]["Enums"]["adjustment_index_type"];

type Tab = "pending" | "recurrences" | "calendar" | "subscriptions";

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

function urgencyBadge(days: number, status?: string): { text: string; classes: string } {
  if (status === "overdue") return { text: `${Math.abs(days)}d atrasado`, classes: "bg-terracotta/15 text-terracotta" };
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
  const [search, setSearch] = useState("");
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

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
    toast.success("Pagamento registrado.");
    setConfirmPay(null);
  }

  async function handleDeactivate(id: string) {
    await deactivateRecurrence.mutateAsync(id);
    toast.success("Recorrência encerrada.");
    setConfirmDeactivate(null);
  }

  const isLoading = tab === "pending" || tab === "calendar" ? loadingBills : loadingRec;

  // E3: Subscriptions = active monthly expense recurrences
  const subscriptions = recurrences?.filter((r) => {
    if (!r.is_active) return false;
    const tmpl = r.template_transaction as Record<string, unknown>;
    return r.frequency === "monthly" && (tmpl.type as string) === "expense";
  }) ?? [];
  const totalSubscriptions = subscriptions.reduce(
    (s, r) => s + Number((r.template_transaction as Record<string, unknown>).amount),
    0
  );

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
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Contas a Pagar</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas despesas recorrentes
          </p>
        </div>
        <button type="button" onClick={handleNew}
          className="shrink-0 rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground whitespace-nowrap">
          + Nova recorrência
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1">
        {([
          { key: "pending", label: "Pendentes", count: pendingBills?.length ?? 0 },
          { key: "recurrences", label: "Recorrências", count: recurrences?.length ?? 0 },
          { key: "subscriptions", label: "Assinaturas", count: subscriptions.length },
          { key: "calendar", label: "Calendário", count: null },
        ] as const).map((t) => (
          <button type="button" key={t.key} onClick={() => setTab(t.key)}
            className={`min-w-0 flex-1 truncate rounded-md px-2 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
            {t.count !== null && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search (not shown on calendar) */}
      {tab !== "calendar" && (
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === "pending" ? "Buscar pendentes" : tab === "subscriptions" ? "Buscar assinatura" : "Buscar recorrências"} aria-label="Buscar contas"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      )}

      {/* ═══ TAB: Pendentes (CAP-04, CAP-05, CAP-06) ═══ */}
      {tab === "pending" && (
        <>
          {/* Total bar */}
          {(pendingBills?.length ?? 0) > 0 && (
            <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
              <span className="text-sm text-muted-foreground">Total pendente</span>
              <span className="text-lg font-bold tabular-nums text-terracotta">
                <Mv>{formatCurrency(totalPending)}</Mv>
              </span>
            </div>
          )}

          {(!pendingBills || pendingBills.length === 0) ? (
            <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <CalendarClock className="h-7 w-7 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Nenhuma conta pendente</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sem contas a vencer no período.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingBills.filter((b) => !search || b.description?.toLowerCase().includes(search.toLowerCase())).map((bill) => {
                const days = daysUntil(bill.due_date || bill.date);
                const badge = urgencyBadge(days, bill.payment_status);
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
                        <span className={`inline-flex flex-shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${badge.classes}`}
                          role="status" aria-label={badge.text}>
                          {days <= 0 ? <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" /> : <Clock className="h-2.5 w-2.5" aria-hidden="true" />}
                          {badge.text}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(bill.date)} · {bill.account_name}
                      </p>
                    </div>

                    {/* Amount */}
                    <span className="flex-shrink-0 font-semibold tabular-nums text-terracotta">
                      <Mv>{formatCurrency(bill.amount)}</Mv>
                    </span>

                    {/* Pay button (CAP-05) */}
                    {confirmPay === bill.id ? (
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => handlePay(bill.id)} disabled={payBill.isPending}
                          className="rounded-md bg-verdant px-2 py-1 text-xs font-medium text-white">
                          Confirmar
                        </button>
                        <button type="button" onClick={() => setConfirmPay(null)}
                          className="rounded-md px-2 py-1 text-xs text-muted-foreground">
                          Não
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setConfirmPay(bill.id)}
                        className="rounded-md bg-verdant/15 px-3 py-1.5 text-xs font-medium text-verdant transition-colors hover:bg-verdant/20"
                        title="Marcar como paga" aria-label="Marcar como paga">
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
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Repeat className="h-7 w-7 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Nenhuma recorrência cadastrada</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sem recorrências cadastradas.
              </p>
              <button type="button" onClick={handleNew}
                className="mt-4 rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground">
                Nova recorrência
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recurrences.filter((r) => {
                if (!search) return true;
                const desc = (r.template_transaction as Record<string, unknown>)?.description as string || "";
                return desc.toLowerCase().includes(search.toLowerCase());
              }).map((rec) => {
                const tmpl = rec.template_transaction as Record<string, unknown>;
                return (
                  <div key={rec.id} className="rounded-lg bg-card p-4 shadow-card card-alive transition-colors hover:bg-accent/30">
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
                        <button type="button" onClick={() => handleEdit(rec)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          title="Editar" aria-label="Editar">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Deactivate (CAP-03) */}
                        {confirmDeactivate === rec.id ? (
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => handleDeactivate(rec.id)} disabled={deactivateRecurrence.isPending}
                              className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground">
                              Encerrar
                            </button>
                            <button type="button" onClick={() => setConfirmDeactivate(null)}
                              className="rounded-md px-2 py-1 text-xs text-muted-foreground">
                              Não
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setConfirmDeactivate(rec.id)}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            title="Encerrar recorrência" aria-label="Encerrar recorrência">
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

      {/* ═══ TAB: Assinaturas (E3) ═══ */}
      {tab === "subscriptions" && (
        <>
          {/* Total bar */}
          {subscriptions.length > 0 && (
            <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
              <span className="text-sm text-muted-foreground">Custo mensal em assinaturas</span>
              <span className="text-lg font-bold tabular-nums text-terracotta">
                <Mv>{formatCurrency(totalSubscriptions)}</Mv>/mês
              </span>
            </div>
          )}

          {subscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <CreditCard className="h-7 w-7 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Nenhuma assinatura ativa</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Recorrências mensais de despesa aparecem aqui automaticamente. Cadastre uma recorrência na aba Recorrências.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {subscriptions
                .filter((r) => {
                  if (!search) return true;
                  const desc = (r.template_transaction as Record<string, unknown>)?.description as string || "";
                  return desc.toLowerCase().includes(search.toLowerCase());
                })
                .sort((a, b) => {
                  const amtA = Number((a.template_transaction as Record<string, unknown>).amount);
                  const amtB = Number((b.template_transaction as Record<string, unknown>).amount);
                  return amtB - amtA;
                })
                .map((rec) => {
                  const tmpl = rec.template_transaction as Record<string, unknown>;
                  const amount = Number(tmpl.amount);
                  const annualCost = amount * 12;
                  return (
                    <div key={rec.id} className="rounded-lg bg-card p-4 shadow-card card-alive transition-colors hover:bg-accent/30">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{(tmpl.description as string) || "Sem descrição"}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Próx: {formatDate(rec.next_due_date)}</span>
                            {rec.adjustment_index && rec.adjustment_index !== "none" && (
                              <span className="rounded bg-burnished/15 px-1.5 py-0.5 text-burnished">
                                Reajuste: {rec.adjustment_index === "manual"
                                  ? `+${Number(rec.adjustment_rate)}%`
                                  : rec.adjustment_index.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold tabular-nums text-terracotta">
                            {formatCurrency(amount)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatCurrency(annualCost)}/ano
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {subscriptions.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-4 text-center">
              <p className="text-xs text-muted-foreground">
                {subscriptions.length} assinatura{subscriptions.length !== 1 ? "s" : ""} ativa{subscriptions.length !== 1 ? "s" : ""} totalizando {formatCurrency(totalSubscriptions * 12)}/ano
              </p>
            </div>
          )}
        </>
      )}

      {/* ═══ TAB: Calendário (CAP-05) ═══ */}
      {tab === "calendar" && (() => {
        const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
          "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const { year, month } = calMonth;
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

        // Build map: day → bills due that day
        const billsByDay = new Map<number, { description: string; amount: number; isOverdue: boolean }[]>();
        for (const bill of pendingBills ?? []) {
          const d = new Date(bill.date + "T12:00:00");
          if (d.getFullYear() === year && d.getMonth() === month) {
            const day = d.getDate();
            if (!billsByDay.has(day)) billsByDay.set(day, []);
            billsByDay.get(day)!.push({
              description: bill.description ?? "Sem descrição",
              amount: bill.amount,
              isOverdue: bill.payment_status === "overdue",
            });
          }
        }

        const prevMonth = () => setCalMonth(m => m.month === 0 ? { year: m.year - 1, month: 11 } : { ...m, month: m.month - 1 });
        const nextMonth = () => setCalMonth(m => m.month === 11 ? { year: m.year + 1, month: 0 } : { ...m, month: m.month + 1 });

        const cells: (number | null)[] = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        while (cells.length % 7 !== 0) cells.push(null);

        return (
          <div className="space-y-4">
            {/* Month navigator */}
            <div className="flex items-center justify-between">
              <button type="button" onClick={prevMonth} className="rounded-md p-2 hover:bg-accent" aria-label="Mês anterior">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-semibold">
                {MONTH_NAMES[month]} {year}
              </h3>
              <button type="button" onClick={nextMonth} className="rounded-md p-2 hover:bg-accent" aria-label="Próximo mês">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Calendar grid */}
            <div className="rounded-lg border bg-card overflow-hidden">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-b bg-muted/50">
                {WEEKDAYS.map(w => (
                  <div key={w} className="py-2 text-center text-[11px] font-semibold text-muted-foreground">{w}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                  const bills = day ? billsByDay.get(day) : undefined;
                  const isToday = isCurrentMonth && day === today.getDate();
                  

                  return (
                    <div key={i} className={`min-h-[4rem] border-b border-r p-1.5 ${
                      day ? "hover:bg-accent/30" : "bg-muted/20"
                    } ${i % 7 === 6 ? "border-r-0" : ""}`}>
                      {day && (
                        <>
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                            isToday ? "bg-primary text-primary-foreground" : ""
                          }`}>
                            {day}
                          </span>
                          {bills && bills.length > 0 && (
                            <div className="mt-0.5 space-y-0.5">
                              {bills.slice(0, 2).map((b, j) => (
                                <div key={j} className={`truncate rounded px-1 py-0.5 text-[9px] font-medium leading-tight ${
                                  b.isOverdue ? "bg-terracotta/15 text-terracotta" : "bg-burnished/15 text-burnished"
                                }`}>
                                  {formatCurrency(b.amount)}
                                </div>
                              ))}
                              {bills.length > 2 && (
                                <span className="text-[9px] text-muted-foreground">+{bills.length - 2}</span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-burnished" /> Pendente
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-terracotta" /> Vencida
              </span>
            </div>
          </div>
        );
      })()}

      {/* Form dialog */}
      <RecurrenceForm open={formOpen} onClose={() => { setFormOpen(false); setEditData(null); }} editData={editData} />
    </div>
  );
}
