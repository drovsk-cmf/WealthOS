"use client";

/**
 * Oniefy - Calculadoras CFA (E8d)
 *
 * 4 calculadoras front-end only (zero RPC):
 * 1. Independência Financeira (perpetuidade)
 * 2. Comprar vs Alugar (NPV)
 * 3. CET de financiamento (IRR/YTM)
 * 4. SAC vs Price (amortização)
 *
 * Ref: CFA-ONIEFY-MAPPING.md §3 Fase 2
 */

import { useState } from "react";
import { Target, Home, Percent, Scale, ShoppingCart } from "lucide-react";
import { IndependenceCalculator } from "@/components/calculators/independence-calculator";
import { BuyVsRentCalculator } from "@/components/calculators/buy-vs-rent-calculator";
import { CetCalculator } from "@/components/calculators/cet-calculator";
import { SacVsPriceCalculator } from "@/components/calculators/sac-vs-price-calculator";
import { AffordabilitySimulator } from "@/components/calculators/affordability-simulator";

const TABS = [
  {
    id: "affordability",
    label: "Posso comprar?",
    icon: ShoppingCart,
    description: "Simule o impacto de uma compra no seu fôlego financeiro",
  },
  {
    id: "independence",
    label: "Independência",
    icon: Target,
    description: "Quanto preciso para viver de renda?",
  },
  {
    id: "buy-vs-rent",
    label: "Comprar vs Alugar",
    icon: Home,
    description: "Vale mais comprar ou alugar?",
  },
  {
    id: "cet",
    label: "CET",
    icon: Percent,
    description: "Qual o custo real do financiamento?",
  },
  {
    id: "sac-vs-price",
    label: "SAC vs Price",
    icon: Scale,
    description: "Qual sistema de amortização escolher?",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function CalculatorsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("affordability");
  const active = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Calculadoras</h2>
        <p className="text-sm text-muted-foreground">
          Ferramentas de análise financeira com metodologia CFA
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted/50 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active calculator */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">{active.description}</p>
        </div>

        {activeTab === "affordability" && <AffordabilitySimulator />}
        {activeTab === "independence" && <IndependenceCalculator />}
        {activeTab === "buy-vs-rent" && <BuyVsRentCalculator />}
        {activeTab === "cet" && <CetCalculator />}
        {activeTab === "sac-vs-price" && <SacVsPriceCalculator />}
      </div>
    </div>
  );
}
