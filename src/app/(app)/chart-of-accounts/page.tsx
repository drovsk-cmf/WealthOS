"use client";

import { useState } from "react";
import {
  useChartOfAccounts,
  useToggleAccountActive,
  useCreateCOA,
  GROUP_LABELS,
} from "@/lib/hooks/use-chart-of-accounts";
import { useEscapeClose } from "@/lib/hooks/use-dialog-helpers";
import type { COATreeNode } from "@/lib/hooks/use-chart-of-accounts";
import type { Database } from "@/types/database";

type GroupType = Database["public"]["Enums"]["group_type"];

const GROUP_ORDER: GroupType[] = ["asset", "liability", "equity", "revenue", "expense"];

function TreeNode({
  node,
  onToggle,
}: {
  node: COATreeNode;
  onToggle: (id: string, active: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(node.depth < 2);
  const hasChildren = node.children.length > 0;
  const isLeaf = !hasChildren;

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
          node.depth === 0
            ? "mt-4 first:mt-0"
            : "hover:bg-accent/50"
        } ${isLeaf && !node.is_active ? "opacity-50" : ""}`}
        style={{ paddingLeft: `${node.depth * 20 + 8}px` }}
      >
        {/* Expand/collapse */}
        {hasChildren ? (
          <button type="button"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? "Recolher subcategorias" : "Expandir subcategorias"}
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
          <button type="button"
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
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onToggle={onToggle}
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
  const createCOA = useCreateCOA();
  const [showCreate, setShowCreate] = useState(false);
  const [newParentId, setNewParentId] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newAccountName, setNewAccountName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  useEscapeClose(showCreate, () => setShowCreate(false));

  function handleToggle(id: string, active: boolean) {
    toggleActive.mutate({ id, is_active: active });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (!newParentId || !newDisplayName.trim()) {
      setCreateError("Selecione o grupo pai e informe o nome.");
      return;
    }
    try {
      await createCOA.mutateAsync({
        parentId: newParentId,
        displayName: newDisplayName.trim(),
        accountName: newAccountName.trim() || undefined,
      });
      setShowCreate(false);
      setNewParentId("");
      setNewDisplayName("");
      setNewAccountName("");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Erro ao criar conta.");
    }
  }

  const activeCount = data?.flat.filter((a) => a.is_active).length ?? 0;
  const totalCount = data?.flat.length ?? 0;

  // Parent options: all non-leaf nodes (nodes that are groups, subgroups, or categories)
  const parentOptions = data?.flat
    .filter((a) => a.depth <= 2)
    .sort((a, b) => a.internal_code.localeCompare(b.internal_code))
    ?? [];

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
            {activeCount} ativas de {totalCount} contas. Contas individuais são criadas automaticamente ao cadastrar contas bancárias.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            + Nova conta
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 rounded-lg border bg-card px-4 py-3">
        {GROUP_ORDER.map((g) => (
          <span key={g} className={`text-xs font-medium ${GROUP_LABELS[g].color}`}>
            {GROUP_LABELS[g].label}
          </span>
        ))}
        <span className="text-xs text-muted-foreground">
          | Toggle = ativar/desativar · Inativas ficam esmaecidas
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
              />
            ))}
          </div>
        ))}
      </div>

      {/* Info box */}
      <div className="rounded-lg border bg-muted/50 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Como funciona</p>
        <p className="mt-1">
          Ao cadastrar uma conta bancária, cartão, empréstimo ou financiamento, o sistema
          cria automaticamente uma conta individual no plano de contas (ex: &quot;Nubank Corrente&quot;
          sob 1.1.01). Use &quot;+ Nova conta&quot; apenas para contas contábeis especiais que não
          se encaixam nos tipos padrão.
        </p>
      </div>

      {/* Create dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative z-10 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Nova conta contábil</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cria uma subconta sob o grupo selecionado. Para contas bancárias e cartões, use a tela &quot;Contas&quot; (criação automática).
            </p>

            {createError && (
              <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              {/* Parent selector */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Grupo pai</label>
                <select
                  value={newParentId}
                  onChange={(e) => setNewParentId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione</option>
                  {parentOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {"  ".repeat(a.depth)}{a.internal_code} - {a.display_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Display name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome para o usuário</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Ex: Empréstimo pessoal João"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  autoFocus
                />
              </div>

              {/* Account name (technical) */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Nome contábil <span className="font-normal text-muted-foreground">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Ex: Empréstimos Concedidos - PF"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para usar o nome do usuário.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-md border px-4 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createCOA.isPending}
                  className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {createCOA.isPending ? "Criando" : "Criar conta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
