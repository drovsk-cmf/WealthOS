"use client";

import { useState } from "react";
import {
  useChartOfAccounts,
  useToggleAccountActive,
  GROUP_LABELS,
} from "@/lib/hooks/use-chart-of-accounts";
import type { COATreeNode } from "@/lib/hooks/use-chart-of-accounts";
import type { Database } from "@/types/database";

type GroupType = Database["public"]["Enums"]["group_type"];

const GROUP_ORDER: GroupType[] = ["asset", "liability", "equity", "revenue", "expense"];

function TreeNode({
  node,
  onToggle,
  showInactive,
}: {
  node: COATreeNode;
  onToggle: (id: string, active: boolean) => void;
  showInactive: boolean;
}) {
  const [expanded, setExpanded] = useState(node.depth < 2);
  const hasChildren = node.children.length > 0;
  const isLeaf = node.depth === 2;

  const visibleChildren = showInactive
    ? node.children
    : node.children.filter((c) => c.is_active || c.children.length > 0);

  if (!showInactive && !node.is_active && isLeaf) return null;

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
          node.depth === 0
            ? "mt-4 first:mt-0"
            : "hover:bg-accent/50"
        }`}
        style={{ paddingLeft: `${node.depth * 20 + 8}px` }}
      >
        {/* Expand/collapse */}
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent"
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Code */}
        <span className="flex-shrink-0 font-mono text-xs text-muted-foreground w-14">
          {node.internal_code}
        </span>

        {/* Display name */}
        <span
          className={`flex-1 text-sm ${
            node.depth === 0
              ? `font-semibold ${GROUP_LABELS[node.group_type]?.color ?? ""}`
              : node.depth === 1
                ? "font-medium"
                : node.is_active
                  ? ""
                  : "text-muted-foreground"
          }`}
        >
          {node.display_name}
        </span>

        {/* Technical name (hover tooltip via title) */}
        {node.depth >= 1 && (
          <span className="hidden text-xs text-muted-foreground sm:block" title={node.account_name}>
            {node.account_name.length > 30
              ? node.account_name.slice(0, 27) + "..."
              : node.account_name}
          </span>
        )}

        {/* Tax treatment badge */}
        {node.tax_treatment && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {node.tax_treatment === "dedutivel_integral"
              ? "Dedutível"
              : node.tax_treatment === "dedutivel_limitado"
                ? "Ded. limitado"
                : node.tax_treatment === "tributavel"
                  ? "Tributável"
                  : node.tax_treatment === "isento"
                    ? "Isento"
                    : node.tax_treatment === "exclusivo_fonte"
                      ? "Excl. fonte"
                      : node.tax_treatment === "ganho_capital"
                        ? "Ganho capital"
                        : ""}
          </span>
        )}

        {/* Active toggle (only for leaves, non-system allowed) */}
        {isLeaf && (
          <button
            onClick={() => onToggle(node.id, !node.is_active)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              node.is_active ? "bg-primary" : "bg-muted"
            }`}
            title={node.is_active ? "Desativar conta" : "Ativar conta"}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                node.is_active ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        )}
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {visibleChildren.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onToggle={onToggle}
              showInactive={showInactive}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChartOfAccountsPage() {
  const { data, isLoading } = useChartOfAccounts();
  const toggleActive = useToggleAccountActive();
  const [showInactive, setShowInactive] = useState(false);

  function handleToggle(id: string, active: boolean) {
    toggleActive.mutate({ id, is_active: active });
  }

  const activeCount = data?.flat.filter((a) => a.is_active).length ?? 0;
  const totalCount = data?.flat.length ?? 0;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded bg-muted" style={{ marginLeft: `${(i % 3) * 20}px` }} />
        ))}
      </div>
    );
  }

  // Group tree by group_type
  const groupedTree = GROUP_ORDER.map((group) => ({
    group,
    ...GROUP_LABELS[group],
    nodes: data?.tree.filter((n) => n.group_type === group) ?? [],
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plano de Contas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCount} ativas de {totalCount} contas. Contas ativam automaticamente ao serem usadas.
          </p>
        </div>
        <button
          onClick={() => setShowInactive(!showInactive)}
          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
            showInactive
              ? "border-primary bg-primary/5 text-primary"
              : "border-input hover:bg-accent"
          }`}
        >
          {showInactive ? "Ocultar inativas" : "Mostrar inativas"}
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 rounded-lg border bg-card px-4 py-3">
        {GROUP_ORDER.map((g) => (
          <span key={g} className={`text-xs font-medium ${GROUP_LABELS[g].color}`}>
            {GROUP_LABELS[g].label}
          </span>
        ))}
        <span className="text-xs text-muted-foreground">
          | Toggle = ativar/desativar conta folha
        </span>
      </div>

      {/* Tree */}
      <div className="rounded-lg border bg-card py-2">
        {groupedTree.map(({ group, nodes }) => (
          <div key={group}>
            {nodes.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                onToggle={handleToggle}
                showInactive={showInactive}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Info box */}
      <div className="rounded-lg border bg-muted/50 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Como funciona</p>
        <p className="mt-1">
          O plano de contas é a espinha dorsal do sistema contábil. Cada transação gera
          automaticamente lançamentos de débito e crédito nas contas corretas. Contas
          folha (nível 3) são ativadas sob demanda quando usadas pela primeira vez.
          Grupos e subgrupos (níveis 0-1) estão sempre ativos e não podem ser desativados.
        </p>
      </div>
    </div>
  );
}
