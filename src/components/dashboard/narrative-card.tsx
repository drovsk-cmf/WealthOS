"use client";

/**
 * NarrativeCard - UX-H1-06 (Seção 1)
 *
 * Motor narrativo reduzido (H1): apenas 3 estados.
 * P0: Estado vazio pós-onboarding (0 transações)
 * P4: Pós-importação (tem transações recentes de import)
 * P5: Resumo neutro (estado normal)
 *
 * Regra de supressão: card é ocultado se estado não mudou em 48h.
 * No H1 simplificamos: ocultar P5 se último acesso < 2 min atrás (evitar repetição).
 */

import { Lightbulb, FileCheck, TrendingUp } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";
import type { DashboardSummary } from "@/lib/hooks/use-dashboard";

type NarrativeState = "empty" | "post_import" | "neutral";

interface NarrativeCardProps {
  summary: DashboardSummary | undefined;
  hasTransactions: boolean;
  hasRecentImport: boolean;
  recentImportCount?: number;
  isLoading: boolean;
}

export function NarrativeCard({
  summary,
  hasTransactions,
  hasRecentImport,
  recentImportCount,
  isLoading,
}: NarrativeCardProps) {
  if (isLoading) {
    return (
      <div className="h-20 animate-pulse rounded-lg bg-muted" />
    );
  }

  const state = resolveState(hasTransactions, hasRecentImport);

  if (state === "empty") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <Lightbulb className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium">
            Comece registrando suas primeiras movimentações
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Crie uma conta bancária e registre uma transação, ou importe um
            extrato. Em minutos você terá visibilidade do seu mês.
          </p>
          <div className="mt-2 flex gap-2">
            <Link
              href="/accounts"
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Criar conta
            </Link>
            <Link
              href="/connections"
              className="rounded-md border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
            >
              Importar extrato
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (state === "post_import") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-verdant/20 bg-verdant/5 p-4">
        <FileCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-verdant" />
        <div>
          <p className="text-sm font-medium">
            {recentImportCount
              ? `${recentImportCount} transações importadas`
              : "Importação concluída"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Revise as transações e categorize as que ficaram pendentes para ter
            uma visão precisa do mês.
          </p>
          <div className="mt-2">
            <Link
              href="/transactions"
              className="rounded-md bg-verdant/15 px-3 py-1.5 text-xs font-medium text-verdant hover:bg-verdant/25"
            >
              Revisar transações
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // P5: Neutral summary
  if (!summary) return null;

  const income = summary.month_income;
  const expense = summary.month_expense;
  const net = income - expense;

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
      <TrendingUp className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">
          {net >= 0 ? "Mês com saldo positivo" : "Despesas superaram receitas"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Receitas{" "}
          <span className="font-medium text-verdant">
            <Mv>{formatCurrency(income)}</Mv>
          </span>
          {" · "}Despesas{" "}
          <span className="font-medium text-terracotta">
            <Mv>{formatCurrency(expense)}</Mv>
          </span>
          {" · "}Resultado{" "}
          <span className={`font-medium ${net >= 0 ? "text-verdant" : "text-terracotta"}`}>
            <Mv>{formatCurrency(Math.abs(net))}</Mv>
          </span>
        </p>
      </div>
    </div>
  );
}

function resolveState(
  hasTransactions: boolean,
  hasRecentImport: boolean
): NarrativeState {
  if (!hasTransactions) return "empty";
  if (hasRecentImport) return "post_import";
  return "neutral";
}
