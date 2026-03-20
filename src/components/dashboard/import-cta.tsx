"use client";

/**
 * ImportCTA - Botão grande de importação no dashboard
 *
 * Aparece quando o usuário tem poucas transações (< 20).
 * Promove a importação como ação principal para gerar valor rápido.
 * Referência: adendo v1.5 §2.6 (P2).
 */

import Link from "next/link";
import { Upload, ArrowRight } from "lucide-react";

interface Props {
  transactionCount: number;
  isLoading: boolean;
}

export function ImportCTA({ transactionCount, isLoading }: Props) {
  // Oculta após 20 transações (usuário já engajou)
  if (isLoading || transactionCount >= 20) return null;

  return (
    <Link
      href="/connections"
      className="group flex items-center gap-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-5 transition-colors hover:border-primary/50 hover:bg-primary/10"
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 transition-colors group-hover:bg-primary/25">
        <Upload className="h-6 w-6 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">
          Importe seus extratos e faturas
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {transactionCount === 0
            ? "Comece importando um extrato bancário ou fatura de cartão para ver suas finanças."
            : "Continue importando para ter uma visão completa das suas finanças."}
        </p>
      </div>
      <ArrowRight className="h-5 w-5 flex-shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
