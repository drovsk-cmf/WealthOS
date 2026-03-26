"use client";

/**
 * HumanCapitalCalculator - E13
 *
 * Calcula o Valor Presente do Capital Humano: quanto vale a capacidade
 * de gerar renda do usuário até a aposentadoria.
 *
 * DCF da carreira:
 *   PV = Σ (Renda_anual × (1 + g)^t) / (1 + r)^t
 *   para t = 1 até anos_até_aposentadoria
 *
 * Onde:
 *   g = crescimento real da renda (promoções, inflação acima do mercado)
 *   r = taxa de desconto (custo de oportunidade, risco de carreira)
 *
 * Insight chave: mostra o "gap descoberto" entre o capital humano e o
 * patrimônio acumulado, que é exatamente o que seguro de vida deveria cobrir.
 */

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatCurrency, formatDecimalBR, formatAxisBR } from "@/lib/utils";

// ─── Calculation ────────────────────────────────────────────────

interface HumanCapitalResult {
  presentValue: number;
  totalEarnings: number; // nominal (sem desconto)
  gap: number; // PV - patrimônio acumulado
  yearlyData: {
    year: number;
    age: number;
    income: number;
    pvIncome: number;
    cumulativePV: number;
  }[];
  monthlyInsuranceNeed: number; // gap / meses restantes (simplificado)
}

function calculateHumanCapital(
  currentAge: number,
  retirementAge: number,
  annualIncome: number,
  growthRate: number, // % real anual
  discountRate: number, // % anual
  currentWealth: number
): HumanCapitalResult {
  const years = retirementAge - currentAge;
  const g = growthRate / 100;
  const r = discountRate / 100;

  let pv = 0;
  let totalNominal = 0;
  const yearlyData: HumanCapitalResult["yearlyData"] = [];

  for (let t = 1; t <= years; t++) {
    const income = annualIncome * Math.pow(1 + g, t);
    const pvIncome = income / Math.pow(1 + r, t);
    pv += pvIncome;
    totalNominal += income;

    yearlyData.push({
      year: t,
      age: currentAge + t,
      income: Math.round(income),
      pvIncome: Math.round(pvIncome),
      cumulativePV: Math.round(pv),
    });
  }

  const gap = Math.max(0, pv - currentWealth);
  const monthsRemaining = years * 12;
  const monthlyInsurance = monthsRemaining > 0 ? gap / monthsRemaining : 0;

  return {
    presentValue: Math.round(pv),
    totalEarnings: Math.round(totalNominal),
    gap: Math.round(gap),
    yearlyData,
    monthlyInsuranceNeed: Math.round(monthlyInsurance),
  };
}

// ─── Component ──────────────────────────────────────────────────

