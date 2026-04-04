/**
 * Oniefy - Motor Financeiro v2 Hook (Máquina de Estados)
 *
 * Substitui get_financial_scan (flat) por get_financial_engine_v2 (grafo de dependências).
 * 6 camadas: dados → métricas → indicadores → estado → prioridades → conflitos → ações.
 *
 * Estados: SEM_DADOS | CRISE | SOBREVIVENCIA | ESTABILIZACAO | OTIMIZACAO | CRESCIMENTO
 * Cada estado tem sua própria fila de prioridades com conflitos resolvidos.
 *
 * Ref: FINANCIAL-METHODOLOGY.md, sessão 33
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getCachedUserId } from "@/lib/supabase/cached-auth";
import { engineV2Schema, logSchemaError } from "@/lib/schemas/rpc";
import type { z } from "zod";

// ─── Types ─────────────────────────────────────────────────

export type EngineV2Result = z.infer<typeof engineV2Schema>;
export type EngineState = EngineV2Result["state"];
export type EngineAction = EngineV2Result["actions"][number];
export type EngineClassification = EngineV2Result["classification_inputs"];
export type EngineMetrics = EngineV2Result["metrics"];

// ─── Empty state ───────────────────────────────────────────

const EMPTY_RESULT: EngineV2Result = {
  state: "SEM_DADOS",
  classification_inputs: {
    reserve_ratio: 0, debt_stress: 0, savings_rate: 0,
    fi_progress: 0, income_cv: 0, base_months: 3, reserve_target: 0,
  },
  metrics: {
    avg_income: 0, avg_expense: 0, surplus: 0, burn_rate: 0,
    liquid_assets: 0, illiquid_assets: 0, total_debt: 0,
    debt_uncollateralized: 0, net_worth: 0, wacc_monthly: 0,
    hhi: 0, hhi_top_item: "", hhi_top_pct: 0,
    cdi_monthly: 0, cdi_annual: 0, months_analyzed: 0,
  },
  actions: [],
  actions_count: 0,
};

// ─── Hook ──────────────────────────────────────────────────

/**
 * Fetches financial engine v2 result (state machine + dependency graph).
 * staleTime: 10 min (data changes slowly, RPC is moderately expensive).
 */
export function useEngineV2() {
  return useQuery({
    queryKey: ["scanner", "engine-v2"],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<EngineV2Result> => {
      const supabase = createClient();
      const userId = await getCachedUserId(supabase);
      const { data, error } = await supabase.rpc(
        "get_financial_engine_v2",
        { p_user_id: userId },
      );
      if (error) throw error;
      const parsed = engineV2Schema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_financial_engine_v2", parsed);
        return EMPTY_RESULT;
      }
      return parsed.data;
    },
  });
}

// ─── State Helpers ─────────────────────────────────────────

interface StateInfo {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: "alert-triangle" | "shield-alert" | "shield" | "trending-up" | "rocket" | "help-circle";
}

const STATE_MAP: Record<EngineState, StateInfo> = {
  SEM_DADOS: {
    label: "Sem dados",
    description: "Registre transações e contas para ativar o diagnóstico.",
    color: "text-muted-foreground",
    bgColor: "bg-muted/30",
    borderColor: "border-muted",
    icon: "help-circle",
  },
  CRISE: {
    label: "Crise",
    description: "Ação imediata necessária. Foco: estancar saídas e renegociar dívidas.",
    color: "text-ember-600 dark:text-ember-400",
    bgColor: "bg-ember-50 dark:bg-ember-950/30",
    borderColor: "border-ember-200 dark:border-ember-800",
    icon: "alert-triangle",
  },
  SOBREVIVENCIA: {
    label: "Sobrevivência",
    description: "Margem mínima. Foco: construir reserva e eliminar dívida cara.",
    color: "text-coral-600 dark:text-coral-400",
    bgColor: "bg-coral-50 dark:bg-coral-950/30",
    borderColor: "border-coral-200 dark:border-coral-800",
    icon: "shield-alert",
  },
  ESTABILIZACAO: {
    label: "Estabilização",
    description: "Construindo a base. Foco: reserva de emergência e controle de gastos.",
    color: "text-burnished-600 dark:text-burnished-400",
    bgColor: "bg-burnished-50 dark:bg-burnished-950/30",
    borderColor: "border-burnished-200 dark:border-burnished-800",
    icon: "shield",
  },
  OTIMIZACAO: {
    label: "Otimização",
    description: "Base sólida. Foco: eficiência tributária, diversificação e retorno real.",
    color: "text-verdant-600 dark:text-verdant-400",
    bgColor: "bg-verdant-50 dark:bg-verdant-950/30",
    borderColor: "border-verdant-200 dark:border-verdant-800",
    icon: "trending-up",
  },
  CRESCIMENTO: {
    label: "Crescimento",
    description: "Acumulação acelerada. Foco: maximizar retorno real e independência financeira.",
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    borderColor: "border-teal-200 dark:border-teal-800",
    icon: "rocket",
  },
};

