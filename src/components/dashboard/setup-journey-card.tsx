"use client";

/**
 * SetupJourneyCard - Cronograma guiado de 5 etapas (P15)
 *
 * Aparece no topo do Dashboard até que todas as 7 tarefas
 * sejam concluídas. Organiza as tarefas em 5 etapas, cada
 * uma entregando valor progressivo.
 *
 * Etapa 1: Primeiros passos (data de corte + contas)     — 2 tarefas
 * Etapa 2: Despesas fixas (recorrências)                 — 1 tarefa
 * Etapa 3: Importação (extratos + faturas)               — 2 tarefas
 * Etapa 4: Organização (categorização)                   — 1 tarefa
 * Etapa 5: Controle (orçamento)                          — 1 tarefa
 *
 * Contador no header mostra "X/5 etapas" (etapas concluídas).
 * Barra de progresso usa as 7 tarefas individuais para feedback granular.
 *
 * Step 1 (cutoff_date) abre modal inline em vez de navegar.
 * Referência: adendo v1.5 §4.4.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Lock, ChevronRight, Sparkles } from "lucide-react";
import { useSetupJourney, STEP_ROUTES } from "@/lib/hooks/use-setup-journey";
import { CutoffDateModal } from "./cutoff-date-modal";
import type { SetupStep } from "@/lib/hooks/use-setup-journey";

const WEEK_LABELS: Record<number, { title: string; value: string }> = {
  1: { title: "Primeiros passos", value: "Contas configuradas" },
  2: { title: "Despesas fixas", value: "Recorrências no radar" },
  3: { title: "Importação", value: "Histórico carregado" },
  4: { title: "Organização", value: "Categorias ajustadas" },
  5: { title: "Controle", value: "Orçamento ativo" },
};

function StepIcon({ status }: { status: SetupStep["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-verdant" />;
    case "available":
    case "in_progress":
      return <Circle className="h-4 w-4 text-primary" />;
    case "locked":
      return <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />;
  }
}

function weekStatus(steps: SetupStep[]): "completed" | "active" | "locked" {
  if (steps.every((s) => s.status === "completed")) return "completed";
  if (steps.some((s) => s.status === "available" || s.status === "in_progress")) return "active";
  return "locked";
}

export function SetupJourneyCard() {
  const router = useRouter();
  const { data, isLoading } = useSetupJourney();
  const [cutoffOpen, setCutoffOpen] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  if (isLoading || !data || data.all_done) return null;

  // Barra de progresso: baseada em tarefas individuais (7) para feedback granular
  const taskProgress = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

  // Group steps by week (etapa)
  const weeks = new Map<number, SetupStep[]>();
  for (const step of data.steps ?? []) {
    const w = step.week_number ?? 1;
    if (!weeks.has(w)) weeks.set(w, []);
    weeks.get(w)!.push(step);
  }

  // Contador do header: etapas concluídas (100% das tarefas da etapa feitas)
  const completedEtapas = [...weeks.values()].filter(
    (steps) => weekStatus(steps) === "completed"
  ).length;
  const totalEtapas = weeks.size; // 5

  // Auto-expand the active week
  const activeWeek = [...weeks.entries()].find(
    ([, steps]) => weekStatus(steps) === "active"
  )?.[0];

  const visibleWeek = expandedWeek ?? activeWeek ?? 1;

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
            <h3 className="font-semibold">Seu plano de 5 etapas</h3>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {completedEtapas}/{totalEtapas} etapas
          </span>
        </div>

        {/* Progress bar — usa 7 tarefas para granularidade */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bar-primary transition-all duration-500"
            style={{ width: `${taskProgress}%` }}
          />
        </div>

        {/* Cutoff date badge */}
        {data.cutoff_date && (
          <p className="mt-2 text-xs text-muted-foreground">
            Data de corte:{" "}
            <span className="font-medium text-foreground">
              {new Date(data.cutoff_date + "T12:00:00").toLocaleDateString("pt-BR")}
            </span>
          </p>
        )}

        {/* Week tabs */}
        <div className="mt-4 flex gap-1">
          {[...weeks.entries()].map(([weekNum, steps]) => {
            const ws = weekStatus(steps);
            const isVisible = weekNum === visibleWeek;
            return (
              <button
                key={weekNum}
                type="button"
                onClick={() => setExpandedWeek(weekNum)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  isVisible
                    ? "bg-primary text-primary-foreground"
                    : ws === "completed"
                      ? "bg-verdant/10 text-verdant"
                      : ws === "active"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground/60"
                }`}
              >
                {weekNum}
                {ws === "completed" && (
                  <CheckCircle2 className="ml-1 inline-block h-3 w-3" />
                )}
              </button>
            );
          })}
        </div>

        {/* Week detail */}
        {weeks.has(visibleWeek) && (
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">
                {WEEK_LABELS[visibleWeek]?.title}
              </p>
              <span className="text-[10px] text-muted-foreground">
                Entrega: {WEEK_LABELS[visibleWeek]?.value}
              </span>
            </div>

            <div className="space-y-0.5">
              {weeks.get(visibleWeek)!.map((step) => {
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
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-primary/5 font-medium text-foreground hover:bg-primary/10"
                        : isCompleted
                          ? "text-muted-foreground"
                          : "text-muted-foreground/50 cursor-not-allowed"
                    }`}
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
          </div>
        )}

        {/* CTA for current step */}
        {activeWeek !== undefined && (() => {
          const currentStep = weeks.get(activeWeek)?.find(
            (s) => s.status === "available" || s.status === "in_progress"
          );
          if (!currentStep) return null;
          return (
            <button
              type="button"
              onClick={() => handleStepClick(currentStep.step_key)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md btn-cta px-4 py-2.5 text-sm font-medium text-primary-foreground"
            >
              {currentStep.title}
              <ChevronRight className="h-4 w-4" />
            </button>
          );
        })()}
      </div>

      {/* Cutoff date modal (step 1) */}
      <CutoffDateModal open={cutoffOpen} onClose={() => setCutoffOpen(false)} />
    </>
  );
}
