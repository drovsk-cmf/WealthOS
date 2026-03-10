"use client";

/**
 * Oniefy - Centros de Custo (Phase 2 CRUD + Phase 5 Advanced)
 *
 * CEN-01: Criar centros (from Phase 2, maintained)
 * CEN-02: Atribuir lançamentos (from Phase 2, via transaction form)
 * CEN-03: Rateio percentual (allocate_to_centers RPC)
 * CEN-04: P&L por centro (get_center_pnl RPC + chart)
 * CEN-05: Exportar centro (get_center_export RPC + CSV/JSON download)
 *
 * Layout: center list + expandable P&L panel per center.
 */

import { useState, useEffect } from "react";
import {
  useCostCenters,
  useCreateCostCenter,
  useUpdateCostCenter,
  useDeleteCostCenter,
  useCenterPnl,
  useCenterExport,
  exportToCsv,
  downloadFile,
  CENTER_TYPE_LABELS,
  CENTER_TYPE_OPTIONS,
} from "@/lib/hooks/use-cost-centers";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Database } from "@/types/database";

type CostCenter = Database["public"]["Tables"]["cost_centers"]["Row"];
type CenterType = Database["public"]["Enums"]["center_type"];

const PRESET_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

// ─── P&L Panel Component (CEN-04) ──────────────────────────────

