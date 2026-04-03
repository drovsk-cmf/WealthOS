/**
 * Oniefy - Scanner Financeiro Hook
 *
 * React Query hook for Motor Financeiro (Camada 1 Scanner + Camada 2 Combinador).
 * Calls get_financial_scan RPC which runs 6 deterministic rules (R03,R06,R07,R08,R09,R10)
 * and returns findings with severity, savings projections, and solvency context.
 *
 * Ref: FINANCIAL-METHODOLOGY.md §6, PENDENCIAS-FUTURAS E8b
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getCachedUserId } from "@/lib/supabase/cached-auth";
import { scannerSchema, logSchemaError } from "@/lib/schemas/rpc";

// ─── Types ─────────────────────────────────────────────────

export type ScanSeverity = "info" | "warning" | "critical";

export interface ScanFinding {
  rule_id: string;
  severity: ScanSeverity;
  title: string;
  description: string;
  potential_savings_monthly: number;
  affected_items?: unknown;
}

export interface ScanSummary {
  total_potential_savings_monthly: number;
  projected_3m: number;
  projected_6m: number;
  projected_12m: number;
  critical_count: number;
  warning_count: number;
  info_count: number;
}

export interface ScanResult {
  scan_date: string;
  findings_count: number;
  findings: ScanFinding[];
  summary: ScanSummary;
  solvency: {
    tier1_total: number;
    tier2_total: number;
    tier3_total: number;
    tier4_total: number;
    total_patrimony: number;
    burn_rate: number;
    runway_months: number;
    lcr: number;
    months_analyzed: number;
  } | null;
}

// ─── Empty state ───────────────────────────────────────────

const EMPTY_SCAN: ScanResult = {
  scan_date: "",
  findings_count: 0,
  findings: [],
  summary: {
    total_potential_savings_monthly: 0,
    projected_3m: 0,
    projected_6m: 0,
    projected_12m: 0,
    critical_count: 0,
    warning_count: 0,
    info_count: 0,
  },
  solvency: null,
};

// ─── Hook ──────────────────────────────────────────────────

/**
 * Fetches financial scan results.
 * staleTime: 10 min (scan is expensive and data changes slowly).
 */
export function useScannerScan() {
  return useQuery({
    queryKey: ["scanner", "scan"],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<ScanResult> => {
      const supabase = createClient();
      const userId = await getCachedUserId(supabase);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)(
        "get_financial_scan",
        { p_user_id: userId },
      );
      if (error) throw error;
      const parsed = scannerSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_financial_scan", parsed);
        return EMPTY_SCAN;
      }
      return parsed.data as unknown as ScanResult;
    },
  });
}

// ─── Helpers ───────────────────────────────────────────────

/** Sort findings: critical first, then warning, then info */
export function sortScanFindings(findings: ScanFinding[]): ScanFinding[] {
  const order: Record<ScanSeverity, number> = { critical: 0, warning: 1, info: 2 };
  return [...findings].sort((a, b) => order[a.severity] - order[b.severity]);
}

/** Human-readable rule label */
export function getRuleLabel(ruleId: string): string {
  const labels: Record<string, string> = {
    R03: "Assinaturas",
    R03b: "Peso das assinaturas",
    R06: "Categoria em escalada",
    R07: "Reserva de emergência",
    R08: "Ativo depreciando",
    R09: "Concentração de renda",
    R10: "Fluxo negativo",
    // Frente B (futuro)
    R01: "Retorno abaixo da TMA",
    R02: "Dívida cara",
    R04: "TCO de veículo",
    R05: "Espiral de cartão",
  };
  return labels[ruleId] ?? ruleId;
}
