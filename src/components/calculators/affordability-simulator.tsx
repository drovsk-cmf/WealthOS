"use client";

/**
 * AffordabilitySimulator - E7 "Posso comprar?"
 *
 * 3 inputs:
 *   - Valor do bem (R$)
 *   - Forma de pagamento (à vista, parcelado sem juros, financiado)
 *   - Prazo (meses) + taxa de juros (se financiado)
 *
 * 3 outputs:
 *   - Impacto no Runway (meses perdidos)
 *   - Impacto no LCR (antes → depois)
 *   - Comparativo com meta de reserva (6 meses)
 *
 * Usa dados reais de solvência do usuário (get_solvency_metrics via hook).
 * Cálculo 100% determinístico, zero IA, zero RPC nova.
 */

import { useState, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  TrendingDown,
  Clock,
  Wallet,
} from "lucide-react";
import { formatCurrency, formatDecimalBR } from "@/lib/utils";
import { useSolvencyMetrics } from "@/lib/hooks/use-dashboard";

type PaymentMethod = "cash" | "installment" | "financed";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; desc: string }[] =
  [
    {
      value: "cash",
      label: "À vista",
      desc: "Débito imediato da reserva líquida",
    },
    {
      value: "installment",
      label: "Parcelado sem juros",
      desc: "Divide no cartão/crediário, sem taxa",
    },
    {
      value: "financed",
      label: "Financiado",
      desc: "Com juros (CET mensal informado)",
    },
  ];

interface SimulationResult {
  // Before
  runwayBefore: number;
  lcrBefore: number;
  liquidBefore: number;
  burnBefore: number;

  // After
  runwayAfter: number;
  lcrAfter: number;
  liquidAfter: number;
  burnAfter: number;

  // Delta
  runwayLost: number;
  monthlyPayment: number;
  totalCost: number;
  totalInterest: number;

  // Reserve check
  reserveTarget: number; // 6 months burn
  liquidAfterVsTarget: number; // ratio
  reserveOk: boolean;
}

function simulate(
  value: number,
  method: PaymentMethod,
  months: number,
  monthlyRate: number,
  liquid: number,
  burn: number,
  lcr: number,
  runway: number
): SimulationResult {
  const reserveTarget = burn * 6;

  let liquidAfter: number;
  let burnAfter: number;
  let monthlyPayment: number;
  let totalCost: number;
  let totalInterest: number;

  if (method === "cash") {
    // Full debit from liquid reserves
    liquidAfter = liquid - value;
    burnAfter = burn; // burn doesn't change
    monthlyPayment = 0;
    totalCost = value;
    totalInterest = 0;
  } else if (method === "installment") {
    // Monthly installment, no interest
    monthlyPayment = value / months;
    liquidAfter = liquid; // no immediate debit
    burnAfter = burn + monthlyPayment;
    totalCost = value;
    totalInterest = 0;
  } else {
    // Financed: PMT = PV * r / (1 - (1+r)^-n)
    const r = monthlyRate / 100;
    if (r <= 0) {
      monthlyPayment = value / months;
    } else {
      monthlyPayment = (value * r) / (1 - Math.pow(1 + r, -months));
    }
    liquidAfter = liquid; // no immediate debit
    burnAfter = burn + monthlyPayment;
    totalCost = monthlyPayment * months;
    totalInterest = totalCost - value;
  }

  // Recalculate solvency metrics
  const runwayAfter =
    burnAfter > 0 ? Math.max(0, liquidAfter) / burnAfter : 999;
  const lcrAfter =
    burnAfter * 6 > 0 ? Math.max(0, liquidAfter) / (burnAfter * 6) : 999;

  const runwayLost = runway - runwayAfter;
  const liquidAfterVsTarget =
    reserveTarget > 0 ? Math.max(0, liquidAfter) / reserveTarget : 999;

  return {
    runwayBefore: runway,
    lcrBefore: lcr,
    liquidBefore: liquid,
    burnBefore: burn,
    runwayAfter,
    lcrAfter,
    liquidAfter,
    burnAfter,
    runwayLost,
    monthlyPayment,
    totalCost,
    totalInterest,
    reserveTarget,
    liquidAfterVsTarget,
    reserveOk: liquidAfterVsTarget >= 1,
  };
}

function StatusBadge({
  ok,
  warning,
}: {
  ok: boolean;
  warning?: boolean;
}) {
  if (ok)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-verdant/15 px-2 py-0.5 text-[10px] font-bold text-verdant">
        <ShieldCheck className="h-3 w-3" /> Confortável
      </span>
    );
  if (warning)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-burnished/15 px-2 py-0.5 text-[10px] font-bold text-burnished">
        <AlertTriangle className="h-3 w-3" /> Atenção
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-terracotta/15 px-2 py-0.5 text-[10px] font-bold text-terracotta">
      <ShieldAlert className="h-3 w-3" /> Crítico
    </span>
  );
}

