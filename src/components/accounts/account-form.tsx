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
import { useBankInstitutions } from "@/lib/hooks/use-bank-institutions";
import { useSupportedCurrencies, groupCurrenciesByTier } from "@/lib/hooks/use-currencies";
import { formatCurrency, getColorName } from "@/lib/utils";
import type { Database } from "@/types/database";
import FocusTrap from "focus-trap-react";
import { FormError } from "@/components/ui/form-primitives";

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
  const [bankInstitutionId, setBankInstitutionId] = useState("");
  const [branchNumber, setBranchNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountDigit, setAccountDigit] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: supportedCurrencies } = useSupportedCurrencies();
  const { data: bankInstitutions } = useBankInstitutions();
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
      // Frente B fields (Motor Financeiro)
      setInvestmentClass((account as Record<string, unknown>).investment_class as string ?? "");
      setInterestRate(String((account as Record<string, unknown>).interest_rate ?? ""));
      setRateType((account as Record<string, unknown>).rate_type as string ?? "");
      setIsCollateralized(!!(account as Record<string, unknown>).is_collateralized);
      // Bank details
      setBankInstitutionId((account as Record<string, unknown>).bank_institution_id as string ?? "");
      setBranchNumber((account as Record<string, unknown>).branch_number as string ?? "");
      setAccountNumber((account as Record<string, unknown>).account_number as string ?? "");
      setAccountDigit((account as Record<string, unknown>).account_digit as string ?? "");
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
      setBankInstitutionId("");
      setBranchNumber("");
      setAccountNumber("");
      setAccountDigit("");
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

    const balanceRaw = initialBalance.replace(/\./g, "").replace(",", ".");
    let balance = parseFloat(balanceRaw) || 0;
    // Auto-negate for debt types: user enters positive, system stores negative
    if (["credit_card", "loan", "financing"].includes(type) && balance > 0) {
      balance = -balance;
    }

    try {
      if (isEdit && account) {
        await updateAccount.mutateAsync({
          id: account.id,
          name: name.trim(),
          type,
          color,
          liquidity_tier: liquidityTier,
          currency: currency || "BRL",
          // Frente B (Motor Financeiro)
          investment_class: type === "investment" && investmentClass ? investmentClass : null,
          interest_rate: ["loan", "financing", "credit_card"].includes(type) && interestRate ? parseFloat(interestRate.replace(",", ".")) : null,
          rate_type: ["loan", "financing"].includes(type) && rateType ? rateType : null,
          is_collateralized: ["loan", "financing"].includes(type) ? isCollateralized : false,
          // Bank details
          bank_institution_id: bankInstitutionId || null,
          branch_number: branchNumber || null,
          account_number: accountNumber || null,
          account_digit: accountDigit || null,
        } as Parameters<typeof updateAccount.mutateAsync>[0]);
      } else {
        await createAccount.mutateAsync({
          name: name.trim(),
          type,
          initial_balance: balance,
          color,
          liquidity_tier: liquidityTier,
          currency: currency || "BRL",
          ...(type === "financing" && { coaParentCode: financingSubtype }),
          // Frente B (Motor Financeiro)
          ...(type === "investment" && investmentClass && { investment_class: investmentClass }),
          ...(["loan", "financing", "credit_card"].includes(type) && interestRate && { interest_rate: parseFloat(interestRate.replace(",", ".")) }),
          ...(["loan", "financing"].includes(type) && rateType && { rate_type: rateType }),
          ...(["loan", "financing"].includes(type) && { is_collateralized: isCollateralized }),
          // Bank details
          ...(bankInstitutionId && { bank_institution_id: bankInstitutionId }),
          ...(branchNumber && { branch_number: branchNumber }),
          ...(accountNumber && { account_number: accountNumber }),
          ...(accountDigit && { account_digit: accountDigit }),
        } as Parameters<typeof createAccount.mutateAsync>[0]);
      }
      toast.success(isEdit ? "Conta atualizada." : "Conta criada com sucesso.");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar conta.";
      setError(msg);
      toast.error(msg);
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

        <FormError message={error} />

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

          {/* Bank details — FIX #4 (only for types that have a bank) */}
          {["checking", "savings", "credit_card", "investment", "loan", "financing"].includes(type) && (
            <>
              <div className="space-y-1.5">
                <label htmlFor="acc-bank" className="text-sm font-medium">Banco</label>
                <select
                  id="acc-bank"
                  value={bankInstitutionId}
                  onChange={(e) => setBankInstitutionId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Selecione o banco</option>
                  {bankInstitutions?.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.compe_code} - {bank.short_name}
                    </option>
                  ))}
                </select>
              </div>

              {bankInstitutionId && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="acc-branch" className="text-xs font-medium">Agência</label>
                    <input id="acc-branch" type="text" value={branchNumber}
                      onChange={(e) => setBranchNumber(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="0001" maxLength={6}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm tabular-nums" />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="acc-number" className="text-xs font-medium">Conta</label>
                    <input id="acc-number" type="text" value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/[^\d-]/g, "").slice(0, 15))}
                      placeholder="12345678" maxLength={15}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm tabular-nums" />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="acc-digit" className="text-xs font-medium">Dígito</label>
                    <input id="acc-digit" type="text" value={accountDigit}
                      onChange={(e) => setAccountDigit(e.target.value.replace(/[^\dXx]/g, "").slice(0, 2))}
                      placeholder="0" maxLength={2}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm tabular-nums" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Currency — progressive disclosure: BRL default, toggle for other */}
          <div className="space-y-1.5">
            {currency === "BRL" ? (
              <button
                type="button"
                onClick={() => setCurrency("")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Moeda: BRL (R$) · <span className="underline">alterar</span>
              </button>
            ) : (
              <>
                <label htmlFor="acc-currency" className="text-sm font-medium">
                  Moeda
                </label>
                <select
                  id="acc-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Selecione a moeda</option>
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
                <button
                  type="button"
                  onClick={() => setCurrency("BRL")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                >
                  Usar Real (BRL)
                </button>
                {currency && currency !== "BRL" && (
                  <p className="text-xs text-muted-foreground">
                    Saldos serão convertidos para BRL pela cotação do dia.
                  </p>
                )}
              </>
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

          {/* ═══ Frente B: Campos Motor Financeiro ═══ */}

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
                Usada na análise do Motor Financeiro para comparar retorno vs TMA.
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
                type="text"
                inputMode="decimal"
                value={interestRate}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d.,]/g, "");
                  setInterestRate(raw);
                }}
                placeholder="Ex: 1,99"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                {type === "credit_card"
                  ? "Taxa do rotativo/parcelamento. Use vírgula como decimal (ex: 14,90)."
                  : "Taxa contratual mensal. Use vírgula como decimal (ex: 0,65)."}
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
                Determina como o Motor Financeiro calcula o custo real da dívida.
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

          {/* Initial Balance — FIX #6: formatting + FIX #9: credit card sign */}
          {!isEdit && (
            <div className="space-y-1.5">
              <label htmlFor="acc-balance" className="text-sm font-medium">
                {type === "credit_card"
                  ? `Quanto você deve neste cartão? (${currency})`
                  : type === "loan" || type === "financing"
                    ? `Saldo devedor atual (${currency})`
                    : `Saldo inicial (${currency})`}
              </label>
              <input
                id="acc-balance"
                type="text"
                inputMode="decimal"
                value={initialBalance}
                onChange={(e) => {
                  // Accept digits, comma and dot only
                  const raw = e.target.value.replace(/[^\d.,]/g, "");
                  setInitialBalance(raw);
                }}
                onBlur={() => {
                  // Format on blur: normalize to number then back to display
                  if (!initialBalance) return;
                  const normalized = initialBalance.replace(/\./g, "").replace(",", ".");
                  const num = parseFloat(normalized);
                  if (!isNaN(num)) {
                    setInitialBalance(num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                  }
                }}
                placeholder="0,00"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                {type === "credit_card"
                  ? "Informe o valor total da fatura aberta. Não use sinal negativo."
                  : type === "loan" || type === "financing"
                    ? "Informe o saldo devedor total. Não use sinal negativo."
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

          {/* Liquidity Tier — editável para todos os tipos (E55) */}
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
              Preenchido automaticamente ao escolher o tipo. Ajuste se necessário (ex: poupança com resgate em D+1 = N1, CDB com carência = N3).
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
