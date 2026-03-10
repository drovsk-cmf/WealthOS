"use client";

/**
 * Oniefy - Patrimônio (Phase 4)
 *
 * PAT-01: Cadastrar bem patrimonial
 * PAT-02: Editar bem patrimonial
 * PAT-03: Excluir bem patrimonial
 * PAT-04: Listar bens + totalização por categoria
 * PAT-05: Calcular depreciação (botão manual por asset)
 * PAT-06: Alertas de seguro vencendo (banner)
 * PAT-07: Histórico de valor (expandable panel)
 */

import { useState } from "react";
import {
  useAssets,
  useAssetsSummary,
  useAssetValueHistory,
  useDeleteAsset,
  useDepreciateAsset,
  ASSET_CATEGORY_LABELS,
  ASSET_CATEGORY_COLORS,
} from "@/lib/hooks/use-assets";
import { AssetForm } from "@/components/assets/asset-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Database } from "@/types/database";

type AssetCategory = Database["public"]["Enums"]["asset_category"];

interface EditData {
  id: string;
  name: string;
  category: AssetCategory;
  acquisition_date: string;
  acquisition_value: number;
  current_value: number;
  depreciation_rate: number;
  insurance_policy: string | null;
  insurance_expiry: string | null;
}

function ValueHistory({ assetId }: { assetId: string }) {
  const { data: history, isLoading } = useAssetValueHistory(assetId);

  if (isLoading) return <div className="h-12 animate-pulse rounded bg-muted" />;
  if (!history || history.length === 0) return <p className="text-xs text-muted-foreground">Sem histórico de alterações</p>;

  return (
    <div className="space-y-1">
      {history.slice(0, 10).map((h) => (
        <div key={h.id} className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${
              h.change_source === "depreciation" ? "bg-burnished/100" : "bg-info-slate/100"
            }`} />
            <span className="text-muted-foreground">
              {formatDate(h.created_at)}
            </span>
            <span>{h.change_reason || h.change_source}</span>
          </div>
          <div className="flex items-center gap-2 tabular-nums">
            <span className="text-muted-foreground">{formatCurrency(Number(h.previous_value))}</span>
            <span>→</span>
            <span className="font-medium">{formatCurrency(Number(h.new_value))}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AssetsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<EditData | null>(null);
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [depreciationResult, setDepreciationResult] = useState<string | null>(null);

  const { data: assets, isLoading } = useAssets();
  const { data: summary } = useAssetsSummary();
  const deleteAsset = useDeleteAsset();
  const depreciateAsset = useDepreciateAsset();

  function handleNew() { setEditData(null); setFormOpen(true); }

  function handleEdit(asset: NonNullable<typeof assets>[number]) {
    setEditData({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      acquisition_date: asset.acquisition_date,
      acquisition_value: Number(asset.acquisition_value),
      current_value: Number(asset.current_value),
      depreciation_rate: Number(asset.depreciation_rate),
      insurance_policy: asset.insurance_policy,
      insurance_expiry: asset.insurance_expiry,
    });
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    await deleteAsset.mutateAsync(id);
    setConfirmDelete(null);
  }

  async function handleDepreciate(assetId: string) {
    const result = await depreciateAsset.mutateAsync(assetId);
    if (result.status === "depreciated") {
      setDepreciationResult(`Depreciação aplicada: ${formatCurrency(result.depreciation)} (novo valor: ${formatCurrency(result.new_value)})`);
      setTimeout(() => setDepreciationResult(null), 4000);
    } else {
      setDepreciationResult("Depreciação ignorada (taxa zero).");
      setTimeout(() => setDepreciationResult(null), 3000);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const expiringInsurance = summary?.expiring_insurance ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patrimônio</h1>
          <p className="text-sm text-muted-foreground">
            Bens, investimentos e ativos
          </p>
        </div>
        <button onClick={handleNew}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          + Novo bem
        </button>
      </div>

      {/* PAT-06: Insurance alerts */}
      {expiringInsurance.length > 0 && (
        <div className="rounded-lg border border-burnished/20 bg-burnished/10 p-4">
          <p className="text-sm font-semibold text-burnished">Seguros vencendo nos próximos 30 dias</p>
          <div className="mt-2 space-y-1">
            {expiringInsurance.map((ins) => (
              <p key={ins.id} className="text-xs text-burnished">
                <strong>{ins.name}</strong> - vence em {formatDate(ins.insurance_expiry)}
                ({ins.days_until_expiry <= 0 ? "VENCIDO" : `${ins.days_until_expiry} dias`})
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Depreciation result toast */}
      {depreciationResult && (
        <div className="rounded-lg border border-info-slate/20 bg-info-slate/10 px-4 py-3 text-sm text-info-slate">
          {depreciationResult}
        </div>
      )}

      {/* PAT-04: Summary cards */}
      {summary && summary.asset_count > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Valor Atual Total</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{formatCurrency(summary.total_value)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Valor de Aquisição</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{formatCurrency(summary.total_acquisition)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Depreciação Acumulada</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-burnished">
              {formatCurrency(summary.total_depreciation)}
            </p>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {summary?.by_category && summary.by_category.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {summary.by_category.map((cat) => (
            <div key={cat.category} className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ASSET_CATEGORY_COLORS[cat.category as AssetCategory] }} />
              <span className="font-medium">{ASSET_CATEGORY_LABELS[cat.category as AssetCategory]}</span>
              <span className="text-muted-foreground">({cat.count})</span>
              <span className="tabular-nums">{formatCurrency(cat.total_value)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {(!assets || assets.length === 0) && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          
          <h2 className="mt-2 text-lg font-semibold">Nenhum bem cadastrado</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Nenhum bem cadastrado. Bens registrados aparecem com visão consolidada e depreciação.
          </p>
          <button onClick={handleNew}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Cadastrar bem
          </button>
        </div>
      )}

      {/* Asset list */}
      {assets && assets.length > 0 && (
        <div className="space-y-2">
          {assets.map((asset) => {
            const depPct = Number(asset.acquisition_value) > 0
              ? ((Number(asset.acquisition_value) - Number(asset.current_value)) / Number(asset.acquisition_value) * 100)
              : 0;
            const isExpanded = expandedAsset === asset.id;
            const color = ASSET_CATEGORY_COLORS[asset.category];

            return (
              <div key={asset.id} className="rounded-lg border bg-card shadow-sm transition-colors hover:bg-accent/30">
                <div className="flex items-start gap-3 p-4">
                  {/* Category color */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: color }}>
                    {asset.name.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{asset.name}</p>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: color + "20", color }}>
                        {ASSET_CATEGORY_LABELS[asset.category]}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Aquisição: {formatDate(asset.acquisition_date)}</span>
                      {Number(asset.depreciation_rate) > 0 && (
                        <span className="text-burnished">Depr: {Number(asset.depreciation_rate)} %/ano</span>
                      )}
                      {asset.insurance_expiry && (
                        <span>Seguro: {formatDate(asset.insurance_expiry)}</span>
                      )}
                    </div>
                  </div>

                  {/* Values */}
                  <div className="text-right">
                    <p className="text-lg font-bold tabular-nums">{formatCurrency(Number(asset.current_value))}</p>
                    {depPct > 0 && (
                      <p className="text-xs text-burnished tabular-nums">
                        -{depPct.toFixed(1)} % desde aquisição
                      </p>
                    )}
                  </div>
                </div>

                {/* Action bar */}
                <div className="flex items-center gap-1 border-t px-4 py-2">
                  {/* PAT-07: Toggle history */}
                  <button onClick={() => setExpandedAsset(isExpanded ? null : asset.id)}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                    {isExpanded ? "Fechar" : "Histórico"}
                  </button>

                  {/* PAT-05: Depreciate */}
                  {Number(asset.depreciation_rate) > 0 && (
                    <button onClick={() => handleDepreciate(asset.id)} disabled={depreciateAsset.isPending}
                      className="rounded-md px-2 py-1 text-xs text-burnished transition-colors hover:bg-burnished/10">
                      Depreciar
                    </button>
                  )}

                  {/* PAT-02: Edit */}
                  <button onClick={() => handleEdit(asset)}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                    Editar
                  </button>

                  {/* PAT-03: Delete */}
                  <div className="flex-1" />
                  {confirmDelete === asset.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(asset.id)} disabled={deleteAsset.isPending}
                        className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground">
                        Confirmar
                      </button>
                      <button onClick={() => setConfirmDelete(null)}
                        className="rounded-md px-2 py-1 text-xs text-muted-foreground">Não</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(asset.id)}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-destructive">
                      Excluir
                    </button>
                  )}
                </div>

                {/* PAT-07: Value history (expanded) */}
                {isExpanded && (
                  <div className="border-t px-4 py-3">
                    <ValueHistory assetId={asset.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form dialog */}
      <AssetForm open={formOpen} onClose={() => { setFormOpen(false); setEditData(null); }} editData={editData} />
    </div>
  );
}
