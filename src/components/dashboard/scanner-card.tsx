"use client";

/**
 * ScannerCard - Motor Financeiro (UX: "Limpeza de Disco" Financeira)
 *
 * Card compacto no dashboard: "Otimizações disponíveis (N) — Economia potencial: R$ X/mês"
 * Expandido: lista de findings com severity, números concretos, projeção.
 *
 * Design: Plum Ledger - severity colors (verdant/burnished/terracotta)
 * Ref: FINANCIAL-METHODOLOGY.md §6.4
 */

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Zap,
  AlertTriangle,
  AlertCircle,
  Info,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";
import {
  useScannerScan,
  sortScanFindings,
  getRuleLabel,
  type ScanFinding,
  type ScanSeverity,
} from "@/lib/hooks/use-scanner";

// ─── Severity Styles ───────────────────────────────────────

const severityConfig: Record<
  ScanSeverity,
  { icon: typeof AlertTriangle; colorClass: string; bgClass: string; label: string }
> = {
  critical: {
    icon: AlertCircle,
    colorClass: "text-terracotta",
    bgClass: "bg-terracotta/10 border-terracotta/20",
    label: "Crítico",
  },
  warning: {
    icon: AlertTriangle,
    colorClass: "text-burnished",
    bgClass: "bg-burnished/10 border-burnished/20",
    label: "Atenção",
  },
  info: {
    icon: Info,
    colorClass: "text-verdant",
    bgClass: "bg-verdant/10 border-verdant/20",
    label: "Informativo",
  },
};

// ─── Finding Row ───────────────────────────────────────────

function FindingRow({ finding }: { finding: ScanFinding }) {
  const [open, setOpen] = useState(false);
  const cfg = severityConfig[finding.severity];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-lg border ${cfg.bgClass} transition-colors`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <Icon className={`h-4 w-4 shrink-0 ${cfg.colorClass}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight">{finding.title}</p>
          <p className="text-xs text-muted-foreground">
            {getRuleLabel(finding.rule_id)}
          </p>
        </div>
        {finding.potential_savings_monthly > 0 && (
          <span className="shrink-0 text-sm font-semibold tabular-nums font-mono text-verdant">
            <Mv>{formatCurrency(finding.potential_savings_monthly)}</Mv>
            <span className="text-xs font-normal text-muted-foreground">/mês</span>
          </span>
        )}
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="border-t border-border/50 px-3 pb-3 pt-2">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {finding.description}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Projection Bar ────────────────────────────────────────

function ProjectionBar({ monthly }: { monthly: number }) {
  if (monthly <= 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2 rounded-lg bg-verdant/5 p-3">
      {[
        { label: "3 meses", value: monthly * 3 },
        { label: "6 meses", value: monthly * 6 },
        { label: "12 meses", value: monthly * 12 },
      ].map((p) => (
        <div key={p.label} className="text-center">
          <p className="text-xs text-muted-foreground">{p.label}</p>
          <p className="text-sm font-semibold tabular-nums font-mono text-verdant">
            <Mv>{formatCurrency(p.value)}</Mv>
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Card ─────────────────────────────────────────────

export function ScannerCard() {
  const { data, isLoading, error } = useScannerScan();
  const [expanded, setExpanded] = useState(false);

  // Don't render if loading or no findings
  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl border bg-card p-4">
        <div className="h-5 w-48 rounded bg-muted" />
        <div className="mt-2 h-4 w-32 rounded bg-muted" />
      </div>
    );
  }

  if (error || !data || data.findings_count === 0) return null;

  const sorted = sortScanFindings(data.findings);
  const hasSavings = data.summary.total_potential_savings_monthly > 0;
  const maxSeverity: ScanSeverity =
    data.summary.critical_count > 0
      ? "critical"
      : data.summary.warning_count > 0
        ? "warning"
        : "info";
  const accentCfg = severityConfig[maxSeverity];

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* Compact header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accentCfg.bgClass}`}
        >
          <Zap className={`h-5 w-5 ${accentCfg.colorClass}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {data.findings_count === 1
              ? "1 otimização disponível"
              : `${data.findings_count} otimizações disponíveis`}
          </p>
          {hasSavings && (
            <p className="text-xs text-muted-foreground">
              Economia potencial:{" "}
              <span className="font-semibold tabular-nums font-mono text-verdant">
                <Mv>{formatCurrency(data.summary.total_potential_savings_monthly)}</Mv>
                /mês
              </span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Severity badge counts */}
          {data.summary.critical_count > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-terracotta/10 px-2 py-0.5 text-xs font-medium text-terracotta">
              {data.summary.critical_count}
            </span>
          )}
          {data.summary.warning_count > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-burnished/10 px-2 py-0.5 text-xs font-medium text-burnished">
              {data.summary.warning_count}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded: findings list + projection */}
      {expanded && (
        <div className="space-y-3 border-t px-4 pb-4 pt-3">
          {/* Projection bar */}
          {hasSavings && (
            <>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Se todas as otimizações forem aplicadas:</span>
              </div>
              <ProjectionBar
                monthly={data.summary.total_potential_savings_monthly}
              />
            </>
          )}

          {/* Findings */}
          <div className="space-y-2">
            {sorted.map((f, i) => (
              <FindingRow key={`${f.rule_id}-${i}`} finding={f} />
            ))}
          </div>

          {/* Footer disclaimer */}
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
            Análise determinística baseada nos seus dados reais. Sem IA, sem
            heurísticas genéricas.
          </p>
        </div>
      )}
    </div>
  );
}
