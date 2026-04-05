"use client";

/**
 * UX-H1-02: Onboarding Step 9 - Route A (Manual)
 *
 * Simplified inline flow:
 * Phase 1: Create first bank account (type + name)
 * Phase 2: Log first transaction (amount + type + description)
 *
 * Uses existing hooks (useCreateAccount, useCreateTransaction).
 */

import { useState } from "react";
import {
  Wallet,
  CreditCard,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Loader2,
} from "lucide-react";
import { useCreateAccount } from "@/lib/hooks/use-accounts";
import { useCreateTransaction } from "@/lib/services/transaction-engine";
import { toLocalDateString } from "@/lib/utils";

type AccountTypeOption = "checking" | "savings" | "credit_card";

const ACCOUNT_TYPES: {
  value: AccountTypeOption;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "checking", label: "Conta Corrente", icon: <Wallet className="h-4 w-4" /> },
  { value: "savings", label: "Poupança", icon: <PiggyBank className="h-4 w-4" /> },
  { value: "credit_card", label: "Cartão de Crédito", icon: <CreditCard className="h-4 w-4" /> },
];

interface RouteManualStepProps {
  onComplete: (stats: { accounts: number; transactions: number }) => void;
  currencySymbol?: string;
}

export function RouteManualStep({ onComplete, currencySymbol = "R$" }: RouteManualStepProps) {
  // Phase: account creation → transaction creation
  const [phase, setPhase] = useState<"account" | "transaction">("account");
  const [error, setError] = useState<string | null>(null);

  // Account form
  const [accountType, setAccountType] = useState<AccountTypeOption>("checking");
  const [accountName, setAccountName] = useState("");
  const [createdAccountId, setCreatedAccountId] = useState<string | null>(null);

  // Transaction form
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [txAmount, setTxAmount] = useState("");
  const [txDescription, setTxDescription] = useState("");

  const createAccount = useCreateAccount();
  const createTransaction = useCreateTransaction();

  const isLoading = createAccount.isPending || createTransaction.isPending;

  async function handleCreateAccount() {
    const name = accountName.trim() || getDefaultName(accountType);
    setError(null);

    try {
      const result = await createAccount.mutateAsync({
        name,
        type: accountType,
        initial_balance: 0,
      });
      setCreatedAccountId(result.id);
      setPhase("transaction");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta.");
    }
  }

  async function handleCreateTransaction() {
    const amount = parseFloat(txAmount.replace(",", "."));
    if (!amount || amount <= 0 || !createdAccountId) {
      setError("Informe um valor válido.");
      return;
    }

    setError(null);

    try {
      const today = toLocalDateString();
      await createTransaction.mutateAsync({
        account_id: createdAccountId,
        type: txType,
        amount,
        description: txDescription.trim() || (txType === "expense" ? "Primeira despesa" : "Primeira receita"),
        date: today,
        is_paid: true,
        source: "manual",
      });
      onComplete({ accounts: 1, transactions: 1 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar transação.");
    }
  }

  function handleSkipTransaction() {
    onComplete({ accounts: 1, transactions: 0 });
  }

  return (
    <>
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ─── Phase 1: Account ─────────────────────── */}
      {phase === "account" && (
        <>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              Crie sua primeira conta
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Conta bancária, cartão ou poupança. Você pode adicionar mais depois.
            </p>
          </div>

          {/* Account type selector */}
          <div className="space-y-2">
            {ACCOUNT_TYPES.map((opt) => (
              <button type="button"
                key={opt.value}
                onClick={() => {
                  setAccountType(opt.value);
                  if (!accountName) setAccountName("");
                }}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                  accountType === opt.value
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-input hover:bg-accent"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-md ${
                    accountType === opt.value
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {opt.icon}
                </div>
                {opt.label}
                {accountType === opt.value && (
                  <Check className="ml-auto h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Account name */}
          <div className="space-y-2">
            <label htmlFor="accountName" className="text-sm font-medium">
              Nome da conta
            </label>
            <input
              id="accountName"
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder={getDefaultName(accountType)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <button type="button"
            onClick={handleCreateAccount}
            disabled={isLoading}
            className="w-full rounded-lg btn-cta px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando conta
              </span>
            ) : (
              "Criar conta"
            )}
          </button>
        </>
      )}

      {/* ─── Phase 2: Transaction ─────────────────── */}
      {phase === "transaction" && (
        <>
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-verdant/15">
              <Check className="h-5 w-5 text-verdant" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Registre sua primeira transação
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pode ser qualquer valor. Isso ativa seu painel financeiro.
            </p>
          </div>

          {/* Type toggle */}
          <div className="flex gap-2">
            <button type="button"
              onClick={() => setTxType("expense")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                txType === "expense"
                  ? "border-terracotta bg-terracotta/10 font-medium text-terracotta"
                  : "border-input hover:bg-accent"
              }`}
            >
              <ArrowDownRight className="h-4 w-4" />
              Despesa
            </button>
            <button type="button"
              onClick={() => setTxType("income")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                txType === "income"
                  ? "border-verdant bg-verdant/10 font-medium text-verdant"
                  : "border-input hover:bg-accent"
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
              Receita
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label htmlFor="txAmount" className="text-sm font-medium">
              Valor ({currencySymbol})
            </label>
            <input
              id="txAmount"
              type="text"
              inputMode="decimal"
              value={txAmount}
              onChange={(e) =>
                setTxAmount(e.target.value.replace(/[^0-9.,]/g, ""))
              }
              placeholder="0,00"
              autoFocus
              className="flex h-14 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-2xl font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="txDesc" className="text-sm font-medium">
              Descrição{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </label>
            <input
              id="txDesc"
              type="text"
              value={txDescription}
              onChange={(e) => setTxDescription(e.target.value)}
              placeholder={txType === "expense" ? "Ex: Supermercado" : "Ex: Salário"}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <button type="button"
            onClick={handleCreateTransaction}
            disabled={isLoading || !txAmount}
            className="w-full rounded-lg btn-cta px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Registrando
              </span>
            ) : (
              "Registrar transação"
            )}
          </button>

          <button type="button"
            onClick={handleSkipTransaction}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Pular por agora
          </button>
        </>
      )}
    </>
  );
}

function getDefaultName(type: AccountTypeOption): string {
  switch (type) {
    case "checking":
      return "Conta Corrente";
    case "savings":
      return "Poupança";
    case "credit_card":
      return "Cartão de Crédito";
  }
}
