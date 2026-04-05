"use client";

/**
 * BudgetForm - ORC-01 (criar orçamento), ORC-03 (editar valor)
 *
 * Dialog for creating/editing a budget line.
 * Fields: category, planned_amount, alert_threshold, adjustment_index.
 * Validates: positive amount, category uniqueness (via hook).
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useCategories } from "@/lib/hooks/use-categories";
import {
  useCreateBudget,
  useUpdateBudget,
  ADJUSTMENT_INDEX_OPTIONS,
} from "@/lib/hooks/use-budgets";
import { useCurrencyLabel } from "@/lib/hooks/use-currency-label";
import { formatCurrency } from "@/lib/utils";
import type { Database } from "@/types/database";
import FocusTrap from "focus-trap-react";
import { FormError } from "@/components/ui/form-primitives";

type AdjustmentIndex = Database["public"]["Enums"]["adjustment_index_type"];

interface BudgetFormProps {
  open: boolean;
  onClose: () => void;
  month: string; // ISO date YYYY-MM-DD (first of month)
  familyMemberId?: string | null;
  editData?: {
    id: string;
    category_id: string;
    category_name: string;
    planned_amount: number;
    alert_threshold: number;
    adjustment_index: AdjustmentIndex | null;
  } | null;
}

export function BudgetForm({ open, onClose, month, familyMemberId, editData }: BudgetFormProps) {
  const isEditing = !!editData;

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [threshold, setThreshold] = useState("80");
  const [adjustmentIndex, setAdjustmentIndex] = useState<AdjustmentIndex>("none");
  const [isProposed, setIsProposed] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { symbol: currSymbol } = useCurrencyLabel();
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
      setThreshold(Math.round(editData.alert_threshold * 100).toString());
      setAdjustmentIndex(editData.adjustment_index ?? "none");
      setIsProposed(false);
    } else {
      setCategoryId("");
      setAmount("");
      setThreshold("80");
      setAdjustmentIndex("none");
      setIsProposed(false);
    }
    setError("");
    setShowAdvanced(!!(editData?.adjustment_index && editData.adjustment_index !== "none"));
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
          family_member_id: familyMemberId ?? null,
          approval_status: isProposed ? "proposed" : "approved",
        });
      }
      toast.success(isEditing ? "Orçamento atualizado." : "Orçamento criado com sucesso.");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  }

  if (!open) return null;

  const isPending = createBudget.isPending || updateBudget.isPending;

  return (
    <FocusTrap focusTrapOptions={{ escapeDeactivates: false }}>
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
              <label htmlFor="budget-category" className="text-sm font-medium">Categoria</label>
              <select
                id="budget-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
                aria-required="true"
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
            <label htmlFor="budget-amount" className="text-sm font-medium">Valor orçado ({currSymbol})</label>
            <input
              id="budget-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
              aria-required="true"
            />
            {amount && !isNaN(parseFloat(amount.replace(",", "."))) && (
              <p className="mt-1 text-xs text-muted-foreground">
                {formatCurrency(parseFloat(amount.replace(",", ".")))}
              </p>
            )}
          </div>

          {/* Alert threshold */}
          <div>
            <label htmlFor="budget-threshold" className="text-sm font-medium">
              Alerta ao atingir (%)
            </label>
            <input
              id="budget-threshold"
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

          {/* Adjustment index — collapsed by default */}
          {showAdvanced ? (
            <div>
              <label htmlFor="budget-index" className="text-sm font-medium">Índice de reajuste</label>
              <select
                id="budget-index"
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
          ) : (
            <button
              type="button"
              onClick={() => setShowAdvanced(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
            >
              + Reajuste automático (IPCA, IGP-M)
            </button>
          )}

          {/* Proposed flag (only when creating for a family member) */}
          {!isEditing && familyMemberId && (
            <label className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                checked={isProposed}
                onChange={(e) => setIsProposed(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <span>Proposta pelo membro (aguarda aprovação)</span>
            </label>
          )}

          {/* Error */}
          <FormError message={error} />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-md btn-alive border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {isPending ? "Salvando" : isEditing ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </FocusTrap>
  );
}
