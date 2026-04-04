"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  useCreateAccount,
  useUpdateAccount,
  PRESET_COLORS,
} from "@/lib/hooks/use-accounts";
import { useBankInstitutions } from "@/lib/hooks/use-bank-institutions";
import { formatCurrency, getColorName } from "@/lib/utils";
import type { Database } from "@/types/database";
import FocusTrap from "focus-trap-react";

type Account = Database["public"]["Tables"]["accounts"]["Row"];

interface CardFormProps {
  card?: Account | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Credit card form (E17).
 * Dedicated form with card-specific fields only:
 * - Name, bank, credit limit, closing day, due day, interest rate, balance, color.
 * No branch/account/digit fields. No liquidity tier (deterministic T4).
 */
export function CardForm({ card, open, onClose }: CardFormProps) {
  const isEdit = !!card;

  const [name, setName] = useState("");
  const [bankInstitutionId, setBankInstitutionId] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [closingDay, setClosingDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [balanceMode, setBalanceMode] = useState<"total" | "last" | "zero">("total");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [showRateField, setShowRateField] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: bankInstitutions } = useBankInstitutions();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const loading = createAccount.isPending || updateAccount.isPending;

  useEffect(() => {
    if (card) {
      setName(card.name);
      setBankInstitutionId(card.bank_institution_id ?? "");
      setCreditLimit(card.credit_limit ? String(card.credit_limit) : "");
      setClosingDay(card.closing_day ? String(card.closing_day) : "");
      setDueDay(card.due_day ? String(card.due_day) : "");
      setInterestRate(card.interest_rate ? String(card.interest_rate).replace(".", ",") : "");
      setColor(card.color || PRESET_COLORS[0]);
    } else {
      setName("");
      setBankInstitutionId("");
      setCreditLimit("");
      setClosingDay("");
      setDueDay("");
      setInterestRate("");
      setInitialBalance("");
      setBalanceMode("total");
      setColor(PRESET_COLORS[0]);
    }
    setError(null);
    setShowRateField(!!card?.interest_rate);
  }, [card, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nome do cartão é obrigatório.");
      return;
    }

    const parsedLimit = creditLimit
      ? parseFloat(creditLimit.replace(/\./g, "").replace(",", "."))
      : null;
    const parsedClosing = closingDay ? parseInt(closingDay, 10) : null;
    const parsedDue = dueDay ? parseInt(dueDay, 10) : null;
    const parsedRate = interestRate
      ? parseFloat(interestRate.replace(",", "."))
      : null;

    if (parsedClosing !== null && (parsedClosing < 1 || parsedClosing > 31)) {
      setError("Dia de fechamento deve ser entre 1 e 31.");
      return;
    }
    if (parsedDue !== null && (parsedDue < 1 || parsedDue > 31)) {
      setError("Dia de vencimento deve ser entre 1 e 31.");
      return;
    }

    try {
      if (isEdit && card) {
        await updateAccount.mutateAsync({
          id: card.id,
          name: name.trim(),
          type: "credit_card",
          color,
          credit_limit: parsedLimit,
          closing_day: parsedClosing,
          due_day: parsedDue,
          interest_rate: parsedRate,
          bank_institution_id: bankInstitutionId || null,
        } as Parameters<typeof updateAccount.mutateAsync>[0]);
      } else {
        const balanceRaw = initialBalance.replace(/\./g, "").replace(",", ".");
        let balance = parseFloat(balanceRaw) || 0;
        if (balance > 0) balance = -balance;

        await createAccount.mutateAsync({
          name: name.trim(),
          type: "credit_card",
          initial_balance: balance,
          color,
          credit_limit: parsedLimit,
          closing_day: parsedClosing,
          due_day: parsedDue,
          interest_rate: parsedRate,
          bank_institution_id: bankInstitutionId || null,
        } as Parameters<typeof createAccount.mutateAsync>[0]);
      }
      toast.success(isEdit ? "Cartão atualizado." : "Cartão cadastrado.");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar cartão.";
      setError(msg);
      toast.error(msg);
    }
  }

  if (!open) return null;

  return (
    <FocusTrap focusTrapOptions={{ escapeDeactivates: false }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-card p-6 shadow-elevated">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Editar cartão" : "Novo cartão de crédito"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEdit
              ? "Atualize os dados do cartão."
              : "Cadastre seu cartão com limite, fechamento e vencimento."}
          </p>

          {error && (
            <div
              role="alert"
              className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="card-name" className="text-sm font-medium">
                Nome do cartão
              </label>
              <input
                id="card-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Nubank, Itaú Platinum"
                aria-required="true"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                autoFocus
              />
            </div>

            {/* Bank */}
            <div className="space-y-1.5">
              <label htmlFor="card-bank" className="text-sm font-medium">
                Emissor
              </label>
              <select
                id="card-bank"
                value={bankInstitutionId}
                onChange={(e) => setBankInstitutionId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecione o emissor</option>
                {bankInstitutions?.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.compe_code} - {bank.short_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Credit limit */}
            <div className="space-y-1.5">
              <label htmlFor="card-limit" className="text-sm font-medium">
                Limite (R$)
              </label>
              <input
                id="card-limit"
                type="text"
                inputMode="decimal"
                value={creditLimit}
                onChange={(e) => {
                  setCreditLimit(e.target.value.replace(/[^\d.,]/g, ""));
                }}
                onBlur={() => {
                  if (!creditLimit) return;
                  const n = parseFloat(creditLimit.replace(/\./g, "").replace(",", "."));
                  if (!isNaN(n)) {
                    setCreditLimit(
                      n.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    );
                  }
                }}
                placeholder="0,00"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* Closing day + Due day side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="card-closing" className="text-sm font-medium">
                  Fechamento (dia)
                </label>
                <input
                  id="card-closing"
                  type="text"
                  inputMode="numeric"
                  value={closingDay}
                  onChange={(e) =>
                    setClosingDay(e.target.value.replace(/\D/g, "").slice(0, 2))
                  }
                  placeholder="Ex: 20"
                  maxLength={2}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm tabular-nums ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="card-due" className="text-sm font-medium">
                  Vencimento (dia)
                </label>
                <input
                  id="card-due"
                  type="text"
                  inputMode="numeric"
                  value={dueDay}
                  onChange={(e) =>
                    setDueDay(e.target.value.replace(/\D/g, "").slice(0, 2))
                  }
                  placeholder="Ex: 10"
                  maxLength={2}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm tabular-nums ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              Dias do mês (1 a 31). Usado para alertas e calendário financeiro.
            </p>

            {/* Interest rate — collapsed by default */}
            {showRateField ? (
              <div className="space-y-1.5">
                <label htmlFor="card-rate" className="text-sm font-medium">
                  Taxa rotativo (% a.m.)
                </label>
                <input
                  id="card-rate"
                  type="text"
                  inputMode="decimal"
                  value={interestRate}
                  onChange={(e) => {
                    setInterestRate(e.target.value.replace(/[^\d.,]/g, ""));
                  }}
                  placeholder="Ex: 14,90"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  Use vírgula como decimal. Usada na análise de custo de dívida.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowRateField(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
              >
                + Informar taxa de juros do rotativo
              </button>
            )}

            {/* Initial balance - 3 alternatives (E18) */}
            {!isEdit && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Como quer informar o saldo?</p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: "total", label: "Sei o total da fatura aberta", desc: "Informe o valor total que você deve" },
                    { value: "last", label: "Sei o valor da última fatura", desc: "Usamos como saldo inicial estimado" },
                    { value: "zero", label: "Não sei / cartão novo", desc: "Começa zerado, ajusta com importações" },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        balanceMode === opt.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-accent/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="balance-mode"
                        value={opt.value}
                        checked={balanceMode === opt.value}
                        onChange={() => setBalanceMode(opt.value as "total" | "last" | "zero")}
                        className="mt-0.5 accent-primary"
                      />
                      <div>
                        <span className="text-sm font-medium">{opt.label}</span>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {balanceMode !== "zero" && (
                  <div className="space-y-1.5">
                    <label htmlFor="card-balance" className="text-sm font-medium">
                      {balanceMode === "total"
                        ? "Valor total da fatura aberta (R$)"
                        : "Valor da última fatura paga (R$)"}
                    </label>
                    <input
                      id="card-balance"
                      type="text"
                      inputMode="decimal"
                      value={initialBalance}
                      onChange={(e) => {
                        setInitialBalance(e.target.value.replace(/[^\d.,]/g, ""));
                      }}
                      onBlur={() => {
                        if (!initialBalance) return;
                        const n = parseFloat(
                          initialBalance.replace(/\./g, "").replace(",", ".")
                        );
                        if (!isNaN(n)) {
                          setInitialBalance(
                            n.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          );
                        }
                      }}
                      placeholder="0,00"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    {balanceMode === "last" && (
                      <p className="text-xs text-burnished">
                        Este valor será usado como estimativa inicial. Importe faturas depois para ajustar.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {isEdit && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground">Saldo devedor</p>
                <p className="text-sm font-medium">
                  {formatCurrency(Math.abs(card!.current_balance))}
                </p>
              </div>
            )}

            {/* Color */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cor</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={getColorName(c)}
                    className={`h-8 w-8 rounded-full border-2 transition-transform ${
                      color === c
                        ? "scale-110 border-foreground"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-md btn-alive border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {loading ? "Salvando..." : isEdit ? "Salvar" : "Cadastrar cartão"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </FocusTrap>
  );
}