function InputField({
  label,
  value,
  onChange,
  suffix,
  prefix,
  min,
  max,
  step,
  help,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  prefix?: string;
  min?: number;
  max?: number;
  step?: number;
  help?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step ?? 1}
          className={`w-full rounded-md border bg-background px-3 py-2 text-sm tabular-nums ${
            prefix ? "pl-8" : ""
          } ${suffix ? "pr-12" : ""}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {help && <p className="mt-0.5 text-[10px] text-muted-foreground">{help}</p>}
    </div>
  );
}

export function HumanCapitalCalculator() {
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(60);
  const [monthlyIncome, setMonthlyIncome] = useState(10000);
  const [growthRate, setGrowthRate] = useState(2);
  const [discountRate, setDiscountRate] = useState(5);
  const [currentWealth, setCurrentWealth] = useState(100000);

  const result = useMemo(
    () =>
      calculateHumanCapital(
        currentAge,
        retirementAge,
        monthlyIncome * 12,
        growthRate,
        discountRate,
        currentWealth
      ),
    [currentAge, retirementAge, monthlyIncome, growthRate, discountRate, currentWealth]
  );

  // Sample chart data (every 5 years)
  const chartData = result.yearlyData.filter(
    (d) => d.year % 5 === 0 || d.year === result.yearlyData.length
  );

  const yearsLeft = retirementAge - currentAge;

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <InputField
          label="Idade atual"
          value={currentAge}
          onChange={setCurrentAge}
          suffix="anos"
          min={18}
          max={70}
        />
        <InputField
          label="Aposentadoria"
          value={retirementAge}
          onChange={setRetirementAge}
          suffix="anos"
          min={currentAge + 1}
          max={80}
        />
        <InputField
          label="Renda mensal bruta"
          value={monthlyIncome}
          onChange={setMonthlyIncome}
          prefix="R$"
          min={1000}
          step={500}
        />
        <InputField
          label="Crescimento real"
          value={growthRate}
          onChange={setGrowthRate}
          suffix="% a.a."
          min={0}
          max={15}
          step={0.5}
          help="Promoções e aumentos acima da inflação"
        />
        <InputField
          label="Taxa de desconto"
          value={discountRate}
          onChange={setDiscountRate}
          suffix="% a.a."
          min={1}
          max={20}
          step={0.5}
          help="Custo de oportunidade (CDI real ~5%)"
        />
        <InputField
          label="Patrimônio acumulado"
          value={currentWealth}
          onChange={setCurrentWealth}
          prefix="R$"
          min={0}
          step={10000}
          help="Total de investimentos e bens hoje"
        />
      </div>

      {/* Results */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-primary/5 p-4">
          <p className="text-xs font-medium text-muted-foreground">Capital Humano (VP)</p>
          <p className="mt-1 text-xl font-bold tabular-nums">
            {formatCurrency(result.presentValue)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Valor presente de {yearsLeft} anos de renda
          </p>
        </div>

        <div className="rounded-lg border bg-burnished/5 p-4">
          <p className="text-xs font-medium text-muted-foreground">Gap descoberto</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-burnished">
            {formatCurrency(result.gap)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Capital Humano - Patrimônio
          </p>
        </div>

        <div className="rounded-lg border bg-terracotta/5 p-4">
          <p className="text-xs font-medium text-muted-foreground">Seguro recomendado</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-terracotta">
            {formatCurrency(result.gap)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Cobertura mínima de seguro de vida
          </p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="age"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v} anos`}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatAxisBR(v)}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === "pvIncome"
                    ? "VP da renda anual"
                    : name === "cumulativePV"
                      ? "VP acumulado"
                      : "Renda anual",
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(47,32,59,0.12)",
                  border: "none",
                  fontSize: "12px",
                }}
              />
              <Legend
                iconType="rect"
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                formatter={(value: string) =>
                  value === "pvIncome" ? "VP renda anual" : "VP acumulado"
                }
              />
              <Bar dataKey="pvIncome" fill="#56688F" radius={[3, 3, 0, 0]} />
              <Bar dataKey="cumulativePV" fill="#4F2F69" radius={[3, 3, 0, 0]} />
              {currentWealth > 0 && (
                <ReferenceLine
                  y={currentWealth}
                  stroke="#2F7A68"
                  strokeDasharray="5 3"
                  label={{
                    value: `Patrimônio: ${formatCurrency(currentWealth)}`,
                    position: "insideTopRight",
                    fill: "#2F7A68",
                    fontSize: 10,
                  }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Insight */}
      <div className="rounded-lg border-l-4 border-burnished bg-burnished/5 p-4">
        <p className="text-sm font-medium">O que esse número significa?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Se você parasse de trabalhar hoje, sua família perderia{" "}
          <strong>{formatCurrency(result.presentValue)}</strong> em renda futura (em valor de hoje).
          {result.gap > 0 ? (
            <>
              {" "}O seu patrimônio atual de {formatCurrency(currentWealth)} cobre apenas{" "}
              <strong>{formatDecimalBR((currentWealth / result.presentValue) * 100, 0)}%</strong> desse
              valor. O gap de {formatCurrency(result.gap)} é o que seguro de vida,
              previdência ou aceleração de patrimônio deveria cobrir.
            </>
          ) : (
            <>
              {" "}Seu patrimônio de {formatCurrency(currentWealth)} já cobre 100% do capital
              humano. Você atingiu independência financeira por essa métrica.
            </>
          )}
        </p>
      </div>

      {/* Methodology */}
      <details className="rounded-lg border bg-muted/30 p-3">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
          Metodologia
        </summary>
        <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
          <p>
            Valor Presente do Capital Humano = soma dos fluxos de renda futura descontados
            a valor presente (DCF).
          </p>
          <p>
            Renda no ano t: R_t = Renda_atual × (1 + g)^t, onde g = crescimento real.
          </p>
          <p>
            VP de cada ano: PV_t = R_t / (1 + r)^t, onde r = taxa de desconto.
          </p>
          <p>
            Gap = Capital Humano - Patrimônio acumulado. Representa a exposição financeira
            não coberta da família.
          </p>
          <p>
            Metodologia: Ibbotson et al. (2007), &quot;Lifetime Financial Advice&quot;.
            A taxa de desconto reflete o risco de carreira (estabilidade do emprego, setor,
            senioridade).
          </p>
        </div>
      </details>
    </div>
  );
}
