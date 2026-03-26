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
  const [investmentClass, setInvestmentClass] = useState<string>("");
  const [interestRate, setInterestRate] = useState("");
  const [rateType, setRateType] = useState<string>("");
  const [isCollateralized, setIsCollateralized] = useState(false);
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
      // Frente B fields (JARVIS CFA)
      setInvestmentClass((account as Record<string, unknown>).investment_class as string ?? "");
      setInterestRate(String((account as Record<string, unknown>).interest_rate ?? ""));
      setRateType((account as Record<string, unknown>).rate_type as string ?? "");
      setIsCollateralized(!!(account as Record<string, unknown>).is_collateralized);
    } else {
      setName("");
      setType("checking");
      setFinancingSubtype(FINANCING_SUBTYPES[0].value);
      setInitialBalance("");
      setColor(PRESET_COLORS[0]);
      setLiquidityTier("T1");
      setCurrency("BRL");
      setInvestmentClass("");
      setInterestRate("");
      setRateType("");
      setIsCollateralized(false);
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
          // Frente B (JARVIS CFA)
          investment_class: type === "investment" && investmentClass ? investmentClass : null,
          interest_rate: ["loan", "financing", "credit_card"].includes(type) && interestRate ? parseFloat(interestRate) : null,
          rate_type: ["loan", "financing"].includes(type) && rateType ? rateType : null,
          is_collateralized: ["loan", "financing"].includes(type) ? isCollateralized : false,
        } as Parameters<typeof updateAccount.mutateAsync>[0]);
      } else {
        await createAccount.mutateAsync({
          name: name.trim(),
          type,
          initial_balance: balance,
          color,
          liquidity_tier: liquidityTier,
          currency,
          ...(type === "financing" && { coaParentCode: financingSubtype }),
          // Frente B (JARVIS CFA)
          ...(type === "investment" && investmentClass && { investment_class: investmentClass }),
          ...(["loan", "financing", "credit_card"].includes(type) && interestRate && { interest_rate: parseFloat(interestRate) }),
          ...(["loan", "financing"].includes(type) && rateType && { rate_type: rateType }),
          ...(["loan", "financing"].includes(type) && { is_collateralized: isCollateralized }),
        } as Parameters<typeof createAccount.mutateAsync>[0]);
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
      <div className="relative z-10 w-full max-w-md rounded-lg bg-card p-6 shadow-elevated">
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

          {/* ═══ Frente B: Campos JARVIS CFA ═══ */}

          {/* Investment class (only for type=investment) */}
          {type === "investment" && (
            <div className="space-y-1.5">
              <label htmlFor="acc-investment-class" className="text-sm font-medium">
                Classe do investimento
              </label>
              <select
                id="acc-investment-class"
                value={investmentClass}
                onChange={(e) => setInvestmentClass(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Não informada</option>
                <option value="renda_fixa">Renda fixa</option>
                <option value="renda_variavel">Renda variável</option>
                <option value="fii">FII</option>
                <option value="previdencia">Previdência</option>
                <option value="cripto">Cripto</option>
                <option value="outro">Outro</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Usada na análise JARVIS para comparar retorno vs TMA.
              </p>
            </div>
          )}

          {/* Interest rate (only for loan/financing/credit_card) */}
          {(type === "loan" || type === "financing" || type === "credit_card") && (
            <div className="space-y-1.5">
              <label htmlFor="acc-interest-rate" className="text-sm font-medium">
                Taxa de juros (% a.m.)
              </label>
              <input
                id="acc-interest-rate"
                type="number"
                step="0.01"
                min="0"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="Ex: 1.99"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                {type === "credit_card"
                  ? "Taxa rotativo/parcelamento. Usada para projeção de espiral de juros."
                  : "Taxa contratual mensal. Usada na análise de dívida cara."}
              </p>
            </div>
          )}

          {/* Rate type (only for loan/financing) */}
          {(type === "loan" || type === "financing") && (
            <div className="space-y-1.5">
              <label htmlFor="acc-rate-type" className="text-sm font-medium">
                Tipo de taxa
              </label>
              <select
                id="acc-rate-type"
                value={rateType}
                onChange={(e) => setRateType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Não informado</option>
                <option value="pre">Prefixada</option>
                <option value="pos_cdi">Pós-fixada (CDI)</option>
                <option value="pos_ipca">Pós-fixada (IPCA)</option>
                <option value="pos_tr">Pós-fixada (TR)</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Determina como o JARVIS calcula o custo real da dívida.
              </p>
            </div>
          )}

          {/* Collateralized flag (only for loan/financing) */}
          {(type === "loan" || type === "financing") && (
            <label htmlFor="acc-collateralized" className="flex items-start gap-3 cursor-pointer">
              <input
                id="acc-collateralized"
                type="checkbox"
                checked={isCollateralized}
                onChange={(e) => setIsCollateralized(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
              />
              <div>
                <span className="text-sm font-medium">Dívida com garantia real</span>
                <p className="text-xs text-muted-foreground">
                  Marque se há bem vinculado como garantia (imóvel, veículo, equipamento).
                  Dívidas com garantia não entram no cálculo de stress financeiro.
                </p>
              </div>
            </label>
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
            <label htmlFor="acc-tier" className="text-sm font-medium">Nível de liquidez</label>
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
              Classificação usada no cálculo de solvência (Índice de liquidez, Fôlego)
            </p>
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
              {loading ? "Salvando" : isEdit ? "Salvar" : "Criar conta"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </FocusTrap>
  );
}
