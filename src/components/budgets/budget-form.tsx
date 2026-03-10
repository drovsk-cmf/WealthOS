"use client";

/**
 * BudgetForm - ORC-01 (criar orçamento), ORC-03 (editar valor)
 *
 * Dialog for creating/editing a budget line.
 * Fields: category, planned_amount, alert_threshold, adjustment_index.
 * Validates: positive amount, category uniqueness (via hook).
 */

import { useState, useEffect } from "react";
import { useCategories } from "@/lib/hooks/use-categories";
import {
  useCreateBudget,
  useUpdateBudget,
  ADJUSTMENT_INDEX_OPTIONS,
} from "@/lib/hooks/use-budgets";
import { formatCurrency } from "@/lib/utils";
import type { Database } from "@/types/database";

type AdjustmentIndex = Database["public"]["Enums"]["adjustment_index_type"];

interface BudgetFormProps {
  open: boolean;
  onClose: () => void;
  month: string; // ISO date YYYY-MM-DD (first of month)
  editData?: {
    id: string;
    category_id: string;
    category_name: string;
    planned_amount: number;
    alert_threshold: number;
    adjustment_index: AdjustmentIndex | null;
  } | null;
}

export function BudgetForm({ open, onClose, month, editData }: BudgetFormProps) {
  const isEditing = !!editData;

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [threshold, setThreshold] = useState("80");
  const [adjustmentIndex, setAdjustmentIndex] = useState<AdjustmentIndex>("none");
  const [error, setError] = useState("");

  const { data: categories } = useCategories();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();

  // Only expense categories for budgets
  const expenseCategories = categories?.filter((c) => c.type === "expense") ?? [];

  // Populate form when editing
  useEffect(() => {
    if (editData) {
      setCategoryId(editData.category_id);
      setAmount(editData.planned_amount.toString());
      setThreshold(editData.alert_threshold.toString());
      setAdjustmentIndex(editData.adjustment_index ?? "none");
    } else {
      setCategoryId("");
      setAmount("");
      setThreshold("80");
      setAdjustmentIndex("none");
    }
    setError("");
  }, [editData, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Informe um valor positivo.");
      return;
    }

    const parsedThreshold = parseInt(threshold);
    if (isNaN(parsedThreshold) || parsedThreshold < 1 || parsedThreshold > 100) {
      setError("Limite de alerta deve ser entre 1 e 100 %.");
      return;
    }

    try {
      if (isEditing && editData) {
        await updateBudget.mutateAsync({
          id: editData.id,
          planned_amount: parsedAmount,
          alert_threshold: parsedThreshold,
          adjustment_index: adjustmentIndex === "none" ? null : adjustmentIndex,
        });
      } else {
        if (!categoryId) {
          setError("Selecione uma categoria.");
          return;
        }
        await createBudget.mutateAsync({
          category_id: categoryId,
          month,
          planned_amount: parsedAmount,
          alert_threshold: parsedThreshold,
          adjustment_index: adjustmentIndex === "none" ? null : adjustmentIndex,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  }

  if (!open) return null;

  const isPending = createBudget.isPending || updateBudget.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-50 mx-4 w-full max-w-md rounded-lg border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold">
          {isEditing ? "Editar Orçamento" : "Novo Orçamento"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEditing
            ? `Editando: ${editData?.category_name}`
            : "Defina o limite de gasto mensal para uma categoria."}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Category (only for creation) */}
          {!isEditing && (
            <div>
              <label className="text-sm font-medium">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Selecione</option>
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="text-sm font-medium">Valor orçado (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
            {amount && !isNaN(parseFloat(amount.replace(",", "."))) && (
              <p className="mt-1 text-xs text-muted-foreground">
                {formatCurrency(parseFloat(amount.replace(",", ".")))}
              </p>
            )}
          </div>

          {/* Alert threshold */}
          <div>
            <label className="text-sm font-medium">
              Alerta ao atingir (%)
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              O card ficará amarelo ao atingir este percentual
            </p>
          </div>

          {/* Adjustment index */}
          <div>
            <label className="text-sm font-medium">Índice de reajuste</label>
            <select
              value={adjustmentIndex}
              onChange={(e) =>
                setAdjustmentIndex(e.target.value as AdjustmentIndex)
              }
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {ADJUSTMENT_INDEX_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? "Salvando" : isEditing ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
