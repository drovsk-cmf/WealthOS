"use client";

/**
 * Oniefy - Calculadoras Financeiras Layout
 *
 * Tab bar compartilhada entre 7 calculadoras (sub-rotas).
 * Cada aba é uma rota real → deep link, browser back, lazy loading.
 *
 * Ref: docs/FINANCIAL-METHODOLOGY.md §3 Fase 2
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const TABS = [
  {
    href: "/calculators/affordability",
    label: "Posso comprar?",
    description: "Simule o impacto de uma compra no seu fôlego financeiro",
  },
  {
    href: "/calculators/projection",
    label: "Projeção",
    description: "Quanto vou gastar nos próximos 12 meses? Cenários com índices reais (IPCA, IGP-M)",
  },
  {
    href: "/calculators/independence",
    label: "Independência",
    description: "Quanto preciso para viver de renda?",
  },
  {
    href: "/calculators/buy-vs-rent",
    label: "Comprar vs Alugar",
    description: "Vale mais comprar ou alugar?",
  },
  {
    href: "/calculators/cet",
    label: "CET",
    description: "Qual o custo real do financiamento?",
  },
  {
    href: "/calculators/sac-vs-price",
    label: "SAC vs Price",
    description: "Qual sistema de amortização escolher?",
  },
  {
    href: "/calculators/human-capital",
    label: "Capital Humano",
    description: "Quanto vale sua capacidade de gerar renda até a aposentadoria?",
  },
  {
    href: "/calculators/debt-payoff",
    label: "Quitar Dívidas",
    description: "Snowball vs Avalanche: qual estratégia elimina suas dívidas mais rápido?",
  },
] as const;

export default function CalculatorsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = TABS.find((t) => pathname === t.href) ?? TABS[0];

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Calculadoras</h2>
        <p className="text-sm text-muted-foreground">
          Ferramentas de análise e planejamento financeiro
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted p-1">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors text-center ${
                isActive
                  ? "bg-card shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Active calculator */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">{active.description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