function MetricCard({
  label,
  icon: Icon,
  before,
  after,
  unit,
  explanation,
  formatFn,
  invertColor,
}: {
  label: string;
  icon: typeof Clock;
  before: number;
  after: number;
  unit?: string;
  explanation: string;
  formatFn?: (v: number) => string;
  invertColor?: boolean;
}) {
  const fmt = formatFn ?? ((v: number) => formatDecimalBR(v, 1));
  const diff = after - before;
  const isPositive = invertColor ? diff < 0 : diff > 0;
  const isNeutral = Math.abs(diff) < 0.01;
  const diffColor = isNeutral
    ? "text-muted-foreground"
    : isPositive
      ? "text-verdant"
      : "text-terracotta";

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-3">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Atual</p>
          <p className="text-lg font-bold tabular-nums">
            {before >= 999 ? "∞" : fmt(before)}
          </p>
        </div>
        <TrendingDown className={`h-4 w-4 ${diffColor}`} />
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Depois</p>
          <p className="text-lg font-bold tabular-nums">
            {after >= 999 ? "∞" : fmt(after)}
          </p>
        </div>
        {unit && (
          <span className="text-xs text-muted-foreground">{unit}</span>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-1">
        <span className={`text-xs font-medium tabular-nums ${diffColor}`}>
          {isNeutral ? "Sem impacto" : `${diff > 0 ? "+" : ""}${fmt(diff)}`}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
        {explanation}
      </p>
    </div>
  );
}

export function AffordabilitySimulator() {
  const { data: solvency, isLoading } = useSolvencyMetrics();

  const [value, setValue] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [months, setMonths] = useState<string>("12");
  const [rate, setRate] = useState<string>("1.5");
  const [simulated, setSimulated] = useState(false);

  const parsedValue = parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
  const parsedMonths = parseInt(months, 10) || 12;
  const parsedRate = parseFloat(rate.replace(",", ".")) || 0;

  const liquid =
    (solvency?.tier1_total ?? 0) + (solvency?.tier2_total ?? 0);
  const burn = solvency?.burn_rate ?? 0;
  const lcr = solvency?.lcr ?? 0;
  const runway = solvency?.runway_months ?? 0;

  const result = useMemo(() => {
    if (parsedValue <= 0) return null;
    return simulate(
      parsedValue,
      method,
      parsedMonths,
      parsedRate,
      liquid,
      burn,
      lcr,
      runway
    );
  }, [parsedValue, method, parsedMonths, parsedRate, liquid, burn, lcr, runway]);

  const hasSolvencyData = burn > 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!hasSolvencyData) {
    return (
      <div className="py-8 text-center">
        <Wallet className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">
          Para simular, o Oniefy precisa de pelo menos 1 mês de transações
          registradas
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Importe um extrato ou lance transações para começar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Context banner */}
      <div className="rounded-lg bg-primary/5 p-3">
        <p className="text-xs text-muted-foreground">
          Usando seus dados reais: reserva líquida de{" "}
          <strong className="text-foreground">{formatCurrency(liquid)}</strong>,
          custo mensal de{" "}
          <strong className="text-foreground">{formatCurrency(burn)}</strong>,
          fôlego de{" "}
          <strong className="text-foreground">
            {runway >= 999 ? "∞" : `${formatDecimalBR(runway, 1)} meses`}
          </strong>
        </p>
      </div>

      {/* Inputs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Valor */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Valor do bem (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSimulated(false);
            }}
            placeholder="50.000"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Forma de pagamento */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Forma de pagamento
          </label>
          <select
            value={method}
            onChange={(e) => {
              setMethod(e.target.value as PaymentMethod);
              setSimulated(false);
            }}
            aria-label="Forma de pagamento"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {PAYMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {PAYMENT_OPTIONS.find((o) => o.value === method)?.desc}
          </p>
        </div>

        {/* Prazo */}
        {method !== "cash" && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Prazo (meses)
            </label>
            <input
              type="number"
              min={1}
              max={360}
              value={months}
              onChange={(e) => {
                setMonths(e.target.value);
                setSimulated(false);
              }}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        {/* Taxa (só financiado) */}
        {method === "financed" && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Taxa mensal (% a.m.)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={rate}
              onChange={(e) => {
                setRate(e.target.value);
                setSimulated(false);
              }}
              placeholder="1.5"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}
      </div>

      {/* Simulate button */}
      <button
        type="button"
        onClick={() => setSimulated(true)}
        disabled={parsedValue <= 0}
        className="btn-cta rounded-md px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Simular impacto
      </button>

      {/* Results */}
      {simulated && result && (
        <div className="space-y-4">
          {/* Cost summary */}
          {(result.monthlyPayment > 0 || result.totalInterest > 0) && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex flex-wrap gap-6 text-sm">
                {result.monthlyPayment > 0 && (
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">
                      Parcela mensal
                    </p>
                    <p className="font-bold tabular-nums">
                      {formatCurrency(result.monthlyPayment)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Custo total
                  </p>
                  <p className="font-bold tabular-nums">
                    {formatCurrency(result.totalCost)}
                  </p>
                </div>
                {result.totalInterest > 0 && (
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">
                      Total de juros
                    </p>
                    <p className="font-bold tabular-nums text-terracotta">
                      {formatCurrency(result.totalInterest)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3 impact metrics */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* 1. Runway impact */}
            <MetricCard
              label="Fôlego"
              icon={Clock}
              before={result.runwayBefore}
              after={result.runwayAfter}
              unit="meses"
              explanation={
                result.runwayLost >= 999
                  ? "Sem impacto mensurável"
                  : result.runwayLost > 0
                    ? `Você perde ${formatDecimalBR(result.runwayLost, 1)} meses de fôlego financeiro`
                    : "Seu fôlego não é afetado"
              }
            />

            {/* 2. LCR impact */}
            <MetricCard
              label="Índice de Liquidez"
              icon={ShieldCheck}
              before={result.lcrBefore}
              after={result.lcrAfter}
              formatFn={(v) => formatDecimalBR(v, 2)}
              explanation={
                result.lcrAfter >= 1
                  ? "Liquidez permanece saudável após a compra"
                  : result.lcrAfter >= 0.5
                    ? "Liquidez fica na zona de atenção após a compra"
                    : "Liquidez entra na zona crítica. Considere adiar ou parcelar"
              }
            />

            {/* 3. Reserve check */}
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" />
                Reserva de Emergência
              </div>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge
                  ok={result.reserveOk}
                  warning={result.liquidAfterVsTarget >= 0.5}
                />
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Reserva após compra</span>
                  <span>Meta (6 meses)</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${
                      result.reserveOk
                        ? "bg-verdant"
                        : result.liquidAfterVsTarget >= 0.5
                          ? "bg-burnished"
                          : "bg-terracotta"
                    }`}
                    style={{
                      width: `${Math.min(100, result.liquidAfterVsTarget * 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs tabular-nums">
                  <span
                    className={
                      result.reserveOk ? "text-verdant" : "text-terracotta"
                    }
                  >
                    {formatCurrency(Math.max(0, result.liquidAfter))}
                  </span>
                  <span className="text-muted-foreground">
                    {formatCurrency(result.reserveTarget)}
                  </span>
                </div>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                {result.reserveOk
                  ? "Sua reserva permanece acima da meta de 6 meses mesmo após a compra"
                  : result.liquidAfterVsTarget >= 0.5
                    ? "A compra consome parte da sua reserva. Você fica abaixo da meta de 6 meses"
                    : "A compra compromete severamente sua reserva de emergência"}
              </p>
            </div>
          </div>

          {/* Verdict */}
          <div
            className={`rounded-lg border p-4 ${
              result.reserveOk && result.lcrAfter >= 1
                ? "border-verdant/30 bg-verdant/5"
                : result.lcrAfter >= 0.5
                  ? "border-burnished/30 bg-burnished/5"
                  : "border-terracotta/30 bg-terracotta/5"
            }`}
          >
            <p className="text-sm font-semibold">
              {result.reserveOk && result.lcrAfter >= 1
                ? "Compra viável dentro dos seus parâmetros de segurança"
                : result.lcrAfter >= 0.5
                  ? "Compra possível, mas exige atenção ao fluxo de caixa nos próximos meses"
                  : "Compra comprometeria sua estabilidade financeira no cenário atual"}
            </p>
            {method === "cash" && result.liquidAfter < result.reserveTarget && (
              <p className="mt-1 text-xs text-muted-foreground">
                Considere parcelar para preservar a reserva de emergência
              </p>
            )}
            {method === "financed" && result.totalInterest > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                O financiamento adiciona{" "}
                {formatCurrency(result.totalInterest)} em juros (
                {formatDecimalBR((result.totalInterest / parsedValue) * 100, 1)}% do
                valor)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
