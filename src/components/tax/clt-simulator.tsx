"use client";

import { useState, useMemo } from "react";
import { Calculator } from "lucide-react";
import { useTaxParameters } from "@/lib/hooks/use-tax-parameters";
import { calculateCLTNetSalary } from "@/lib/tax/calculator";
import { formatCurrency } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";

/**
 * CLT Simulator (E45): gross salary → net salary breakdown.
 * Uses real tax parameters from tax_parameters table.
 * Pure client-side calculation, no RPC calls.
 */
export function CLTSimulator() {
  const [grossInput, setGrossInput] = useState("");
  const [dependents, setDependents] = useState(0);
  const { data: params, isLoading, error } = useTaxParameters();

  const grossSalary = useMemo(() => {
    const raw = grossInput.replace(/\./g, "").replace(",", ".");
    return parseFloat(raw) || 0;
  }, [grossInput]);

  const result = useMemo(() => {
    if (!params || grossSalary <= 0) return null;
    return calculateCLTNetSalary(
      grossSalary,
      dependents,
      params.irpfMonthly,
      params.inssEmployee,
      params.minimumWage
    );
  }, [params, grossSalary, dependents]);

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Simulador CLT: Bruto → Líquido</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Cálculo baseado na legislação vigente ({params?.year ?? "..."}).
        Para situações específicas, consulte seu contador.
      </p>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Erro ao carregar parâmetros fiscais.
        </div>
      )}

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="clt-gross" className="text-sm font-medium">
            Salário bruto (R$)
          </label>
          <input
            id="clt-gross"
            type="text"
            inputMode="decimal"
            value={grossInput}
            onChange={(e) => setGrossInput(e.target.value.replace(/[^\d.,]/g, ""))}
            onBlur={() => {
              if (grossSalary > 0) {
                setGrossInput(
                  grossSalary.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                );
              }
            }}
            placeholder="5.000,00"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm tabular-nums ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="clt-deps" className="text-sm font-medium">
            Dependentes
          </label>
          <select
            id="clt-deps"
            value={dependents}
            onChange={(e) => setDependents(Number(e.target.value))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-3 pt-2">
          {/* Net salary highlight */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-center">
            <p className="text-xs text-muted-foreground">Salário líquido</p>
            <p className="text-2xl font-bold text-primary tabular-nums">
              <Mv>{formatCurrency(result.netSalary)}</Mv>
            </p>
          </div>

          {/* Breakdown */}
          <div className="space-y-2 text-sm">
            <BreakdownRow
              label="Salário bruto"
              value={result.grossSalary}
              className="font-medium"
            />
            <BreakdownRow
              label={`INSS (${result.effectiveINSSRate.toFixed(2)}%)`}
              value={-result.inss}
              className="text-terracotta"
            />
            <BreakdownRow
              label={`IRRF (${result.effectiveIRPFRate.toFixed(2)}%)`}
              value={-result.irpf}
              className="text-terracotta"
            />
            <div className="border-t pt-2">
              <BreakdownRow
                label="Líquido"
                value={result.netSalary}
                className="font-semibold text-verdant"
              />
            </div>
            <div className="border-t pt-2 text-muted-foreground">
              <BreakdownRow
                label="FGTS (custo empregador, 8%)"
                value={result.fgts}
              />
              <BreakdownRow
                label="Custo total empresa"
                value={result.grossSalary + result.fgts}
              />
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <p className="text-xs text-muted-foreground animate-pulse">
          Carregando parâmetros fiscais...
        </p>
      )}
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span>{label}</span>
      <span className="tabular-nums">
        <Mv>
          {value < 0 ? "-" : ""}
          {formatCurrency(Math.abs(value))}
        </Mv>
      </span>
    </div>
  );
}
