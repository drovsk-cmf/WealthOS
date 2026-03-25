"use client";

/**
 * Oniefy - Metas de Economia (E6)
 *
 * CRUD de metas com:
 * - Progresso visual (barra + percentual)
 * - Valor mensal sugerido para atingir a meta no prazo
 * - Meses restantes
 * - Marcar como concluída
 * - Form inline para criar/editar
 */

import { useState } from "react";
import { toast } from "sonner";
import { Target, Plus, Check, Trash2, Pencil, Trophy, X } from "lucide-react";
import {
  useSavingsGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
} from "@/lib/hooks/use-savings-goals";
import type { SavingsGoalWithProgress } from "@/lib/hooks/use-savings-goals";
import { useAutoReset } from "@/lib/hooks/use-dialog-helpers";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";

const GOAL_COLORS = [
  { value: "#56688F", label: "Azul" },
  { value: "#2F7A68", label: "Verde" },
  { value: "#A97824", label: "Dourado" },
  { value: "#A64A45", label: "Vermelho" },
  { value: "#6F6678", label: "Roxo" },
  { value: "#4F2F69", label: "Plum" },
];

interface GoalFormData {
  name: string;
  target_amount: string;
  current_amount: string;
  target_date: string;
  color: string;
}

const EMPTY_FORM: GoalFormData = {
  name: "",
  target_amount: "",
  current_amount: "0",
  target_date: "",
  color: "#56688F",
};

function GoalForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
}: {
  initial: GoalFormData;
  onSubmit: (data: GoalFormData) => void;
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const [form, setForm] = useState<GoalFormData>(initial);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-5 shadow-card">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Nome da meta</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Reserva de emergência, Viagem Europa"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Valor alvo (R$)</label>
          <input
            type="number"
            required
            min={1}
            step="0.01"
            value={form.target_amount}
            onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
            placeholder="50000"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Valor atual (R$)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.current_amount}
            onChange={(e) => setForm({ ...form, current_amount: e.target.value })}
            placeholder="0"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Data alvo (opcional)</label>
          <input
            type="date"
            value={form.target_date}
            onChange={(e) => setForm({ ...form, target_date: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Cor</label>
          <div className="mt-1.5 flex gap-2">
            {GOAL_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setForm({ ...form, color: c.value })}
                className={`h-7 w-7 rounded-full border-2 transition-transform ${
                  form.color === c.value ? "scale-110 border-foreground" : "border-transparent"
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground btn-alive">
          Cancelar
        </button>
        <button type="submit" disabled={isPending || !form.name || !form.target_amount}
          className="rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onToggleComplete,
}: {
  goal: SavingsGoalWithProgress;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  useAutoReset(confirmDel ? "y" : null, () => setConfirmDel(false));

  return (
    <div className={`rounded-lg bg-card p-5 shadow-card card-alive ${goal.is_completed ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: goal.color + "20" }}
          >
            {goal.is_completed ? (
              <Trophy className="h-5 w-5" style={{ color: goal.color }} />
            ) : (
              <Target className="h-5 w-5" style={{ color: goal.color }} />
            )}
          </div>
          <div>
            <h3 className={`font-semibold ${goal.is_completed ? "line-through" : ""}`}>
              {goal.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {goal.target_date && (
                <span>Prazo: {formatDate(goal.target_date)}</span>
              )}
              {goal.months_remaining !== null && goal.months_remaining > 0 && !goal.is_completed && (
                <span className="rounded bg-muted px-1.5 py-0.5 font-medium">
                  {goal.months_remaining} mês(es) restante(s)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button type="button" onClick={onToggleComplete}
            className={`rounded-md p-1.5 transition-colors ${
              goal.is_completed
                ? "text-verdant hover:bg-verdant/10"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
            title={goal.is_completed ? "Reabrir" : "Concluir"}>
            <Check className="h-4 w-4" />
          </button>
          {!goal.is_completed && (
            <button type="button" onClick={onEdit}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Editar">
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {confirmDel ? (
            <div className="flex items-center gap-1">
              <button type="button" onClick={onDelete}
                className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground">
                Excluir
              </button>
              <button type="button" onClick={() => setConfirmDel(false)}
                className="rounded-md px-2 py-1 text-xs text-muted-foreground">
                Não
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDel(true)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title="Excluir">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs">
          <span className="tabular-nums text-muted-foreground">
            <Mv>{formatCurrency(goal.current_amount)}</Mv>
          </span>
          <span className="tabular-nums font-medium">
            <Mv>{formatCurrency(goal.target_amount)}</Mv>
          </span>
        </div>
        <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${goal.progress_pct}%`,
              backgroundColor: goal.color,
            }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>{goal.progress_pct.toFixed(0)}%</span>
          <span>Faltam <Mv>{formatCurrency(goal.remaining_amount)}</Mv></span>
        </div>
      </div>

      {/* Monthly suggestion */}
      {goal.monthly_savings_needed !== null && goal.monthly_savings_needed > 0 && !goal.is_completed && (
        <div className="mt-3 rounded-md bg-primary/5 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Para atingir no prazo, economize{" "}
            <strong className="text-foreground">
              {formatCurrency(goal.monthly_savings_needed)}
            </strong>
            /mês
          </p>
        </div>
      )}
    </div>
  );
}

export default function GoalsPage() {
  const { data: goals, isLoading } = useSavingsGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeGoals = goals?.filter((g) => !g.is_completed) ?? [];
  const completedGoals = goals?.filter((g) => g.is_completed) ?? [];

  const totalTarget = activeGoals.reduce((s, g) => s + g.target_amount, 0);
  const totalCurrent = activeGoals.reduce((s, g) => s + g.current_amount, 0);
  const totalProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  async function handleCreate(data: GoalFormData) {
    await createGoal.mutateAsync({
      name: data.name,
      target_amount: parseFloat(data.target_amount) || 0,
      current_amount: parseFloat(data.current_amount) || 0,
      target_date: data.target_date || null,
      color: data.color,
    });
    toast.success("Meta criada.");
    setShowForm(false);
  }

  async function handleUpdate(data: GoalFormData) {
    if (!editingId) return;
    await updateGoal.mutateAsync({
      id: editingId,
      name: data.name,
      target_amount: parseFloat(data.target_amount) || 0,
      current_amount: parseFloat(data.current_amount) || 0,
      target_date: data.target_date || null,
      color: data.color,
    });
    toast.success("Meta atualizada.");
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    await deleteGoal.mutateAsync(id);
    toast.success("Meta excluída.");
  }

  async function handleToggleComplete(goal: SavingsGoalWithProgress) {
    await updateGoal.mutateAsync({
      id: goal.id,
      is_completed: !goal.is_completed,
      current_amount: !goal.is_completed ? goal.target_amount : goal.current_amount,
    });
    toast.success(goal.is_completed ? "Meta reaberta." : "Meta concluída!");
  }

  function startEdit(goal: SavingsGoalWithProgress) {
    setEditingId(goal.id);
    setShowForm(false);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Metas</h1>
          <p className="text-sm text-muted-foreground">
            Defina objetivos e acompanhe o progresso
          </p>
        </div>
        {!showForm && !editingId && (
          <button type="button" onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground">
            <Plus className="h-4 w-4" /> Nova meta
          </button>
        )}
      </div>

      {/* Summary */}
      {activeGoals.length > 0 && (
        <div className="rounded-lg border bg-card px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Progresso geral ({activeGoals.length} meta{activeGoals.length !== 1 ? "s" : ""})
              </p>
              <p className="mt-0.5 text-sm">
                <Mv>
                  <span className="font-bold tabular-nums">{formatCurrency(totalCurrent)}</span>
                  <span className="text-muted-foreground"> / {formatCurrency(totalTarget)}</span>
                </Mv>
              </p>
            </div>
            <span className="text-2xl font-bold tabular-nums">{totalProgress.toFixed(0)}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${Math.min(100, totalProgress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <GoalForm
          initial={EMPTY_FORM}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isPending={createGoal.isPending}
          submitLabel="Criar meta"
        />
      )}

      {/* Empty state */}
      {(!goals || goals.length === 0) && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Target className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Defina seu primeiro objetivo</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Metas financeiras tornam o progresso visível. Comece com algo concreto: reserva de
            emergência, uma viagem, ou a entrada de um imóvel.
          </p>
          <button type="button" onClick={() => setShowForm(true)}
            className="mt-5 rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground">
            + Criar meta
          </button>
        </div>
      )}

      {/* Active goals */}
      <div className="space-y-4">
        {activeGoals.map((goal) =>
          editingId === goal.id ? (
            <GoalForm
              key={goal.id}
              initial={{
                name: goal.name,
                target_amount: String(goal.target_amount),
                current_amount: String(goal.current_amount),
                target_date: goal.target_date ?? "",
                color: goal.color,
              }}
              onSubmit={handleUpdate}
              onCancel={() => setEditingId(null)}
              isPending={updateGoal.isPending}
              submitLabel="Salvar"
            />
          ) : (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => startEdit(goal)}
              onDelete={() => handleDelete(goal.id)}
              onToggleComplete={() => handleToggleComplete(goal)}
            />
          )
        )}
      </div>

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Concluídas ({completedGoals.length})
          </h2>
          {completedGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => {}}
              onDelete={() => handleDelete(goal.id)}
              onToggleComplete={() => handleToggleComplete(goal)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
