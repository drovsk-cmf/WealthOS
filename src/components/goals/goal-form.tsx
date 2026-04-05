"use client";

/**
 * GoalForm - Padrão A (componente separado + modal overlay)
 *
 * Criar/editar metas de economia. Segue o mesmo padrão de
 * AccountForm, AssetForm, CardForm, etc.
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  useCreateGoal,
  useUpdateGoal,
} from "@/lib/hooks/use-savings-goals";
import FocusTrap from "focus-trap-react";
import { MoneyInput } from "@/components/ui/money-input";

const GOAL_COLORS = [
  { value: "#56688F", label: "Azul" },
  { value: "#2F7A68", label: "Verde" },
  { value: "#A97824", label: "Dourado" },
  { value: "#A64A45", label: "Vermelho" },
  { value: "#6F6678", label: "Roxo" },
  { value: "#4F2F69", label: "Plum" },
];

export interface GoalEditData {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  color: string;
}

interface GoalFormProps {
  open: boolean;
  onClose: () => void;
  editData?: GoalEditData | null;
}

export function GoalForm({ open, onClose, editData }: GoalFormProps) {
  const isEdit = !!editData;

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [targetDate, setTargetDate] = useState("");
  const [color, setColor] = useState(GOAL_COLORS[0].value);

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const isPending = createGoal.isPending || updateGoal.isPending;

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setTargetAmount(editData.target_amount);
      setCurrentAmount(editData.current_amount);
      setTargetDate(editData.target_date ?? "");
      setColor(editData.color);
    } else {
      setName("");
      setTargetAmount(0);
      setCurrentAmount(0);
      setTargetDate("");
      setColor(GOAL_COLORS[0].value);
    }
  }, [editData, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || targetAmount <= 0) return;

    try {
      if (isEdit && editData) {
        await updateGoal.mutateAsync({
          id: editData.id,
          name: name.trim(),
          target_amount: targetAmount,
          current_amount: currentAmount,
          target_date: targetDate || null,
          color,
        });
        toast.success("Meta atualizada.");
      } else {
        await createGoal.mutateAsync({
          name: name.trim(),
          target_amount: targetAmount,
          current_amount: currentAmount,
          target_date: targetDate || null,
          color,
        });
        toast.success("Meta criada.");
      }
      onClose();
    } catch {
      toast.error("Erro ao salvar meta.");
    }
  }

  if (!open) return null;

  return (
    <FocusTrap focusTrapOptions={{ allowOutsideClick: true, escapeDeactivates: true, onDeactivate: onClose }}>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl border bg-card p-6 shadow-lg mx-4">
        <h2 className="text-lg font-bold">{isEdit ? "Editar meta" : "Nova meta"}</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Nome da meta</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Reserva de emergência, Viagem Europa"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Valor alvo (R$)</label>
              <MoneyInput
                value={targetAmount}
                onChange={setTargetAmount}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Valor atual (R$)</label>
              <MoneyInput
                value={currentAmount}
                onChange={setCurrentAmount}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Data alvo (opcional)</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
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
                    onClick={() => setColor(c.value)}
                    className={`h-7 w-7 rounded-full border-2 transition-transform ${
                      color === c.value ? "scale-110 border-foreground" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} disabled={isPending}
              className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent btn-alive">
              Cancelar
            </button>
            <button type="submit" disabled={isPending || !name || targetAmount <= 0}
              className="rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40">
              {isPending ? "Salvando..." : isEdit ? "Salvar" : "Criar meta"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </FocusTrap>
  );
}
