"use client";

/**
 * SetupJourneyCard - Checklist de onboarding guiado
 *
 * Aparece no topo do Dashboard até que todos os 7 passos
 * sejam concluídos. Mostra progresso, passo atual e link
 * para a ação correspondente.
 *
 * Step 1 (cutoff_date) abre modal inline em vez de navegar.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Lock, ChevronRight, Sparkles } from "lucide-react";
import { useSetupJourney, STEP_ROUTES } from "@/lib/hooks/use-setup-journey";
import { CutoffDateModal } from "./cutoff-date-modal";
import type { SetupStep } from "@/lib/hooks/use-setup-journey";

function StepIcon({ status }: { status: SetupStep["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-verdant" />;
    case "available":
    case "in_progress":
      return <Circle className="h-5 w-5 text-primary" />;
    case "locked":
      return <Lock className="h-4 w-4 text-muted-foreground/50" />;
  }
}

export function SetupJourneyCard() {
  const router = useRouter();
  const { data, isLoading } = useSetupJourney();
  const [cutoffOpen, setCutoffOpen] = useState(false);

  // Don't render while loading or if journey is complete
  if (isLoading || !data || data.all_done) return null;

  const progress = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
  const currentStep = data.steps?.find(
    (s) => s.status === "available" || s.status === "in_progress"
  );

  function handleStepClick(stepKey: string) {
    if (stepKey === "cutoff_date") {
      setCutoffOpen(true);
      return;
    }
    const route = STEP_ROUTES[stepKey];
    if (route) router.push(route);
  }

  return (
    <>
      <div className="rounded-lg border bg-card p-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Configuração do Oniefy</h3>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {data.completed}/{data.total} concluídos
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Cutoff date badge (if set) */}
        {data.cutoff_date && (
          <p className="mt-2 text-xs text-muted-foreground">
            Data de corte: <span className="font-medium text-foreground">
              {new Date(data.cutoff_date + "T12:00:00").toLocaleDateString("pt-BR")}
            </span>
          </p>
        )}

        {/* Steps list */}
        <div className="mt-4 space-y-1">
          {data.steps?.map((step) => {
            const isActive =
              step.status === "available" || step.status === "in_progress";
            const isCompleted = step.status === "completed";
            const isLocked = step.status === "locked";

            return (
              <button
                key={step.step_key}
                type="button"
                disabled={isLocked}
                onClick={() => handleStepClick(step.step_key)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                  isActive
                    ? "bg-primary/5 font-medium text-foreground"
                    : isCompleted
                      ? "text-muted-foreground"
                      : "text-muted-foreground/50"
                } ${isActive ? "hover:bg-primary/10" : ""} ${isLocked ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                <StepIcon status={step.status} />
                <div className="min-w-0 flex-1">
                  <p className={isCompleted ? "line-through" : ""}>
                    {step.title}
                  </p>
                  {isActive && (
                    <p className="mt-0.5 text-xs text-muted-foreground font-normal">
                      {step.description}
                    </p>
                  )}
                </div>
                {isActive && (
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* CTA for current step */}
        {currentStep && (
          <button
            type="button"
            onClick={() => handleStepClick(currentStep.step_key)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {currentStep.title}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Cutoff date modal (step 1) */}
      <CutoffDateModal open={cutoffOpen} onClose={() => setCutoffOpen(false)} />
    </>
  );
}
