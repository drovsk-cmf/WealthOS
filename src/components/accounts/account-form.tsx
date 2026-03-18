"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  useCreateAccount,
  useUpdateAccount,
  ACCOUNT_TYPE_OPTIONS,
  FINANCING_SUBTYPES,
  PRESET_COLORS,
  LIQUIDITY_TIER_OPTIONS,
  COA_PARENT_MAP,
} from "@/lib/hooks/use-accounts";
import { useSupportedCurrencies, groupCurrenciesByTier } from "@/lib/hooks/use-currencies";
import { formatCurrency, getColorName } from "@/lib/utils";
import type { Database } from "@/types/database";
import FocusTrap from "focus-trap-react";

type Account = Database["public"]["Tables"]["accounts"]["Row"];
type AccountType = Database["public"]["Enums"]["account_type"];

interface AccountFormProps {
  account?: Account | null;
  open: boolean;
  onClose: () => void;
}

export function AccountForm({ account, open, onClose }: AccountFormProps) {
  const isEdit = !!account;

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("checking");
  const [financingSubtype, setFinancingSubtype] = useState(FINANCING_SUBTYPES[0].value);
  const [initialBalance, setInitialBalance] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [liquidityTier, setLiquidityTier] = useState("T1");
  const [currency, setCurrency] = useState("BRL");
  const [error, setError] = useState<string | null>(null);

  const { data: supportedCurrencies } = useSupportedCurrencies();
  const currencyGroups = supportedCurrencies ? groupCurrenciesByTier(supportedCurrencies) : [];

  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const loading = createAccount.isPending || updateAccount.isPending;

  // Populate form on edit
  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type);
      setInitialBalance(String(account.initial_balance));
      setColor(account.color || PRESET_COLORS[0]);
      setLiquidityTier(account.liquidity_tier || COA_PARENT_MAP[account.type]?.tier || "T1");
      setCurrency(account.currency || "BRL");
    } else {
      setName("");
      setType("checking");
      setFinancingSubtype(FINANCING_SUBTYPES[0].value);
      setInitialBalance("");
      setColor(PRESET_COLORS[0]);
      setLiquidityTier("T1");
      setCurrency("BRL");
    }
    setError(null);
  }, [account, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }

    const balance = parseFloat(initialBalance) || 0;

    try {
      if (isEdit && account) {
        await updateAccount.mutateAsync({
          id: account.id,
          name: name.trim(),
          type,
          color,
          liquidity_tier: liquidityTier,
          currency,
        });
      } else {
        await createAccount.mutateAsync({
          name: name.trim(),
          type,
          initial_balance: balance,
          color,
          liquidity_tier: liquidityTier,
          currency,
          ...(type === "financing" && { coaParentCode: financingSubtype }),
        });
      }
      toast.success(isEdit ? "Conta atualizada." : "Conta criada com sucesso.");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar conta.");
    }
  }

  if (!open) return null;

  return (
    <FocusTrap focusTrapOptions={{ escapeDeactivates: false }}>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">
          {isEdit ? "Editar conta" : "Nova conta"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEdit
            ? "Atualize os dados da conta."
            : "Cadastre uma conta, cartão, empréstimo ou financiamento."}
        </p>

        {error && (
          <div role="alert" className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="acc-name" className="text-sm font-medium">
              Nome
            </label>
            <input
              id="acc-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Banco Principal"
              aria-required="true"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoFocus
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label htmlFor="acc-type" className="text-sm font-medium">
              Tipo
            </label>
            <select
              id="acc-type"
              value={type}
              onChange={(e) => {
                const newType = e.target.value as AccountType;
                setType(newType);
                setLiquidityTier(COA_PARENT_MAP[newType]?.tier || "T1");
              }}
              disabled={isEdit} // Can't change type after creation
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                O tipo não pode ser alterado após a criação.
              </p>
            )}
          </div>

          {/* Currency */}
          <div className="space-y-1.5">
            <label htmlFor="acc-currency" className="text-sm font-medium">
              Moeda
            </label>
            <select
              id="acc-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {currencyGroups.length > 0 ? (
                currencyGroups.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name} ({c.symbol})
                      </option>
                    ))}
                  </optgroup>
                ))
              ) : (
                <option value="BRL">BRL - Real brasileiro (R$)</option>
              )}
            </select>
            {currency !== "BRL" && (
              <p className="text-xs text-muted-foreground">
                Saldos serão convertidos para BRL pela cotação do dia.
              </p>
            )}
          </div>

          {/* Financing sub-type */}
          {!isEdit && type === "financing" && (
            <div className="space-y-1.5">
              <label htmlFor="acc-financing-subtype" className="text-sm font-medium">
                Tipo de financiamento
              </label>
              <select
                id="acc-financing-subtype"
                value={financingSubtype}
                onChange={(e) => setFinancingSubtype(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {FINANCING_SUBTYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Initial Balance */}
          {!isEdit && (
            <div className="space-y-1.5">
              <label htmlFor="acc-balance" className="text-sm font-medium">
                {type === "credit_card" || type === "loan" || type === "financing"
                  ? `Saldo devedor atual (${currency})`
                  : `Saldo inicial (${currency})`}
              </label>
              <input
                id="acc-balance"
                type="number"
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0,00"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                {type === "credit_card"
                  ? "Fatura atual (valor positivo = dívida)."
                  : type === "loan"
                    ? "Saldo devedor total do empréstimo."
                    : type === "financing"
                      ? "Saldo devedor total do financiamento."
                      : "Saldo atual da conta no momento do cadastro."}
              </p>
            </div>
          )}

          {isEdit && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs text-muted-foreground">Saldo inicial</p>
              <p className="text-sm font-medium">
                {formatCurrency(account!.initial_balance)}
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

          {/* Liquidity Tier */}
          <div className="space-y-1.5">
            <label htmlFor="acc-tier" className="text-sm font-medium">Tier de liquidez</label>
            <select
              id="acc-tier"
              value={liquidityTier}
              onChange={(e) => setLiquidityTier(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {LIQUIDITY_TIER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Classificação usada no cálculo de solvência (LCR, Runway)
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Salvando" : isEdit ? "Salvar" : "Criar conta"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </FocusTrap>
  );
}
