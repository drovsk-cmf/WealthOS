"use client";

import { useState, useEffect } from "react";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { useFamilyMembers } from "@/lib/hooks/use-family-members";
import { useCreateTransaction, useCreateTransfer } from "@/lib/services/transaction-engine";
import { formatCurrency } from "@/lib/utils";
import type { Database } from "@/types/database";

type TransactionType = Database["public"]["Enums"]["transaction_type"];
type CategoryType = Database["public"]["Enums"]["category_type"];

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

const TYPE_CONFIG: Record<
  TransactionType,
  { label: string; color: string; bgColor: string }
> = {
  expense: { label: "Despesa", color: "text-terracotta", bgColor: "border-terracotta bg-terracotta/10" },
  income: { label: "Receita", color: "text-verdant", bgColor: "border-verdant bg-verdant/10" },
  transfer: { label: "Transferência", color: "text-info-slate", bgColor: "border-info-slate bg-info-slate/10" },
};

export function TransactionForm({ open, onClose, defaultType = "expense" }: TransactionFormProps) {
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { data: familyMembers } = useFamilyMembers();

  const createTransaction = useCreateTransaction();
  const createTransfer = useCreateTransfer();
  const loading = createTransaction.isPending || createTransfer.isPending;

  // Form state
  const [type, setType] = useState<TransactionType>(defaultType);
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState(""); // transfer destination
  const [categoryId, setCategoryId] = useState("");
  const [familyMemberId, setFamilyMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isPaid, setIsPaid] = useState(true);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setType(defaultType);
      setAccountId(accounts?.[0]?.id ?? "");
      setToAccountId("");
      setCategoryId("");
      setFamilyMemberId("");
      setAmount("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      setIsPaid(true);
      setNotes("");
      setError(null);
    }
  }, [open, defaultType, accounts]);

  // Close on ESC key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Filter categories by transaction type
  const categoryType: CategoryType = type === "income" ? "income" : "expense";
  const filteredCategories = categories?.filter((c) => c.type === categoryType) ?? [];

  // Available destination accounts for transfer (exclude source)
  const transferAccounts = accounts?.filter((a) => a.id !== accountId) ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Valor deve ser maior que zero.");
      return;
    }
    if (!accountId) {
      setError("Selecione uma conta.");
      return;
    }
    if (type === "transfer" && !toAccountId) {
      setError("Selecione a conta de destino.");
      return;
    }
    if (type === "transfer" && accountId === toAccountId) {
      setError("Conta de origem e destino devem ser diferentes.");
      return;
    }

    try {
      if (type === "transfer") {
        await createTransfer.mutateAsync({
          from_account_id: accountId,
          to_account_id: toAccountId,
          amount: parsedAmount,
          description: description || null,
          date,
          is_paid: isPaid,
        });
      } else {
        await createTransaction.mutateAsync({
          account_id: accountId,
          category_id: categoryId || null,
          type,
          amount: parsedAmount,
          description: description || null,
          date,
          is_paid: isPaid,
          notes: notes || null,
          family_member_id: familyMemberId || null,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Nova transação</h2>

        {error && (
          <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type selector */}
          <div className="flex gap-1 rounded-lg border bg-muted p-1">
            {(["expense", "income", "transfer"] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  type === t
                    ? `${TYPE_CONFIG[t].bgColor} ${TYPE_CONFIG[t].color}`
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {TYPE_CONFIG[t].label}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label htmlFor="tx-amount" className="text-sm font-medium">
              Valor (R$)
            </label>
            <input
              id="tx-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-lg font-semibold ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoFocus
            />
            {amount && parseFloat(amount) > 0 && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(parseFloat(amount))}
              </p>
            )}
          </div>

          {/* Account (source) */}
          <div className="space-y-1.5">
            <label htmlFor="tx-account" className="text-sm font-medium">
              {type === "transfer" ? "Conta de origem" : "Conta"}
            </label>
            <select
              id="tx-account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Selecione</option>
              {accounts?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatCurrency(a.current_balance)})
                </option>
              ))}
            </select>
          </div>

          {/* Transfer destination */}
          {type === "transfer" && (
            <div className="space-y-1.5">
              <label htmlFor="tx-to-account" className="text-sm font-medium">
                Conta de destino
              </label>
              <select
                id="tx-to-account"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecione</option>
                {transferAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatCurrency(a.current_balance)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category (not for transfers) */}
          {type !== "transfer" && (
            <div className="space-y-1.5">
              <label htmlFor="tx-category" className="text-sm font-medium">
                Categoria
              </label>
              <select
                id="tx-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Sem categoria</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="tx-desc" className="text-sm font-medium">
              Descrição
            </label>
            <input
              id="tx-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, Salário, etc."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Family member (optional) */}
          {type !== "transfer" && familyMembers && familyMembers.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="tx-member" className="text-sm font-medium">
                Membro <span className="font-normal text-muted-foreground">(opcional)</span>
              </label>
              <select
                id="tx-member"
                value={familyMemberId}
                onChange={(e) => setFamilyMemberId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Família (Geral)</option>
                {familyMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.avatar_emoji} {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date + Paid toggle row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="tx-date" className="text-sm font-medium">
                Data
              </label>
              <input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <button
                type="button"
                onClick={() => setIsPaid(!isPaid)}
                className={`flex h-10 w-full items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors ${
                  isPaid
                    ? "border-verdant/30 bg-verdant/10 text-verdant"
                    : "border-burnished/30 bg-burnished/10 text-burnished"
                }`}
              >
                {isPaid ? (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Pago
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pendente
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Notes (collapsible) */}
          {type !== "transfer" && (
            <div className="space-y-1.5">
              <label htmlFor="tx-notes" className="text-sm font-medium">
                Notas <span className="text-muted-foreground">(opcional)</span>
              </label>
              <textarea
                id="tx-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Observações adicionais"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                type === "income"
                  ? "bg-verdant hover:bg-verdant/80"
                  : type === "transfer"
                    ? "bg-info-slate hover:bg-info-slate/80"
                    : "bg-terracotta hover:bg-terracotta/80"
              }`}
            >
              {loading ? "Salvando" : `Lançar ${TYPE_CONFIG[type].label.toLowerCase()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
