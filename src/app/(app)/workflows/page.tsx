"use client";

/**
 * Oniefy - Tarefas / Workflows (Phase 6)
 *
 * WKF-01: Auto-create workflows (integrated into account creation hook)
 * WKF-02: Pending tasks as checklist, grouped by workflow
 * WKF-03: Upload document in task (stub - marks complete with note)
 * WKF-04: Update balance directly in task
 *
 * Two tabs: "Tarefas" (pending checklist) + "Workflows" (manage rules)
 */

import { useState } from "react";
import {
  useWorkflows,
  usePendingTasks,
  useGenerateTasks,
  useCompleteTask,
  useCreateWorkflow,
  useDeactivateWorkflow,
  WORKFLOW_TYPE_LABELS,
  PERIODICITY_LABELS,
  TASK_TYPE_LABELS,
  TASK_TYPE_ICONS,
  WORKFLOW_TYPE_OPTIONS,
  PERIODICITY_OPTIONS,
} from "@/lib/hooks/use-workflows";
import { useAutoReset, useEscapeClose } from "@/lib/hooks/use-dialog-helpers";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { formatDate } from "@/lib/utils";
import type { Database } from "@/types/database";
import type { TaskWithWorkflow } from "@/lib/hooks/use-workflows";

type Tab = "tasks" | "workflows";
type WorkflowType = Database["public"]["Enums"]["workflow_type"];
type WorkflowPeriodicity = Database["public"]["Enums"]["workflow_periodicity"];

// ─── Task Action Component ──────────────────────────────────────

