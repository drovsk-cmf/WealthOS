"use client";

/**
 * Oniefy - Metas de Economia (E6)
 *
 * CRUD de metas com:
 * - Progresso visual (barra + percentual)
 * - Valor mensal sugerido para atingir a meta no prazo
 * - Meses restantes
 * - Marcar como concluída
 * - Form modal (Padrão A — componente separado)
 */

import { useState } from "react";
import { toast } from "sonner";
import { Target, Plus, Check, Trash2, Pencil, Trophy } from "lucide-react";
import {
  useSavingsGoals,
  useUpdateGoal,
  useDeleteGoal,
} from "@/lib/hooks/use-savings-goals";
import type { SavingsGoalWithProgress } from "@/lib/hooks/use-savings-goals";
import { useAutoReset } from "@/lib/hooks/use-dialog-helpers";
import { formatCurrency, formatDate, formatDecimalBR } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";
import { GoalForm } from "@/components/goals/goal-form";
import type { GoalEditData } from "@/components/goals/goal-form";

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
          <span>{formatDecimalBR(goal.progress_pct, 0)}%</span>
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
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<GoalEditData | null>(null);

  const activeGoals = goals?.filter((g) => !g.is_completed) ?? [];
  const completedGoals = goals?.filter((g) => g.is_completed) ?? [];

  const totalTarget = activeGoals.reduce((s, g) => s + g.target_amount, 0);
  const totalCurrent = activeGoals.reduce((s, g) => s + g.current_amount, 0);
  const totalProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

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
    setEditData({
      id: goal.id,
      name: goal.name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      target_date: goal.target_date ?? null,
      color: goal.color,
    });
    setFormOpen(true);
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
        {!formOpen && (
          <button type="button" onClick={() => { setEditData(null); setFormOpen(true); }}
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
            <span className="text-2xl font-bold tabular-nums">{formatDecimalBR(totalProgress, 0)}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${Math.min(100, totalProgress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!goals || goals.length === 0) && !formOpen && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Target className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Defina seu primeiro objetivo</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Metas financeiras tornam o progresso visível. Comece com algo concreto: reserva de
            emergência, uma viagem, ou a entrada de um imóvel.
          </p>
          <button type="button" onClick={() => { setEditData(null); setFormOpen(true); }}
            className="mt-5 rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground">
            + Criar meta
          </button>
        </div>
      )}

      {/* Active goals */}
      <div className="space-y-4">
        {activeGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => startEdit(goal)}
              onDelete={() => handleDelete(goal.id)}
              onToggleComplete={() => handleToggleComplete(goal)}
            />
        ))}
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
          ))}\
        </div>
      )}

      {/* Form modal (Padrão A) */}
      <GoalForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null); }}
        editData={editData}
      />
    </div>
  );
}
