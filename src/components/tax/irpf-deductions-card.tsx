"use client";

import { Heart, GraduationCap } from "lucide-react";
import { useIRPFDeductions } from "@/lib/hooks/use-irpf-deductions";
import { formatCurrency } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";

interface Props {
  year: number;
}

/**
 * IRPF Deductions card (E29).
 * Shows consolidated health + education totals with per-member breakdown.
 * Health: unlimited deduction. Education: limited per person.
 */
export function IRPFDeductionsCard({ year }: Props) {
  const { data, isLoading } = useIRPFDeductions(year);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-5">
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const healthMembers = Object.entries(data.health.by_member);
  const eduMembers = Object.entries(data.education.by_member);
  const hasData = data.health.total > 0 || data.education.total > 0;

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <h3 className="font-semibold">Deduções IRPF {year}</h3>

      {!hasData && (
        <p className="text-sm text-muted-foreground">
          Nenhuma despesa dedutível registrada em {year}. Categorize
          transações de saúde e educação para acumular automaticamente.
        </p>
      )}

      {hasData && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Health */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-terracotta" />
              <span className="text-sm font-medium">Saúde</span>
              <span className="ml-auto text-xs text-muted-foreground">
                sem limite
              </span>
            </div>
            <p className="text-xl font-bold tabular-nums">
              <Mv>{formatCurrency(data.health.total)}</Mv>
            </p>
            {healthMembers.length > 1 && (
              <div className="space-y-1 pt-1 border-t">
                {healthMembers.map(([name, value]) => (
                  <div
                    key={name}
                    className="flex justify-between text-xs text-muted-foreground"
                  >
                    <span>{name}</span>
                    <span className="tabular-nums">
                      <Mv>{formatCurrency(Number(value))}</Mv>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Education */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Educação</span>
              <span className="ml-auto text-xs text-muted-foreground">
                limite R$ {data.education.limit?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) ?? "3.561,50"}/pessoa
              </span>
            </div>
            <p className="text-xl font-bold tabular-nums">
              <Mv>{formatCurrency(data.education.total)}</Mv>
            </p>
            {eduMembers.length > 0 && (
              <div className="space-y-1 pt-1 border-t">
                {eduMembers.map(([name, value]) => {
                  const limit = data.education.limit ?? 3561.5;
                  const overLimit = Number(value) > limit;
                  return (
                    <div
                      key={name}
                      className="flex justify-between text-xs text-muted-foreground"
                    >
                      <span>{name}</span>
                      <span className={`tabular-nums ${overLimit ? "text-burnished font-medium" : ""}`}>
                        <Mv>{formatCurrency(Number(value))}</Mv>
                        {overLimit && " (excede limite)"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Valores baseados em transações categorizadas como saúde ou educação no
        plano de contas. Saúde: dedução integral. Educação: limitada a
        R$ 3.561,50 por dependente (ano-base 2025). Confirme com seu contador.
      </p>
    </div>
  );
}