function TaskAction({
  task,
  onComplete,
  isPending,
}: {
  task: TaskWithWorkflow;
  onComplete: (taskId: string, status: "completed" | "skipped", resultData?: Record<string, unknown>) => void;
  isPending: boolean;
}) {
  const [balanceValue, setBalanceValue] = useState("");
  const [showInput, setShowInput] = useState(false);

  if (task.task_type === "update_balance") {
    // WKF-04: Update balance form
    if (!showInput) {
      return (
        <div className="flex gap-1">
          <button onClick={() => setShowInput(true)}
            className="rounded-md bg-info-slate/15 px-2.5 py-1 text-xs font-medium text-info-slate hover:bg-info-slate/20">
            Atualizar saldo
          </button>
          <button onClick={() => onComplete(task.id, "skipped")} disabled={isPending}
            className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent">
            Pular
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <input type="text" inputMode="decimal" value={balanceValue}
          onChange={(e) => setBalanceValue(e.target.value)}
          placeholder="Saldo atual" autoFocus
          className="h-7 w-28 rounded border border-input bg-background px-2 text-xs" />
        <button
          onClick={() => {
            const val = parseFloat(balanceValue.replace(",", "."));
            if (!isNaN(val)) {
              onComplete(task.id, "completed", { new_balance: val });
            }
          }}
          disabled={isPending}
          className="rounded-md bg-verdant px-2 py-1 text-xs font-medium text-white hover:bg-verdant/80">
          OK
        </button>
        <button onClick={() => setShowInput(false)}
          className="rounded-md px-2 py-1 text-xs text-muted-foreground">
          Cancelar
        </button>
      </div>
    );
  }

  if (task.task_type === "upload_document") {
    // WKF-03: Upload stub (full OCR in Phase 10)
    return (
      <div className="flex gap-1">
        <button
          onClick={() => onComplete(task.id, "completed", { note: "Documento conferido manualmente" })}
          disabled={isPending}
          className="rounded-md bg-verdant/15 px-2.5 py-1 text-xs font-medium text-verdant hover:bg-verdant/20">
          Concluir
        </button>
        <button onClick={() => onComplete(task.id, "skipped")} disabled={isPending}
          className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent">
          Pular
        </button>
      </div>
    );
  }

  // Generic: categorize_transactions, review_fiscal
  return (
    <div className="flex gap-1">
      <button
        onClick={() => onComplete(task.id, "completed")}
        disabled={isPending}
        className="rounded-md bg-verdant/15 px-2.5 py-1 text-xs font-medium text-verdant hover:bg-verdant/20">
        Concluir
      </button>
      <button onClick={() => onComplete(task.id, "skipped")} disabled={isPending}
        className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent">
        Pular
      </button>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function WorkflowsPage() {
  const [tab, setTab] = useState<Tab>("tasks");
  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);

  useAutoReset(confirmDeactivate, setConfirmDeactivate);
  useEscapeClose(showNewWorkflow, () => setShowNewWorkflow(false));

  // New workflow form state
  const [wfName, setWfName] = useState("");
  const [wfType, setWfType] = useState<WorkflowType>("bank_statement");
  const [wfPeriodicity, setWfPeriodicity] = useState<WorkflowPeriodicity>("monthly");
  const [wfAccountId, setWfAccountId] = useState("");
  const [wfError, setWfError] = useState("");

  const { data: pendingTasks, isLoading: loadingTasks } = usePendingTasks();
  const { data: workflows, isLoading: loadingWf } = useWorkflows();
  const { data: accounts } = useAccounts();
  const generateTasks = useGenerateTasks();
  const completeTask = useCompleteTask();
  const createWorkflow = useCreateWorkflow();
  const deactivateWorkflow = useDeactivateWorkflow();

  // Group tasks by workflow
  const groupedTasks = (pendingTasks ?? []).reduce(
    (acc, task) => {
      const key = task.workflow_name || "Sem workflow";
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    },
    {} as Record<string, TaskWithWorkflow[]>
  );

  function handleCompleteTask(
    taskId: string,
    status: "completed" | "skipped",
    resultData?: Record<string, unknown>
  ) {
    completeTask.mutate({ taskId, status, resultData });
  }

  async function handleGenerateTasks() {
    await generateTasks.mutateAsync({});
  }

  async function handleCreateWorkflow(e: React.FormEvent) {
    e.preventDefault();
    setWfError("");
    if (!wfName.trim()) { setWfError("Nome é obrigatório."); return; }

    try {
      await createWorkflow.mutateAsync({
        name: wfName.trim(),
        workflow_type: wfType,
        periodicity: wfPeriodicity,
        related_account_id: wfAccountId || null,
      });
      setShowNewWorkflow(false);
      setWfName("");
    } catch (err) {
      setWfError(err instanceof Error ? err.message : "Erro ao criar.");
    }
  }

  async function handleDeactivate(id: string) {
    await deactivateWorkflow.mutateAsync(id);
    setConfirmDeactivate(null);
  }

  const isLoading = tab === "tasks" ? loadingTasks : loadingWf;
  const pendingCount = pendingTasks?.length ?? 0;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tarefas</h1>
          <p className="text-sm text-muted-foreground">
            Rituais periódicos de organização financeira
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleGenerateTasks} disabled={generateTasks.isPending}
            className="rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50">
            {generateTasks.isPending ? "Gerando" : "Gerar tarefas do mês"}
          </button>
        </div>
      </div>

      {/* Generation result toast */}
      {generateTasks.data && (
        <div className="rounded-lg border border-verdant/20 bg-verdant/10 px-4 py-3 text-sm text-verdant">
          {generateTasks.data.tasks_created} tarefa(s) criada(s)
          {generateTasks.data.workflows_skipped > 0 &&
            `, ${generateTasks.data.workflows_skipped} workflow(s) já tinham tarefas`}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1">
        {([
          { key: "tasks" as const, label: "Pendentes", count: pendingCount },
          { key: "workflows" as const, label: "Workflows", count: workflows?.length ?? 0 },
        ]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ═══ TAB: Tarefas Pendentes (WKF-02, WKF-03, WKF-04) ═══ */}
      {tab === "tasks" && (
        <>
          {pendingCount === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
              
              <h2 className="mt-2 text-lg font-semibold">Nenhuma tarefa pendente</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Use &ldquo;Gerar tarefas do mês&rdquo; para criar tarefas dos workflows ativos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedTasks).map(([workflowName, tasks]) => (
                <div key={workflowName} className="rounded-lg border bg-card shadow-sm">
                  <div className="border-b px-4 py-2.5">
                    <p className="text-sm font-semibold">{workflowName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDate(tasks[0].period_start, "MMM yyyy")} · {tasks.length} tarefa(s)
                    </p>
                  </div>

                  <div className="divide-y">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                        {/* Task icon */}
                        {(() => { const Icon = TASK_TYPE_ICONS[task.task_type]; return <Icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />; })()}

                        {/* Task info */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {task.description || TASK_TYPE_LABELS[task.task_type]}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {TASK_TYPE_LABELS[task.task_type]} ·{" "}
                            {task.status === "in_progress" ? "Em andamento" : "Pendente"}
                          </p>
                        </div>

                        {/* Actions */}
                        <TaskAction
                          task={task}
                          onComplete={handleCompleteTask}
                          isPending={completeTask.isPending}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══ TAB: Workflows (WKF-01 management) ═══ */}
      {tab === "workflows" && (
        <>
          <div className="flex justify-end">
            <button onClick={() => setShowNewWorkflow(true)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              + Novo workflow
            </button>
          </div>

          {(!workflows || workflows.length === 0) ? (
            <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
              
              <h2 className="mt-2 text-lg font-semibold">Nenhum workflow ativo</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Workflows são criados automaticamente ao cadastrar contas bancárias, cartões e investimentos.
                Você também pode criar manualmente.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {workflows.map((wf) => (
                <div key={wf.id} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{wf.name}</p>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {WORKFLOW_TYPE_LABELS[wf.workflow_type]}
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {PERIODICITY_LABELS[wf.periodicity]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {wf.last_completed_at
                        ? `Último: ${formatDate(wf.last_completed_at)}`
                        : "Nunca concluído"}
                    </p>
                  </div>

                  {/* Deactivate */}
                  {confirmDeactivate === wf.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDeactivate(wf.id)} disabled={deactivateWorkflow.isPending}
                        className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground">
                        Encerrar
                      </button>
                      <button onClick={() => setConfirmDeactivate(null)}
                        className="rounded-md px-2 py-1 text-xs text-muted-foreground">Não</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeactivate(wf.id)}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title="Encerrar workflow">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* New workflow dialog */}
      {showNewWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowNewWorkflow(false)} />
          <div className="relative z-50 mx-4 w-full max-w-md rounded-lg border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Novo Workflow</h2>

            <form onSubmit={handleCreateWorkflow} className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <input type="text" value={wfName} onChange={(e) => setWfName(e.target.value)}
                  placeholder="Ex: Extrato Nubank" required
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <select value={wfType} onChange={(e) => setWfType(e.target.value as WorkflowType)}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {WORKFLOW_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Periodicidade</label>
                  <select value={wfPeriodicity} onChange={(e) => setWfPeriodicity(e.target.value as WorkflowPeriodicity)}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {PERIODICITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Conta vinculada (opcional)</label>
                <select value={wfAccountId} onChange={(e) => setWfAccountId(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Nenhuma</option>
                  {accounts?.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              {wfError && (
                <p className="rounded bg-terracotta/10 px-3 py-2 text-sm text-terracotta">{wfError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowNewWorkflow(false)}
                  className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
                  Cancelar
                </button>
                <button type="submit" disabled={createWorkflow.isPending}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {createWorkflow.isPending ? "Criando" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
