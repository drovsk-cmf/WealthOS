"use client";

/**
 * TransactionForm (UX-H1-04 + P6)
 *
 * Quick mode (P6): valor + descrição + conta
 *   - Tipo default: despesa (80% dos casos)
 *   - Data default: hoje
 *   - Status default: pago
 *   - Categoria: inferida automaticamente pela descrição
 *
 * Expanded ("Mais opções"):
 *   - Tipo, categoria, data, pago/pendente, membro, asset, notas
 *
 * Transfer mode shows destination account instead of category.
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Sparkles, Camera } from "lucide-react";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { useFamilyMembers } from "@/lib/hooks/use-family-members";
import { useAssets } from "@/lib/hooks/use-assets";
import { useAutoCategory, learnCategoryPattern } from "@/lib/hooks/use-auto-category";
import { useCreateTransaction, useCreateTransfer, useEditTransaction, useEditTransfer } from "@/lib/services/transaction-engine";
import { useOcrReceipt } from "@/lib/services/ocr-service";
import { useCurrencyLabel } from "@/lib/hooks/use-currency-label";
import { formatCurrency, formatDecimalBR, toLocalDateString } from "@/lib/utils";
import type { Database } from "@/types/database";
import FocusTrap from "focus-trap-react";
import { FormError } from "@/components/ui/form-primitives";

type TransactionType = Database["public"]["Enums"]["transaction_type"];
type CategoryType = Database["public"]["Enums"]["category_type"];

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
  /** Pre-fill fields (for Duplicate or Edit) */
  prefill?: {
    type?: TransactionType;
    amount?: string;
    description?: string;
    accountId?: string;
    categoryId?: string;
    familyMemberId?: string;
    notes?: string;
    toAccountId?: string; // for transfer editing
  } | null;
  /** When set, form submits as edit (reverse + re-create) instead of create */
  editTransactionId?: string | null;
}

const TYPE_CONFIG: Record<
  TransactionType,
  { label: string; color: string; bgColor: string }
> = {
  expense: { label: "Despesa", color: "text-terracotta", bgColor: "border-terracotta bg-terracotta/10" },
  income: { label: "Receita", color: "text-verdant", bgColor: "border-verdant bg-verdant/10" },
  transfer: { label: "Transferência", color: "text-info-slate", bgColor: "border-info-slate bg-info-slate/10" },
};