function PnlPanel({ centerId, centerName }: { centerId: string; centerName: string }) {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });

  const { data: pnl, isLoading } = useCenterPnl(centerId, dateFrom, dateTo);
  const centerExport = useCenterExport();

  async function handleExportJson() {
    const data = await centerExport.mutateAsync(centerId);
    downloadFile(
      JSON.stringify(data, null, 2),
      `centro-${centerName.toLowerCase().replace(/\s+/g, "-")}.json`,
      "application/json"
    );
  }

  async function handleExportCsv() {
    const data = await centerExport.mutateAsync(centerId);
    const csv = exportToCsv(data);
    downloadFile(
      csv,
      `centro-${centerName.toLowerCase().replace(/\s+/g, "-")}.csv`,
      "text/csv"
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-20 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const income = pnl?.total_income ?? 0;
  const expense = pnl?.total_expense ?? 0;
  const net = pnl?.net_result ?? 0;
  const monthly = pnl?.monthly ?? [];

  return (
    <div className="border-t p-4 space-y-4">
      {/* Period selector */}
      <div className="flex items-center gap-3 text-xs">
        <span className="text-muted-foreground">Período:</span>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="h-7 rounded border border-input bg-background px-2 text-xs" />
        <span className="text-muted-foreground">a</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="h-7 rounded border border-input bg-background px-2 text-xs" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-green-50 px-3 py-2">
          <p className="text-[10px] font-medium text-green-700">Receitas</p>
          <p className="text-sm font-bold tabular-nums text-green-600">{formatCurrency(income)}</p>
        </div>
        <div className="rounded-lg bg-red-50 px-3 py-2">
          <p className="text-[10px] font-medium text-red-700">Despesas</p>
          <p className="text-sm font-bold tabular-nums text-red-500">{formatCurrency(expense)}</p>
        </div>
        <div className={`rounded-lg px-3 py-2 ${net >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
          <p className={`text-[10px] font-medium ${net >= 0 ? "text-blue-700" : "text-orange-700"}`}>Resultado</p>
          <p className={`text-sm font-bold tabular-nums ${net >= 0 ? "text-blue-600" : "text-orange-600"}`}>
            {net >= 0 ? "+" : ""}{formatCurrency(net)}
          </p>
        </div>
      </div>

      {/* Monthly breakdown */}
      {monthly.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Evolução mensal</p>
          <div className="space-y-1">
            {monthly.map((m) => {
              const mNet = Number(m.income) - Number(m.expense);
              return (
                <div key={m.month} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{formatDate(m.month, "MMM yyyy")}</span>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="text-green-600">+{formatCurrency(Number(m.income))}</span>
                    <span className="text-red-500">-{formatCurrency(Number(m.expense))}</span>
                    <span className={`font-medium ${mNet >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                      = {formatCurrency(mNet)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {income === 0 && expense === 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Nenhum lançamento neste período. Atribua transações a este centro ou use o rateio.
        </p>
      )}

      {/* CEN-05: Export buttons */}
      <div className="flex gap-2 pt-2">
        <button onClick={handleExportCsv} disabled={centerExport.isPending}
          className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent">
          {centerExport.isPending ? "..." : "Exportar CSV"}
        </button>
        <button onClick={handleExportJson} disabled={centerExport.isPending}
          className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent">
          {centerExport.isPending ? "..." : "Exportar JSON"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function CostCentersPage() {
  const { data: centers, isLoading } = useCostCenters();
  const createCenter = useCreateCostCenter();
  const updateCenter = useUpdateCostCenter();
  const deleteCenter = useDeleteCostCenter();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CostCenter | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedCenter, setExpandedCenter] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<CenterType>("cost_center");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!editing;
  const loading = createCenter.isPending || updateCenter.isPending;

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setType(editing.type);
      setColor(editing.color || PRESET_COLORS[0]);
    } else {
      setName("");
      setType("cost_center");
      setColor(PRESET_COLORS[0]);
    }
    setError(null);
  }, [editing, formOpen]);

  function handleNew() { setEditing(null); setFormOpen(true); }
  function handleEdit(center: CostCenter) { setEditing(center); setFormOpen(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Nome é obrigatório."); return; }

    try {
      if (isEdit && editing) {
        await updateCenter.mutateAsync({ id: editing.id, name: name.trim(), type, color });
      } else {
        await createCenter.mutateAsync({ name: name.trim(), type, color });
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  }

  async function handleDelete(id: string) {
    await deleteCenter.mutateAsync(id);
    setConfirmDelete(null);
    if (expandedCenter === id) setExpandedCenter(null);
  }

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
          <h1 className="text-2xl font-bold tracking-tight">Centros de Custo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize suas transações por projeto, pessoa ou atividade.
            Clique num centro para ver o P&L.
          </p>
        </div>
        <button onClick={handleNew}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          + Novo centro
        </button>
      </div>

      {/* Empty state */}
      {centers && centers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-12 text-center">
          <p className="text-3xl">🎯</p>
          <h2 className="mt-2 text-lg font-semibold">Nenhum centro de custo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie centros para rastrear gastos por pessoa, projeto ou atividade.
          </p>
          <button onClick={handleNew}
            className="mt-3 text-sm font-medium text-primary hover:underline">
            Criar primeiro
          </button>
        </div>
      )}

      {/* Center list with expandable P&L (CEN-04) */}
      {centers && centers.length > 0 && (
        <div className="space-y-2">
          {centers.map((center) => {
            const isExpanded = expandedCenter === center.id;
            return (
              <div key={center.id} className="rounded-lg border bg-card shadow-sm overflow-hidden">
                {/* Center row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-accent/50"
                  onClick={() => setExpandedCenter(isExpanded ? null : center.id)}
                >
                  <div className="h-9 w-9 flex-shrink-0 rounded-lg"
                    style={{ backgroundColor: center.color || "#6366F1" }} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{center.name}</p>
                      {center.is_default && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Padrão
                        </span>
                      )}
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {CENTER_TYPE_LABELS[center.type]}
                      </span>
                    </div>
                  </div>

                  {/* Actions (stop propagation to not toggle P&L) */}
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleEdit(center)}
                      className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" title="Editar">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>

                    {!center.is_default && (
                      <>
                        {confirmDelete === center.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(center.id)} disabled={deleteCenter.isPending}
                              className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground">
                              Confirmar
                            </button>
                            <button onClick={() => setConfirmDelete(null)}
                              className="rounded-md px-2 py-1 text-xs text-muted-foreground">Não</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(center.id)}
                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" title="Desativar">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Expand indicator */}
                  <svg className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* CEN-04: P&L panel (expanded) */}
                {isExpanded && (
                  <PnlPanel centerId={center.id} centerName={center.name} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rateio info */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Rateio entre centros</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Para dividir uma transação entre centros, abra a transação na lista de
          Transações e use a opção &ldquo;Dividir entre centros&rdquo;. Os percentuais devem somar 100 %.
          O resultado aparece no P&L de cada centro acima.
        </p>
      </div>

      {/* Form dialog */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setFormOpen(false); setEditing(null); }} />
          <div className="relative z-10 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold">{isEdit ? "Editar centro" : "Novo centro"}</h2>

            {error && (
              <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="cc-name" className="text-sm font-medium">Nome</label>
                <input id="cc-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Casa, Trabalho, Reforma" autoFocus
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tipo</label>
                <div className="space-y-2">
                  {CENTER_TYPE_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setType(opt.value)}
                      className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                        type === opt.value ? "border-primary bg-primary/5" : "border-input hover:bg-accent"
                      }`}>
                      <span className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${
                        type === opt.value ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}>
                        {type === opt.value && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Cor</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${
                        color === c ? "scale-110 border-foreground" : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setFormOpen(false); setEditing(null); }}
                  className="flex-1 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
                  {loading ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
