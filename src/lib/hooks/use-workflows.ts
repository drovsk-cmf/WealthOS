/**
 * Oniefy - Workflows Hooks (Phase 6)
 *
 * React Query hooks for workflow and task operations.
 * Stories: WKF-01 (auto-create), WKF-02 (task checklist),
 *          WKF-03 (upload document), WKF-04 (update balance)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { workflowCreateResultSchema, generateTasksResultSchema, completeTaskResultSchema, logSchemaError } from "@/lib/schemas/rpc";
import type { Database } from "@/types/database";

import { FileUp, Wallet, Tag, ClipboardCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Workflow = Database["public"]["Tables"]["workflows"]["Row"];
type WorkflowTask = Database["public"]["Tables"]["workflow_tasks"]["Row"];
type WorkflowType = Database["public"]["Enums"]["workflow_type"];
type WorkflowPeriodicity = Database["public"]["Enums"]["workflow_periodicity"];
type TaskType = Database["public"]["Enums"]["task_type"];
type TaskStatus = Database["public"]["Enums"]["task_status"];

// ─── Labels ─────────────────────────────────────────────────────

export const WORKFLOW_TYPE_LABELS: Record<WorkflowType, string> = {
  bank_statement: "Extrato Bancário",
  card_statement: "Fatura de Cartão",
  loan_payment: "Financiamento",
  investment_update: "Investimento",
  fiscal_review: "Revisão Fiscal",
};

export const PERIODICITY_LABELS: Record<WorkflowPeriodicity, string> = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  upload_document: "Upload de documento",
  update_balance: "Atualizar saldo",
  categorize_transactions: "Categorizar transações",
  review_fiscal: "Revisão fiscal",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  completed: "Concluída",
  skipped: "Pulada",
};

export const TASK_TYPE_ICONS: Record<TaskType, LucideIcon> = {
  upload_document: FileUp,
  update_balance: Wallet,
  categorize_transactions: Tag,
  review_fiscal: ClipboardCheck,
};

export const PERIODICITY_OPTIONS: { value: WorkflowPeriodicity; label: string }[] = [
  { value: "monthly", label: "Mensal" },
  { value: "biweekly", label: "Quinzenal" },
  { value: "weekly", label: "Semanal" },
];

export const WORKFLOW_TYPE_OPTIONS: { value: WorkflowType; label: string }[] = [
  { value: "bank_statement", label: "Extrato Bancário" },
  { value: "card_statement", label: "Fatura de Cartão" },
  { value: "loan_payment", label: "Financiamento" },
  { value: "investment_update", label: "Investimento" },
  { value: "fiscal_review", label: "Revisão Fiscal" },
];

// ─── Task with workflow info ────────────────────────────────────

export interface TaskWithWorkflow extends WorkflowTask {
  workflow_name: string;
  workflow_type: WorkflowType;
}

// ─── Queries ────────────────────────────────────────────────────

/** List all workflows */
export function useWorkflows(activeOnly: boolean = true) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["workflows", activeOnly],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      let query = supabase
        .from("workflows")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (activeOnly) query = query.eq("is_active", true);

      const { data, error } = await query;
      if (error) throw error;
      return data as Workflow[];
    },
  });
}

/** WKF-02: List pending tasks grouped by workflow */
export function usePendingTasks() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["workflow_tasks", "pending"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase
        .from("workflow_tasks")
        .select(`
          *,
          workflows!inner(name, workflow_type, user_id)
        `)
        .eq("workflows.user_id", user.id)
        .in("status", ["pending", "in_progress"])
        .order("period_end", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row: Record<string, unknown>) => ({
        ...(row as WorkflowTask),
        workflow_name: (row.workflows as Record<string, unknown>)?.name as string ?? "",
        workflow_type: (row.workflows as Record<string, unknown>)?.workflow_type as WorkflowType ?? "bank_statement",
      })) as TaskWithWorkflow[];
    },
  });
}

/** Task count for dashboard badge */
export function usePendingTaskCount() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["workflow_tasks", "count"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { count, error } = await supabase
        .from("workflow_tasks")
        .select("*, workflows!inner(user_id)", { count: "exact", head: true })
        .eq("workflows.user_id", user.id)
        .in("status", ["pending", "in_progress"]);

      if (error) throw error;
      return count ?? 0;
    },
  });
}

/** Tasks for a specific workflow */
export function useWorkflowTasks(workflowId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["workflow_tasks", workflowId],
    enabled: !!workflowId,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase
        .from("workflow_tasks")
        .select("*, workflows!inner(user_id)")
        .eq("workflows.user_id", user.id)
        .eq("workflow_id", workflowId!)
        .order("period_start", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(20);

      if (error) throw error;
      return data as WorkflowTask[];
    },
  });
}

// ─── Mutations ──────────────────────────────────────────────────

/** WKF-01: Auto-create workflow when account is created */
export function useAutoCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      accountId,
      accountType,
      accountName,
    }: {
      accountId: string;
      accountType: string;
      accountName: string;
    }) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("auto_create_workflow_for_account", {
        p_user_id: user.id,
        p_account_id: accountId,
        p_account_type: accountType,
        p_account_name: accountName,
      });
      if (error) throw error;
      const parsed = workflowCreateResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("auto_create_workflow_for_account", parsed);
        throw new Error("Resposta inválida ao criar workflow.");
      }
      return parsed.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

/** WKF-01/02: Generate tasks for current month */
export function useGenerateTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: { year?: number; month?: number }) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("generate_tasks_for_period", {
        p_user_id: user.id,
        ...(params?.year && { p_year: params.year }),
        ...(params?.month && { p_month: params.month }),
      });
      if (error) throw error;
      const parsed = generateTasksResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("generate_tasks_for_period", parsed);
        throw new Error("Resposta inválida ao gerar tarefas.");
      }
      return parsed.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow_tasks"] });
    },
  });
}

/** WKF-02/03/04: Complete or skip a task */
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      status = "completed",
      resultData,
    }: {
      taskId: string;
      status?: "completed" | "skipped";
      resultData?: Record<string, unknown>;
    }) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("complete_workflow_task", {
        p_user_id: user.id,
        p_task_id: taskId,
        p_status: status,
        ...(resultData && { p_result_data: JSON.stringify(resultData) }),
      });
      if (error) throw error;
      const parsed = completeTaskResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("complete_workflow_task", parsed);
        throw new Error("Resposta inválida ao completar tarefa.");
      }
      return parsed.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

/** Create workflow manually */
export function useCreateWorkflow() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      workflow_type: WorkflowType;
      periodicity: WorkflowPeriodicity;
      related_account_id?: string | null;
      day_of_period?: number | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase
        .from("workflows")
        .insert({
          user_id: user.id,
          name: input.name,
          workflow_type: input.workflow_type,
          periodicity: input.periodicity,
          related_account_id: input.related_account_id ?? null,
          day_of_period: input.day_of_period ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Workflow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

/** Deactivate workflow */
export function useDeactivateWorkflow() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { error } = await supabase
        .from("workflows")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["workflow_tasks"] });
    },
  });
}