export function getStateInfo(state: EngineState): StateInfo {
  return STATE_MAP[state];
}

/** Human-readable label for classification inputs */
export function classificationLabel(key: keyof EngineClassification): string {
  const labels: Record<string, string> = {
    reserve_ratio: "Reserve Ratio (RR)",
    debt_stress: "Debt Stress (DS)",
    savings_rate: "Taxa de poupança (SR)",
    fi_progress: "Progresso ind. financeira (FI)",
    income_cv: "Volatilidade de renda (CV)",
    base_months: "Meses-base de reserva",
    reserve_target: "Target de reserva (R$)",
  };
  return labels[key] ?? key;
}

/** Format classification value for display */
export function formatClassificationValue(key: keyof EngineClassification, value: number): string {
  switch (key) {
    case "reserve_ratio":
    case "debt_stress":
      return value >= 999 ? "∞" : value.toFixed(2);
    case "savings_rate":
      return `${value.toFixed(1)}%`;
    case "fi_progress":
      return `${(value * 100).toFixed(1)}%`;
    case "income_cv":
      return value.toFixed(3);
    case "base_months":
      return `${value} meses`;
    case "reserve_target":
      return `R$ ${Math.round(value).toLocaleString("pt-BR")}`;
    default:
      return String(value);
  }
}

/** Color for classification input based on health */
export function classificationColor(key: keyof EngineClassification, value: number): string {
  switch (key) {
    case "reserve_ratio":
      if (value >= 1.5) return "text-verdant-600 dark:text-verdant-400";
      if (value >= 1.0) return "text-foreground";
      if (value >= 0.5) return "text-burnished-600 dark:text-burnished-400";
      return "text-ember-600 dark:text-ember-400";
    case "debt_stress":
      if (value <= 0.3) return "text-verdant-600 dark:text-verdant-400";
      if (value <= 0.8) return "text-foreground";
      if (value <= 1.5) return "text-burnished-600 dark:text-burnished-400";
      return "text-ember-600 dark:text-ember-400";
    case "savings_rate":
      if (value >= 20) return "text-verdant-600 dark:text-verdant-400";
      if (value >= 10) return "text-foreground";
      if (value >= 0) return "text-burnished-600 dark:text-burnished-400";
      return "text-ember-600 dark:text-ember-400";
    case "fi_progress":
      if (value >= 0.5) return "text-verdant-600 dark:text-verdant-400";
      if (value >= 0.1) return "text-foreground";
      return "text-muted-foreground";
    default:
      return "text-foreground";
  }
}

/** Rule ID to human-readable label */
export function ruleLabel(ruleId: string): string {
  const labels: Record<string, string> = {
    "CRISE-P1": "Corte de emergência",
    "CRISE-P2": "Renegociação urgente",
    "R01": "Ativo abaixo do CDI",
    "R02": "Dívida cara",
    "R02-CONFLICT": "Dívida usurária (prioridade sobre reserva)",
    "R03": "Assinaturas",
    "R07": "Reserva de emergência",
    "R09": "Concentração de renda",
    "HHI": "Concentração patrimonial",
    "SR": "Taxa de poupança",
    "FI": "Independência financeira",
    "FISCAL": "Otimização fiscal",
  };
  return labels[ruleId] ?? ruleId;
}
