"use client";

/**
 * UX-H1-02: Onboarding Step 8 - Route Choice
 *
 * Device-aware recommendation:
 * - Mobile (< 1024px): "Lançamento rápido" as primary
 * - Desktop (>= 1024px): "Importar extrato" as primary
 *
 * 3 routes:
 * A = manual (create account + first transaction)
 * B = import (redirect to /connections)
 * C = snapshot (register key assets)
 */

import { useEffect, useState } from "react";
import {
  PenLine,
  FileUp,
  Building,
  Sparkles,
  Clock,
  ChevronRight,
} from "lucide-react";

export type OnboardingRoute = "manual" | "import" | "snapshot";

interface RouteOption {
  id: OnboardingRoute;
  title: string;
  description: string;
  estimate: string;
  icon: React.ReactNode;
}

const ROUTES: RouteOption[] = [
  {
    id: "manual",
    title: "Lançamento rápido",
    description: "Crie uma conta e registre sua primeira transação.",
    estimate: "~2 min",
    icon: <PenLine className="h-5 w-5" />,
  },
  {
    id: "import",
    title: "Importar extrato",
    description: "Importe seu extrato bancário (CSV, OFX ou XLSX).",
    estimate: "~3 min",
    icon: <FileUp className="h-5 w-5" />,
  },
  {
    id: "snapshot",
    title: "Fotografia patrimonial",
    description: "Registre seus principais bens (imóvel, veículo, etc.).",
    estimate: "~2 min",
    icon: <Building className="h-5 w-5" />,
  },
];

interface RouteChoiceStepProps {
  onSelect: (route: OnboardingRoute) => void;
  onSkip: () => void;
}

export function RouteChoiceStep({ onSelect, onSkip }: RouteChoiceStepProps) {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    setIsMobile(window.innerWidth < 1024);
  }, []);

  // Mobile → manual first, Desktop → import first
  const recommended: OnboardingRoute = isMobile ? "manual" : "import";
  const primary = ROUTES.find((r) => r.id === recommended)!;
  const alternatives = ROUTES.filter((r) => r.id !== recommended);

  return (
    <>
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Como você quer começar?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Escolha o caminho que faz mais sentido agora. Você pode fazer os
          outros depois.
        </p>
      </div>

      {/* Recommended route (dominant card) */}
      <button
        onClick={() => onSelect(primary.id)}
        className="group relative w-full rounded-xl border-2 border-primary bg-primary/5 p-5 text-left transition-colors hover:bg-primary/10"
      >
        <div className="mb-1 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">Recomendado</span>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {primary.icon}
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold">{primary.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {primary.description}
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {primary.estimate}
            </div>
          </div>
          <ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </button>

      {/* Alternative routes (smaller cards) */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Ou escolha outra opção:
        </p>
        {alternatives.map((route) => (
          <button
            key={route.id}
            onClick={() => onSelect(route.id)}
            className="group flex w-full items-center gap-3 rounded-lg border border-input p-3 text-left transition-colors hover:bg-accent"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              {route.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{route.title}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {route.estimate}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>

      {/* Skip link */}
      <button
        onClick={onSkip}
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground hover:underline"
      >
        Pular e explorar por conta própria
      </button>
    </>
  );
}