export function TransactionForm({ open, onClose, defaultType = "expense", prefill, editTransactionId }: TransactionFormProps) {
  // Hooks
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { data: familyMembers } = useFamilyMembers();
  const { data: assets } = useAssets();
  const createTransaction = useCreateTransaction();

  // Form state
  const [type, setType] = useState<TransactionType>(prefill?.type ?? defaultType);
  const [accountId, setAccountId] = useState(prefill?.accountId ?? "");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState(prefill?.categoryId ?? "");
  const [familyMemberId, setFamilyMemberId] = useState(prefill?.familyMemberId ?? "");
  const [assetId, setAssetId] = useState("");
  const [amount, setAmount] = useState(prefill?.amount ?? "");
  const [description, setDescription] = useState(prefill?.description ?? "");
  const [date, setDate] = useState(toLocalDateString());
  const [isPaid, setIsPaid] = useState(true);
  const [notes, setNotes] = useState(prefill?.notes ?? "");
  const { symbol: currSymbol } = useCurrencyLabel();
  const [error, setError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(!!prefill);

  const createTransfer = useCreateTransfer();
  const editTransaction = useEditTransaction();
  const editTransferMutation = useEditTransfer();
  const ocrReceipt = useOcrReceipt();
  const loading = createTransaction.isPending || createTransfer.isPending || editTransaction.isPending || editTransferMutation.isPending;
  const scanning = ocrReceipt.isPending;

  // UX-H2-01: Auto-categorization
  const [manualCategory, setManualCategory] = useState(false);
  const { suggestedCategoryId } = useAutoCategory(
    description,
    type !== "transfer" && !manualCategory && !categoryId
  );

  // Apply suggestion when it arrives and user hasn't manually chosen
  useEffect(() => {
    if (suggestedCategoryId && !manualCategory && !categoryId) {
      setCategoryId(suggestedCategoryId);
    }
  }, [suggestedCategoryId, manualCategory, categoryId]);

  // Reset on open (respect prefill for Duplicate feature - DT-027)
  useEffect(() => {
    if (open) {
      setType(prefill?.type ?? defaultType);
      setAccountId(prefill?.accountId ?? accounts?.[0]?.id ?? "");
      setToAccountId(prefill?.toAccountId ?? "");
      setCategoryId(prefill?.categoryId ?? "");
      setFamilyMemberId(prefill?.familyMemberId ?? "");
      setAmount(prefill?.amount ?? "");
      setDescription(prefill?.description ?? "");
      setDate(toLocalDateString());
      setIsPaid(true);
      setNotes(prefill?.notes ?? "");
      setAssetId("");
      setError(null);
      setShowMore(!!prefill);
      setManualCategory(!!prefill?.categoryId);
    }
  }, [open, defaultType, accounts, prefill]);

  // Close on ESC key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const categoryType: CategoryType = type === "income" ? "income" : "expense";
  const filteredCategories = categories?.filter((c) => c.type === categoryType) ?? [];
  const transferAccounts = accounts?.filter((a) => a.id !== accountId) ?? [];
  const hasMultipleAccounts = (accounts?.length ?? 0) > 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount.replace(",", "."));
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
      if (editTransactionId && type === "transfer") {
        // 3.4: Edit transfer (atomic reverse pair + re-create)
        await editTransferMutation.mutateAsync({
          original_transaction_id: editTransactionId,
          from_account_id: accountId,
          to_account_id: toAccountId,
          amount: parsedAmount,
          description: description || null,
          date,
          is_paid: isPaid,
        });
        toast.success("Transferência editada.");
      } else if (editTransactionId && type !== "transfer") {
        // DT-012: Edit mode (atomic reverse + re-create)
        await editTransaction.mutateAsync({
          original_transaction_id: editTransactionId,
          account_id: accountId,
          category_id: categoryId || null,
          category_source: categoryId
            ? manualCategory ? "manual" : "auto"
            : null,
          type,
          amount: parsedAmount,
          description: description || null,
          date,
          is_paid: isPaid,
          notes: notes || null,
          family_member_id: familyMemberId || null,
          asset_id: assetId || null,
        });
        toast.success("Transação editada.");
      } else if (type === "transfer") {
        await createTransfer.mutateAsync({
          from_account_id: accountId,
          to_account_id: toAccountId,
          amount: parsedAmount,
          description: description || null,
          date,
          is_paid: isPaid,
        });
        toast.success("Transação criada com sucesso.");
      } else {
        await createTransaction.mutateAsync({
          account_id: accountId,
          category_id: categoryId || null,
          category_source: categoryId
            ? manualCategory ? "manual" : "auto"
            : null,
          type,
          amount: parsedAmount,
          description: description || null,
          date,
          is_paid: isPaid,
          notes: notes || null,
          family_member_id: familyMemberId || null,
          asset_id: assetId || null,
        });
        toast.success("Transação criada com sucesso.");
      }

      // P10: Learn from manual category correction (fire-and-forget)
      if (manualCategory && categoryId && description.trim()) {
        learnCategoryPattern(description, categoryId);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  }

  if (!open) return null;

  return (
    <FocusTrap focusTrapOptions={{ escapeDeactivates: false }}>
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl sm:rounded-lg bg-card p-6 shadow-elevated">
        <h2 className="text-lg font-semibold">{editTransactionId ? "Editar transação" : "Nova transação"}</h2>

        {/* FIN-17: OCR scan button (new transactions only) */}
        {!editTransactionId && type !== "transfer" && (
          <div className="mt-2">
            <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md btn-alive border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent ${scanning ? "opacity-60" : ""}`}>
              <Camera className="h-3.5 w-3.5" />
              {scanning ? "Escaneando..." : "Preencher por foto ou PDF"}
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                disabled={scanning}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  e.target.value = "";
                  try {
                    const result = await ocrReceipt.mutateAsync(file);
                    if (result.parsed.amount) {
                      setAmount(formatDecimalBR(result.parsed.amount));
                    }
                    if (result.parsed.date) {
                      setDate(result.parsed.date);
                    }
                    if (result.parsed.description) {
                      setDescription(result.parsed.description);
                      setShowMore(true);
                    }
                    toast.success(
                      `OCR: confiança ${formatDecimalBR(result.confidence, 0)}%` +
                      (result.parsed.amount ? ` · ${formatCurrency(result.parsed.amount)}` : "") +
                      (result.parsed.date ? ` · ${result.parsed.date}` : "")
                    );
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Erro no OCR.");
                  }
                }}
              />
            </label>
          </div>
        )}

        <FormError message={error} />

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* ═══ QUICK MODE: valor + descrição + conta (P6) ═══ */}

          {/* Decision 1: Amount (autofocus) */}
          <div className="space-y-1.5">
            <label htmlFor="tx-amount" className="text-sm font-medium">
              Valor ({currSymbol})
            </label>
            <input
              id="tx-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              aria-required="true"
              className="flex h-14 w-full rounded-md border border-input bg-background px-4 py-2 text-2xl font-bold tabular-nums ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoFocus
            />
            {amount && parseFloat(amount.replace(",", ".")) > 0 && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(parseFloat(amount.replace(",", ".")))}
              </p>
            )}
          </div>

          {/* Decision 2: Description (quick, triggers auto-categorization) */}
          <div className="space-y-1.5">
            <label htmlFor="tx-desc-quick" className="text-sm font-medium">
              Descrição
            </label>
            <input
              id="tx-desc-quick"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, Uber, Aluguel"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Decision 3: Account (only shown as dropdown if >1 account) */}
          {hasMultipleAccounts && (
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
                {accounts?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatCurrency(a.current_balance)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Transfer destination (only for transfers) */}
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

          {/* ═══ EXPANDABLE: More options ═══ */}
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {showMore ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showMore ? "Menos opções" : "Mais opções (tipo, categoria, data)"}
          </button>

          {showMore && (
            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              {/* Type toggle (moved from quick mode in P6) */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tipo</label>
                <div role="radiogroup" aria-label="Tipo de transação" className="flex gap-1 rounded-lg border bg-muted p-1">
                  {(["expense", "income", "transfer"] as TransactionType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={type === t}
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
              </div>

              {/* Category (not for transfers) */}
              {type !== "transfer" && (
                <div className="space-y-1.5">
                  <label htmlFor="tx-category" className="flex items-center gap-1.5 text-sm font-medium">
                    Categoria
                    {categoryId && !manualCategory && suggestedCategoryId && (
                      <span className="flex items-center gap-0.5 text-xs font-normal text-primary">
                        <Sparkles className="h-3 w-3" />
                        sugerida
                      </span>
                    )}
                  </label>
                  <select
                    id="tx-category"
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      setManualCategory(!!e.target.value);
                    }}
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
                  <label htmlFor="tx-status" className="text-sm font-medium">Status</label>
                  <button
                    id="tx-status"
                    type="button"
                    onClick={() => setIsPaid(!isPaid)}
                    aria-pressed={isPaid}
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

              {/* Family member */}
              {type !== "transfer" && familyMembers && familyMembers.length > 0 && (
                <div className="space-y-1.5">
                  <label htmlFor="tx-member" className="text-sm font-medium">
                    Membro
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

              {/* Notes */}
              {type !== "transfer" && (
                <div className="space-y-1.5">
                  <label htmlFor="tx-notes" className="text-sm font-medium">
                    Notas
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

              {/* Asset (P6/P7a: vincular despesa a um bem) */}
              {type === "expense" && assets && assets.length > 0 && (
                <div className="space-y-1.5">
                  <label htmlFor="tx-asset" className="text-sm font-medium">
                    Bem relacionado
                  </label>
                  <select
                    id="tx-asset"
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Nenhum</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground">
                    Vincule esta despesa a um bem para rastrear custos acumulados.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ═══ ACTION BUTTONS ═══ */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md btn-alive border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
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
              {loading ? "Salvando" : editTransactionId ? "Salvar alterações" : `Lançar ${TYPE_CONFIG[type].label.toLowerCase()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
    </FocusTrap>
  );
}
