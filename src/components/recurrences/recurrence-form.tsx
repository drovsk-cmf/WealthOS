"use client";

/**
 * RecurrenceForm - CAP-01 (criar recorrência), CAP-02 (editar)
 *
 * Dialog for creating/editing a recurring bill.
 * Fields: account, category, type, amount, description, frequency, start_date,
 *         end_date, adjustment_index, adjustment_rate.
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import {
  useCreateRecurrence,
  useUpdateRecurrence,
  FREQUENCY_OPTIONS,
} from "@/lib/hooks/use-recurrences";
import { ADJUSTMENT_INDEX_OPTIONS } from "@/lib/hooks/use-budgets";
import { useCurrencyLabel } from "@/lib/hooks/use-currency-label";
import type { Database } from "@/types/database";
import FocusTrap from "focus-trap-react";
import { FormError } from "@/components/ui/form-primitives";
import { MoneyInput } from "@/components/ui/money-input";

type Frequency = Database["public"]["Enums"]["recurrence_frequency"];
type AdjustmentIndex = Database["public"]["Enums"]["adjustment_index_type"];

interface RecurrenceFormProps {
  open: boolean;
  onClose: () => void;
  editData?: {
    id: string;
    frequency: Frequency;
    interval_count: number;
    end_date: string | null;
    adjustment_index: AdjustmentIndex | null;
    adjustment_rate: number | null;
    template_transaction: Record<string, unknown>;
  } | null;
}

export function RecurrenceForm({ open, onClose, editData }: RecurrenceFormProps) {
  const isEditing = !!editData;

  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [intervalCount, setIntervalCount] = useState("1");
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState("");
  const [adjustmentIndex, setAdjustmentIndex] = useState<AdjustmentIndex>("none");
  const [adjustmentRate, setAdjustmentRate] = useState("");
  const { symbol: currSymbol } = useCurrencyLabel();
  const [error, setError] = useState("");

  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const createRecurrence = useCreateRecurrence();
  const updateRecurrence = useUpdateRecurrence();

  const filteredCategories = categories?.filter((c) => c.type === type) ?? [];

  useEffect(() => {
    if (editData) {
      const t = editData.template_transaction;
      setAccountId((t.account_id as string) ?? "");
      setCategoryId((t.category_id as string) ?? "");
      setType((t.type as "expense" | "income") ?? "expense");
      setAmount(Number(t.amount) || 0);
      setDescription((t.description as string) ?? "");
      setFrequency(editData.frequency);
      setIntervalCount(String(editData.interval_count));
      setEndDate(editData.end_date ?? "");
      setAdjustmentIndex(editData.adjustment_index ?? "none");
      setAdjustmentRate(editData.adjustment_rate ? String(editData.adjustment_rate) : "");
    } else {
      setAccountId("");
      setCategoryId("");
      setType("expense");
      setAmount(0);
      setDescription("");
      setFrequency("monthly");
      setIntervalCount("1");
      setStartDate(new Date().toISOString().slice(0, 10));
      setEndDate("");
      setAdjustmentIndex("none");
      setAdjustmentRate("");
    }
    setError("");
  }, [editData, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsedAmount = amount;
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Informe um valor positivo.");
      return;
    }

    try {
      if (isEditing && editData) {
        await updateRecurrence.mutateAsync({
          id: editData.id,
          frequency,
          interval_count: parseInt(intervalCount) || 1,
          end_date: endDate || null,
          adjustment_index: adjustmentIndex === "none" ? null : adjustmentIndex,
          adjustment_rate: adjustmentRate ? parseFloat(adjustmentRate) : null,
          template: {
            account_id: accountId,
            category_id: categoryId || undefined,
            type,
            amount: parsedAmount,
            description: description || undefined,
          },
        });
      } else {
        if (!accountId) {
          setError("Selecione uma conta.");
          return;
        }
        await createRecurrence.mutateAsync({
          frequency,
          interval_count: parseInt(intervalCount) || 1,
          start_date: startDate,
          end_date: endDate || null,
          adjustment_index: adjustmentIndex === "none" ? null : adjustmentIndex,
          adjustment_rate: adjustmentRate ? parseFloat(adjustmentRate) : null,
          template: {
            account_id: accountId,
            category_id: categoryId || null,
            type,
            amount: parsedAmount,
            description: description || null,
          },
        });
      }
      toast.success(isEditing ? "Recorrência atualizada." : "Recorrência criada com sucesso.");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  }

  if (!open) return null;
  const isPending = createRecurrence.isPending || updateRecurrence.isPending;

  return (
    <FocusTrap focusTrapOptions={{ escapeDeactivates: false }}>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold">
          {isEditing ? "Editar Recorrência" : "Nova Conta Recorrente"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type toggle */}
          <div role="radiogroup" aria-label="Tipo de recorrência" className="flex gap-2">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={type === t}
                onClick={() => { setType(t); setCategoryId(""); }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  type === t
                    ? t === "expense"
                      ? "bg-terracotta/15 text-terracotta"
                      : "bg-verdant/15 text-verdant"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {t === "expense" ? "Despesa" : "Receita"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Account */}
            <div>
              <label htmlFor="rec-account" className="text-sm font-medium">Conta</label>
              <select id="rec-account" value={accountId} onChange={(e) => setAccountId(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required aria-required="true">
                <option value="">Selecione</option>
                {accounts?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="rec-category" className="text-sm font-medium">Categoria</label>
              <select id="rec-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Nenhuma</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount + Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="rec-amount" className="text-sm font-medium">Valor ({currSymbol})</label>
              <MoneyInput id="rec-amount" value={amount}
                onChange={setAmount}
                aria-required="true"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="rec-description" className="text-sm font-medium">Descrição</label>
              <input id="rec-description" type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Aluguel"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Frequency + Interval */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="rec-frequency" className="text-sm font-medium">Frequência</label>
              <select id="rec-frequency" value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {FREQUENCY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rec-interval" className="text-sm font-medium">A cada</label>
              <div className="mt-1 flex items-center gap-2">
                <input id="rec-interval" type="number" min={1} max={12} value={intervalCount}
                  onChange={(e) => setIntervalCount(e.target.value)}
                  className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm" />
                <span className="text-sm text-muted-foreground">
                  {frequency === "daily" ? "dia(s)" : frequency === "weekly" ? "semana(s)" : frequency === "monthly" ? "mês(es)" : "ano(s)"}
                </span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            {!isEditing && (
              <div>
                <label htmlFor="rec-start" className="text-sm font-medium">Início</label>
                <input id="rec-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required aria-required="true" />
              </div>
            )}
            <div>
              <label htmlFor="rec-end" className="text-sm font-medium">Fim (opcional)</label>
              <input id="rec-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Adjustment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="rec-adj-index" className="text-sm font-medium">Reajuste</label>
              <select id="rec-adj-index" value={adjustmentIndex}
                onChange={(e) => setAdjustmentIndex(e.target.value as AdjustmentIndex)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {ADJUSTMENT_INDEX_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {adjustmentIndex === "manual" && (
              <div>
                <label htmlFor="rec-adj-rate" className="text-sm font-medium">Taxa (% ao período)</label>
                <input id="rec-adj-rate" type="text" inputMode="decimal" value={adjustmentRate}
                  onChange={(e) => setAdjustmentRate(e.target.value)} placeholder="0,00"
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
            )}
          </div>

          <FormError message={error} />

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isPending}
              className="rounded-md btn-alive border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {isPending ? "Salvando" : isEditing ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </FocusTrap>
  );
}
