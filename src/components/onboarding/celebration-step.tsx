"use client";

/**
 * UX-H1-02: Onboarding Step 10 - Celebration
 *
 * Adult celebration: no confetti. Clear summary of what was configured,
 * stats from route execution, and a clear CTA to the right destination.
 */

import { Check, ArrowRight, BarChart3, Wallet, Building } from "lucide-react";
import type { OnboardingRoute } from "./route-choice-step";

interface CelebrationStepProps {
  route: OnboardingRoute | null;
  stats: { accounts?: number; transactions?: number; assets?: number };
  onGoToApp: () => void;
}

const ROUTE_LABELS: Record<OnboardingRoute, string> = {
  manual: "Lançamento rápido",
  import: "Importação de extrato",
  snapshot: "Fotografia patrimonial",
};

export function CelebrationStep({
  route,
  stats,
  onGoToApp,
}: CelebrationStepProps) {
  // Build stats items to show
  const statItems: { icon: React.ReactNode; label: string }[] = [
    { icon: <Check className="h-3.5 w-3.5" />, label: "Criptografia configurada" },
    { icon: <Check className="h-3.5 w-3.5" />, label: "Autenticação 2FA ativada" },
    { icon: <Check className="h-3.5 w-3.5" />, label: "Categorias e plano de contas criados" },
  ];

  if (stats.accounts && stats.accounts > 0) {
    statItems.push({
      icon: <Wallet className="h-3.5 w-3.5" />,
      label: `${stats.accounts} conta${stats.accounts > 1 ? "s" : ""} criada${stats.accounts > 1 ? "s" : ""}`,
    });
  }
  if (stats.transactions && stats.transactions > 0) {
    statItems.push({
      icon: <BarChart3 className="h-3.5 w-3.5" />,
      label: `${stats.transactions} transaç${stats.transactions > 1 ? "ões registradas" : "ão registrada"}`,
    });
  }
  if (stats.assets && stats.assets > 0) {
    statItems.push({
      icon: <Building className="h-3.5 w-3.5" />,
      label: `${stats.assets} be${stats.assets > 1 ? "ns registrados" : "m registrado"}`,
    });
  }

  // Suggest next step based on what was NOT done
  const nextSuggestion = getNextSuggestion(route, stats);

  return (
    <>
      {/* Success icon */}
      <div className="flex flex-col items-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-verdant/15">
          <svg
            className="h-8 w-8 text-verdant"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Sua base financeira está configurada
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          O Oniefy está pronto para organizar sua vida financeira.
        </p>
      </div>

      {/* Configuration summary */}
      <div className="space-y-2 rounded-lg border bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground">
          O que foi configurado:
        </p>
        {statItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2.5 text-sm">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-verdant/15 text-verdant">
              {item.icon}
            </span>
            {item.label}
          </div>
        ))}
      </div>

      {/* Next step suggestion */}
      {nextSuggestion && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs font-medium text-primary">Próximo passo sugerido</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {nextSuggestion}
          </p>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onGoToApp}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Ir para o Início
        <ArrowRight className="h-4 w-4" />
      </button>
    </>
  );
}

function getNextSuggestion(
  route: OnboardingRoute | null,
  stats: { accounts?: number; transactions?: number; assets?: number }
): string | null {
  if (!route || route === "manual") {
    if (!stats.transactions || stats.transactions === 0) {
      return "Registre sua primeira transação para ativar o painel financeiro.";
    }
    return "Importe um extrato bancário para ter uma visão completa do mês.";
  }
  if (route === "import") {
    return "Revise as transações importadas e categorize as pendentes.";
  }
  if (route === "snapshot") {
    return "Crie uma conta bancária e registre transações para acompanhar seu fluxo.";
  }
  return null;
}
