"use client";

/**
 * Oniefy - Orçamento (Phase 3)
 *
 * ORC-01: Criar orçamento mensal por categoria
 * ORC-02: Copiar orçamento do mês anterior
 * ORC-03: Editar valor orçado
 * ORC-04: Remover orçamento de categoria
 * ORC-05: Relatório mensal (planejado vs realizado) via get_budget_vs_actual RPC
 * ORC-06: Alerta de orçamento excedido (visual no card)
 *
 * Layout: month navigator + budget list + actual vs planned bars
 */

import { useState, useMemo } from "react";
import { BarChart3, Users, AlertTriangle, CircleAlert } from "lucide-react";
import {
  useBudgets,
  useDeleteBudget,
  useCopyBudgets,
  toMonthKey,
  formatMonthLabel,
} from "@/lib/hooks/use-budgets";
import { useAutoReset } from "@/lib/hooks/use-dialog-helpers";
import { useBudgetVsActual } from "@/lib/hooks/use-dashboard";
import { useFamilyMembers } from "@/lib/hooks/use-family-members";
import { BudgetForm } from "@/components/budgets/budget-form";
import { formatCurrency } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";
import type { Database } from "@/types/database";

type AdjustmentIndex = Database["public"]["Enums"]["adjustment_index_type"];

interface EditData {
  id: string;
  category_id: string;
  category_name: string;
  planned_amount: number;
  alert_threshold: number;
  adjustment_index: AdjustmentIndex | null;
}

const STATUS_COLORS = {
  ok: "bg-verdant",
  warning: "bg-burnished",
  exceeded: "bg-terracotta",
};

const STATUS_BADGES = {
  ok: "",
  warning: "bg-burnished/15 text-burnished",
  exceeded: "bg-terracotta/15 text-terracotta",
};

