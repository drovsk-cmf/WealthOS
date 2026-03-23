"use client";

import { toast } from "sonner";

/**
 * Oniefy - Divisões (Phase 2 CRUD + Phase 5 Advanced)
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
import { Target as TargetIcon, Archive } from "lucide-react";
import {
  useCostCenters,
  useCreateCostCenter,
  useUpdateCostCenter,
  useDeleteCostCenter,
  useCenterPnl,
  useCenterExport,
  useDistributeOverhead,
  exportToCsv,
  downloadFile,
  CENTER_TYPE_LABELS,
  CENTER_TYPE_OPTIONS,
} from "@/lib/hooks/use-cost-centers";
import { useAutoReset, useEscapeClose } from "@/lib/hooks/use-dialog-helpers";
import { formatCurrency, formatDate, getColorName } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";
import type { Database } from "@/types/database";
import FocusTrap from "focus-trap-react";

type CostCenter = Database["public"]["Tables"]["cost_centers"]["Row"];
type CenterType = Database["public"]["Enums"]["center_type"];

const PRESET_COLORS = [
  "#56688F", "#2F7A68", "#A97824", "#A64A45", "#6F6678",
  "#A7794E", "#7E9487", "#241E29", "#4A7A6E", "#8B6B4A",
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
      `divisao-${centerName.toLowerCase().replace(/\s+/g, "-")}.json`,
      "application/json"
    );
  }

  async function handleExportCsv() {
    const data = await centerExport.mutateAsync(centerId);
    const csv = exportToCsv(data);
    downloadFile(
      csv,
      `divisao-${centerName.toLowerCase().replace(/\s+/g, "-")}.csv`,
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
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="Data inicial"
          className="h-7 rounded border border-input bg-background px-2 text-xs" />
        <span className="text-muted-foreground">a</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="Data final"
          className="h-7 rounded border border-input bg-background px-2 text-xs" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-verdant/10 px-3 py-2">
          <p className="text-[10px] font-medium text-verdant">Receitas</p>
          <p className="text-sm font-bold tabular-nums text-verdant"><Mv>+{formatCurrency(income)}</Mv></p>
        </div>
        <div className="rounded-lg bg-terracotta/10 px-3 py-2">
          <p className="text-[10px] font-medium text-terracotta">Despesas</p>
          <p className="text-sm font-bold tabular-nums text-terracotta"><Mv>-{formatCurrency(expense)}</Mv></p>
        </div>
        <div className={`rounded-lg px-3 py-2 ${net >= 0 ? "bg-info-slate/10" : "bg-burnished/10"}`}>
          <p className={`text-[10px] font-medium ${net >= 0 ? "text-info-slate" : "text-burnished"}`}>Resultado</p>
          <p className={`text-sm font-bold tabular-nums ${net >= 0 ? "text-info-slate" : "text-burnished"}`}>
            {net >= 0 ? "+" : ""}<Mv>{formatCurrency(net)}</Mv>
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
                    <span className="text-verdant">+<Mv>{formatCurrency(Number(m.income))}</Mv></span>
                    <span className="text-terracotta">-<Mv>{formatCurrency(Number(m.expense))}</Mv></span>
                    <span className={`font-medium ${mNet >= 0 ? "text-info-slate" : "text-burnished"}`}>
                      = <Mv>{formatCurrency(mNet)}</Mv>
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
          Nenhum lançamento neste período. Atribua transações a esta divisão ou use o rateio.
        </p>
      )}

      {/* CEN-05: Export buttons */}
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={handleExportCsv} disabled={centerExport.isPending}
          className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent">
          {centerExport.isPending ? "Exportando" : "Exportar CSV"}
        </button>
        <button type="button" onClick={handleExportJson} disabled={centerExport.isPending}
          className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent">
          {centerExport.isPending ? "Exportando" : "Exportar JSON"}
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
  const distributeOverhead = useDistributeOverhead();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CostCenter | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmOverhead, setConfirmOverhead] = useState(false);
  const [expandedCenter, setExpandedCenter] = useState<string | null>(null);

  useAutoReset(confirmDelete, setConfirmDelete);
  useEscapeClose(formOpen, () => { setFormOpen(false); setEditing(null); });

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
      toast.success(isEdit ? "Divisão atualizada." : "Divisão criada com sucesso.");
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  }

  async function handleDelete(id: string) {
    await deleteCenter.mutateAsync(id);
    toast.success("Divisão desativada.");
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
          <h1 className="text-2xl font-bold tracking-tight">Divisões</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Segmentação de transações por projeto, pessoa ou atividade.
            Clique numa divisão para ver o P&L.
          </p>
        </div>
        <div className="flex gap-2">
          {centers && centers.some(c => c.is_overhead) && (
            <button type="button"
              onClick={() => setConfirmOverhead(true)}
              className="rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Ratear overhead
            </button>
          )}
          <button type="button" onClick={handleNew}
            className="rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground">
            + Nova divisão
          </button>
        </div>
      </div>

      {/* Empty state */}
      {centers && centers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <TargetIcon className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Nenhuma divisão</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nenhuma divisão cadastrada.
          </p>
          <button type="button" onClick={handleNew}
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
              <div key={center.id} className="rounded-lg border bg-card shadow-card card-alive overflow-hidden">
                {/* Center row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-accent/50"
                  onClick={() => setExpandedCenter(isExpanded ? null : center.id)}
                >
                  <div className="h-9 w-9 flex-shrink-0 rounded-lg"
                    style={{ backgroundColor: center.color || "#241E29" }} />

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
                    <button type="button" onClick={() => handleEdit(center)}
                      className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" title="Editar" aria-label="Editar">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>

                    {!center.is_default && (
                      <>
                        {confirmDelete === center.id ? (
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => handleDelete(center.id)} disabled={deleteCenter.isPending}
                              className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground">
                              Confirmar
                            </button>
                            <button type="button" onClick={() => setConfirmDelete(null)}
                              className="rounded-md px-2 py-1 text-xs text-muted-foreground">Não</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setConfirmDelete(center.id)}
                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" title="Desativar" aria-label="Desativar">
                            <Archive className="h-4 w-4" />
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
      <div className="rounded-lg bg-card p-4 shadow-card card-alive">
        <h3 className="text-sm font-semibold">Rateio entre divisões</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Para dividir uma transação entre divisões, abra a transação na lista de
          Transações e use a opção &ldquo;Dividir entre divisões&rdquo;. Os percentuais devem somar 100 %.
          O resultado aparece no P&L de cada divisão acima.
        </p>
      </div>

      {/* Form dialog */}
      {formOpen && (
        <FocusTrap focusTrapOptions={{ escapeDeactivates: false }}>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setFormOpen(false); setEditing(null); }} />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-card p-6 shadow-elevated">
            <h2 className="text-lg font-semibold">{isEdit ? "Editar divisão" : "Nova divisão"}</h2>

            {error && (
              <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="cc-name" className="text-sm font-medium">Nome</label>
                <input id="cc-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Casa, Trabalho, Reforma" autoFocus aria-required="true"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>

              <div className="space-y-1.5">
                <label id="center-type-label" className="text-sm font-medium">Tipo</label>
                <div role="radiogroup" aria-labelledby="center-type-label" className="space-y-2">
                  {CENTER_TYPE_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" role="radio" aria-checked={type === opt.value}
                      onClick={() => setType(opt.value)}
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
                      aria-label={getColorName(c)}
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
                  className="flex-1 rounded-md btn-cta px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
                  {loading ? "Salvando" : isEdit ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
        </FocusTrap>
      )}

      {/* CEN-03: Overhead distribution confirmation */}
      {confirmOverhead && (
        <FocusTrap focusTrapOptions={{ escapeDeactivates: false }}>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmOverhead(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-lg bg-card p-6 shadow-elevated">
            <h3 className="text-lg font-semibold">Ratear Overhead</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Distribui as despesas das divisões marcadas como overhead para as demais divisões,
              proporcionalmente ao volume de despesas de cada um no mês atual.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Lançamentos já rateados não serão duplicados.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button"
                onClick={() => setConfirmOverhead(false)}
                className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
                Cancelar
              </button>
              <button type="button"
                onClick={async () => {
                  try {
                    const currentMonth = new Date().toISOString().split("T")[0].slice(0, 8) + "01";
                    const result = await distributeOverhead.mutateAsync(currentMonth);
                    if (result.status === "no_target") {
                      toast.error(result.message ?? "Nenhuma divisão destino com despesas.");
                    } else {
                      toast.success(`Rateio concluído: ${result.allocated} lançamento(s) distribuído(s).`);
                    }
                    setConfirmOverhead(false);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Erro ao ratear.");
                  }
                }}
                disabled={distributeOverhead.isPending}
                className="rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {distributeOverhead.isPending ? "Rateando" : "Ratear mês atual"}
              </button>
            </div>
          </div>
        </div>
        </FocusTrap>
      )}
    </div>
  );
}