export default function BudgetsPage() {
  // ─── State ─────────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(() => toMonthKey());
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<EditData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmCopy, setConfirmCopy] = useState(false);
  const [copyError, setCopyError] = useState("");

  useAutoReset(confirmDelete, setConfirmDelete);

  // ─── Queries ───────────────────────────────────────────────
  const { data: budgets, isLoading } = useBudgets(currentMonth, selectedMemberId);
  const { data: members } = useFamilyMembers();
  const activeMembers = members?.filter((m) => m.is_active) ?? [];
  const deleteBudget = useDeleteBudget();
  const copyBudgets = useCopyBudgets();

  // Parse year/month for RPC
  const [year, month] = currentMonth.split("-").map(Number);
  const budgetVsActual = useBudgetVsActual(year, month, selectedMemberId);
  const bva = budgetVsActual.data;

  // ─── Month navigation ─────────────────────────────────────
  function navigateMonth(delta: number) {
    const d = new Date(currentMonth + "T12:00:00");
    d.setMonth(d.getMonth() + delta);
    setCurrentMonth(toMonthKey(d));
  }

  // Previous month key for copy
  const prevMonthKey = useMemo(() => {
    const d = new Date(currentMonth + "T12:00:00");
    d.setMonth(d.getMonth() - 1);
    return toMonthKey(d);
  }, [currentMonth]);

  const hasBudgetsThisMonth = (budgets?.length ?? 0) > 0;

  // Map budget_id to actual data from RPC
  const actualMap = useMemo(() => {
    const map = new Map<string, { actual: number; pct_used: number; status: string }>();
    bva?.items?.forEach((item) => {
      map.set(item.budget_id, {
        actual: item.actual,
        pct_used: item.pct_used,
        status: item.status,
      });
    });
    return map;
  }, [bva]);

  // ─── Handlers ──────────────────────────────────────────────
  function handleEdit(b: NonNullable<typeof budgets>[number]) {
    setEditData({
      id: b.id,
      category_id: b.category_id,
      category_name: b.categories.name,
      planned_amount: b.planned_amount,
      alert_threshold: b.alert_threshold,
      adjustment_index: b.adjustment_index,
    });
    setFormOpen(true);
  }

  function handleNew() {
    setEditData(null);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    await deleteBudget.mutateAsync(id);
    setConfirmDelete(null);
  }

  async function handleCopy() {
    setCopyError("");
    try {
      await copyBudgets.mutateAsync({
        source_month: prevMonthKey,
        target_month: currentMonth,
        family_member_id: selectedMemberId,
      });
      setConfirmCopy(false);
    } catch (err) {
      setCopyError(err instanceof Error ? err.message : "Erro ao copiar.");
    }
  }

  // ─── Loading ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-12 animate-pulse rounded-lg bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamento</h1>
          <p className="text-sm text-muted-foreground">
            Controle seus gastos por categoria
          </p>
        </div>
        <button
          onClick={handleNew}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + Nova categoria
        </button>
      </div>

      {/* Member filter */}
      {activeMembers.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto">
          <Users className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <button
            onClick={() => setSelectedMemberId(null)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedMemberId === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            Lar
          </button>
          {activeMembers.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMemberId(m.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedMemberId === m.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {m.avatar_emoji ? `${m.avatar_emoji} ` : ""}{m.name}
            </button>
          ))}
        </div>
      )}

      {/* Month navigator */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-3">
        <button
          onClick={() => navigateMonth(-1)}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          <p className="text-lg font-semibold capitalize">
            {formatMonthLabel(currentMonth)}
          </p>
          {bva && bva.budget_count > 0 && (
            <p className="text-xs text-muted-foreground tabular-nums">
              {bva.pct_used.toFixed(0)} % utilizado · <Mv>{formatCurrency(bva.total_actual)}</Mv> / <Mv>{formatCurrency(bva.total_planned)}</Mv>
            </p>
          )}
        </div>

        <button
          onClick={() => navigateMonth(1)}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Overall progress bar (ORC-05) */}
      {bva && bva.budget_count > 0 && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              (bva.pct_used ?? 0) >= 100
                ? "bg-terracotta"
                : (bva.pct_used ?? 0) >= 80
                  ? "bg-burnished"
                  : "bg-verdant"
            }`}
            style={{ width: `${Math.min(bva.pct_used ?? 0, 100)}%` }}
          />
        </div>
      )}

      {/* Empty state */}
      {!hasBudgetsThisMonth && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <BarChart3 className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">
            Nenhum orçamento para {formatMonthLabel(currentMonth)}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Defina limites de gasto por categoria para controlar suas finanças.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleNew}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Criar orçamento
            </button>
            {/* ORC-02: Copy from previous month */}
            <button
              onClick={() => setConfirmCopy(true)}
              className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Copiar de {formatMonthLabel(prevMonthKey)}
            </button>
          </div>
        </div>
      )}

      {/* Budget list */}
      {hasBudgetsThisMonth && (
        <div className="space-y-2">
          {/* ORC-02: Copy button when there are budgets */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                // Navigate to next month that has no budgets to copy into
                const nextMonth = new Date(currentMonth + "T12:00:00");
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                setCurrentMonth(toMonthKey(nextMonth));
                setTimeout(() => setConfirmCopy(true), 100);
              }}
              className="text-xs text-primary hover:underline"
            >
              Copiar para o próximo mês
            </button>
          </div>

          {budgets?.map((b) => {
            const act = actualMap.get(b.id);
            const actual = act?.actual ?? 0;
            const pctUsed = act?.pct_used ?? 0;
            const status = (act?.status ?? "ok") as keyof typeof STATUS_COLORS;

            return (
              <div
                key={b.id}
                className="rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent/30"
              >
                <div className="flex items-start justify-between">
                  {/* Category info */}
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                      style={{
                        backgroundColor: b.categories.color || "#7E9487",
                      }}
                    >
                      {(b.categories.icon || b.categories.name.charAt(0))
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <div>
                      <p className="font-medium">{b.categories.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        <Mv>{formatCurrency(actual)}</Mv> de <Mv>{formatCurrency(b.planned_amount)}</Mv>
                      </p>
                    </div>
                  </div>

                  {/* Status + actions */}
                  <div className="flex items-center gap-2">
                    {status !== "ok" && (
                      <span
                        className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${STATUS_BADGES[status]}`}
                        role="status"
                        aria-label={status === "warning" ? "Orçamento em atenção" : "Orçamento excedido"}
                      >
                        {status === "warning"
                          ? <><AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />Atenção</>
                          : <><CircleAlert className="h-2.5 w-2.5" aria-hidden="true" />Excedido</>}
                      </span>
                    )}
                    <span className="text-sm font-semibold tabular-nums">
                      {pctUsed.toFixed(0)} %
                    </span>

                    {/* Edit button */}
                    <button
                      onClick={() => handleEdit(b)}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      title="Editar"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Delete button (ORC-04) */}
                    {confirmDelete === b.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(b.id)}
                          disabled={deleteBudget.isPending}
                          className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground"
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="rounded-md px-2 py-1 text-xs text-muted-foreground"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(b.id)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Remover"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar (ORC-06: visual alert) */}
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${STATUS_COLORS[status]}`}
                    style={{ width: `${Math.min(pctUsed, 100)}%` }}
                  />
                </div>

                {/* Remaining */}
                <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>
                    Restante: <Mv>{formatCurrency(b.planned_amount - actual)}</Mv>
                  </span>
                  <span>Alerta: {b.alert_threshold} %</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ORC-05: Summary footer */}
      {hasBudgetsThisMonth && bva && (
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-semibold">Resumo do Mês</h3>
          <div className="mt-3 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Orçado</p>
              <p className="text-lg font-bold tabular-nums">
                <Mv>{formatCurrency(bva.total_planned)}</Mv>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Realizado</p>
              <p
                className={`text-lg font-bold tabular-nums ${
                  bva.total_actual > bva.total_planned
                    ? "text-terracotta"
                    : "text-foreground"
                }`}
              >
                <Mv>{formatCurrency(bva.total_actual)}</Mv>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Disponível</p>
              <p
                className={`text-lg font-bold tabular-nums ${
                  bva.total_remaining < 0
                    ? "text-terracotta"
                    : "text-verdant"
                }`}
              >
                <Mv>{formatCurrency(bva.total_remaining)}</Mv>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Copy confirmation dialog (ORC-02) */}
      {confirmCopy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => { setConfirmCopy(false); setCopyError(""); }} />
          <div className="relative z-50 mx-4 w-full max-w-sm rounded-lg border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Copiar Orçamento</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Copiar todos os orçamentos de{" "}
              <strong>{formatMonthLabel(prevMonthKey)}</strong> para{" "}
              <strong>{formatMonthLabel(currentMonth)}</strong>?
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Os valores orçados serão copiados sem alteração. Você poderá editá-los depois.
            </p>

            {copyError && (
              <p className="mt-3 rounded bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
                {copyError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => { setConfirmCopy(false); setCopyError(""); }}
                className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                onClick={handleCopy}
                disabled={copyBudgets.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {copyBudgets.isPending ? "Copiando" : "Copiar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budget form dialog */}
      <BudgetForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditData(null);
        }}
        month={currentMonth}
        familyMemberId={selectedMemberId}
        editData={editData}
      />
    </div>
  );
}
