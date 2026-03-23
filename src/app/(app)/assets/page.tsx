"use client";

import { toast } from "sonner";

/**
 * Oniefy - Patrimônio (Phase 4)
 *
 * PAT-01: Cadastrar bem patrimonial
 * PAT-02: Editar bem patrimonial
 * PAT-03: Excluir bem patrimonial
 * PAT-04: Listar bens + totalização por categoria
 * PAT-05: Calcular depreciação (botão manual por asset)
 * PAT-06: Anexar documentos a bens (upload to Supabase Storage)
 * PAT-07: Alertas de seguro vencendo (banner)
 * PAT-07b: Histórico de valor (expandable panel)
 */

import { useState } from "react";
import { Package, Paperclip, Trash2 } from "lucide-react";
import {
  useAssets,
  useAssetsSummary,
  useAssetValueHistory,
  useDeleteAsset,
  useDepreciateAsset,
  ASSET_CATEGORY_LABELS,
  ASSET_CATEGORY_COLORS,
} from "@/lib/hooks/use-assets";
import { useDocuments, useUploadDocument, useDeleteDocument } from "@/lib/hooks/use-documents";
import { useAutoReset } from "@/lib/hooks/use-dialog-helpers";
import { AssetForm } from "@/components/assets/asset-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";
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
  currency?: string;
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
            <span className="text-muted-foreground"><Mv>{formatCurrency(Number(h.previous_value))}</Mv></span>
            <span>→</span>
            <span className="font-medium"><Mv>{formatCurrency(Number(h.new_value))}</Mv></span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** PAT-06: Documents attached to an asset */
function AssetDocuments({ assetId }: { assetId: string }) {
  const { data: docs, isLoading } = useDocuments("assets", assetId);
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadDoc.mutate(
      { file, relatedTable: "assets", relatedId: assetId },
      {
        onSuccess: () => toast.success(`"${file.name}" anexado.`),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Erro no upload."),
      }
    );
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Documentos
        </p>
        <label className="cursor-pointer rounded-md border px-2 py-1 text-xs font-medium transition-colors hover:bg-accent">
          <Paperclip className="mr-1 inline h-3 w-3" />
          Anexar
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,.xlsx,.csv"
            className="hidden"
            disabled={uploadDoc.isPending}
            onChange={handleFileChange}
          />
        </label>
      </div>

      {isLoading && <div className="h-6 w-32 animate-pulse rounded bg-muted" />}

      {docs && docs.length > 0 ? (
        <div className="space-y-1">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded border bg-muted/30 px-3 py-1.5">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{doc.file_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {(doc.size_bytes / 1024).toFixed(0)} KB · {formatDate(doc.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => deleteDoc.mutate({ id: doc.id, file_path: doc.file_path })}
                disabled={deleteDoc.isPending}
                className="ml-2 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                title="Remover"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        !isLoading && (
          <p className="text-xs text-muted-foreground">Nenhum documento anexado.</p>
        )
      )}
    </div>
  );
}

export default function AssetsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<EditData | null>(null);
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [depreciationResult, setDepreciationResult] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useAutoReset(confirmDelete, setConfirmDelete);

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
      currency: asset.currency ?? "BRL",
    });
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    await deleteAsset.mutateAsync(id);
    toast.success("Bem removido.");
    setConfirmDelete(null);
  }

  async function handleDepreciate(assetId: string) {
    const result = await depreciateAsset.mutateAsync(assetId);
    if (result.status === "depreciated") {
      setDepreciationResult(`Depreciação aplicada: $<Mv>{formatCurrency(result.depreciation)}</Mv> (novo valor: $<Mv>{formatCurrency(result.new_value)}</Mv>)`);
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
        <button type="button" onClick={handleNew}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          + Novo bem
        </button>
      </div>

      {/* Search */}
      {assets && assets.length > 3 && (
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome" aria-label="Buscar bens"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      )}

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
            <p className="mt-1 text-xl font-bold tabular-nums"><Mv>{formatCurrency(summary.total_value)}</Mv></p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Valor de Aquisição</p>
            <p className="mt-1 text-xl font-bold tabular-nums"><Mv>{formatCurrency(summary.total_acquisition)}</Mv></p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Depreciação Acumulada</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-burnished">
              <Mv>{formatCurrency(summary.total_depreciation)}</Mv>
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
              <span className="tabular-nums"><Mv>{formatCurrency(cat.total_value)}</Mv></span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state (UX-H1-03) */}
      {(!assets || assets.length === 0) && (
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Package className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">Registre seus bens e investimentos</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Cadastre o que você tem (imóveis, veículos, investimentos) e o que deve (financiamentos) para ver seu patrimônio líquido consolidado. Leva cerca de 5 minutos.
            </p>
            <button type="button" onClick={handleNew}
              className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              + Cadastrar bem
            </button>
          </div>

          {/* Nudge: por que acompanhar o patrimônio? */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-5 py-4">
            <p className="text-sm font-medium text-primary">Por que vale a pena registrar seu patrimônio?</p>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li className="flex gap-2">
                <span className="mt-0.5 text-primary flex-shrink-0">•</span>
                <span><strong className="text-foreground">Patrimônio líquido em tempo real.</strong> Veja a diferença entre o que você tem e o que deve — o número que realmente importa para a liberdade financeira.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-primary flex-shrink-0">•</span>
                <span><strong className="text-foreground">Evolução ao longo do tempo.</strong> O Oniefy tira snapshots mensais automáticos. Em 12 meses você vê exatamente quanto seu patrimônio cresceu.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-primary flex-shrink-0">•</span>
                <span><strong className="text-foreground">Solvência e runway.</strong> Com ativos e passivos registrados, o painel calcula automaticamente quantos meses você sobrevive sem renda — e se está em zona segura.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Asset list (P7b: hierarchical grouping) */}
      {assets && assets.length > 0 && (() => {
        const filtered = assets.filter((a) => !search || a.name.toLowerCase().includes(search.toLowerCase()));
        // Separate root assets (no parent) and children
        const roots = filtered.filter((a) => !(a as Record<string, unknown>).parent_asset_id);
        const childrenMap = new Map<string, typeof filtered>();
        for (const a of filtered) {
          const pid = (a as Record<string, unknown>).parent_asset_id as string | null;
          if (pid) {
            if (!childrenMap.has(pid)) childrenMap.set(pid, []);
            childrenMap.get(pid)!.push(a);
          }
        }
        // Orphan children whose parent is filtered out
        const orphans = filtered.filter((a) => {
          const pid = (a as Record<string, unknown>).parent_asset_id as string | null;
          return pid && !roots.some((r) => r.id === pid);
        });

        const renderAsset = (asset: typeof assets[0], isChild: boolean) => {
          const depPct = Number(asset.acquisition_value) > 0
            ? ((Number(asset.acquisition_value) - Number(asset.current_value)) / Number(asset.acquisition_value) * 100)
            : 0;
          const isExpanded = expandedAsset === asset.id;
          const color = ASSET_CATEGORY_COLORS[asset.category];
          const children = childrenMap.get(asset.id) ?? [];
          const consolidatedValue = Number(asset.current_value) + children.reduce((s, c) => s + Number(c.current_value), 0);

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
                    <p className="text-lg font-bold tabular-nums"><Mv>{formatCurrency(Number(asset.current_value))}</Mv></p>
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
                  <button type="button" onClick={() => setExpandedAsset(isExpanded ? null : asset.id)}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                    {isExpanded ? "Fechar" : "Histórico"}
                  </button>

                  {/* PAT-05: Depreciate */}
                  {Number(asset.depreciation_rate) > 0 && (
                    <button type="button" onClick={() => handleDepreciate(asset.id)} disabled={depreciateAsset.isPending}
                      className="rounded-md px-2 py-1 text-xs text-burnished transition-colors hover:bg-burnished/10">
                      Depreciar
                    </button>
                  )}

                  {/* PAT-02: Edit */}
                  <button type="button" onClick={() => handleEdit(asset)}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                    Editar
                  </button>

                  {/* PAT-03: Delete */}
                  <div className="flex-1" />
                  {confirmDelete === asset.id ? (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => handleDelete(asset.id)} disabled={deleteAsset.isPending}
                        className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground">
                        Confirmar
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(null)}
                        className="rounded-md px-2 py-1 text-xs text-muted-foreground">Não</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setConfirmDelete(asset.id)}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-destructive">
                      Excluir
                    </button>
                  )}
                </div>

                {/* PAT-07: Value history + PAT-06: Documents (expanded) */}
                {isExpanded && (
                  <div className="border-t px-4 py-3 space-y-4">
                    <ValueHistory assetId={asset.id} />
                    <AssetDocuments assetId={asset.id} />
                  </div>
                )}

                {/* P7b: Consolidated value for parents */}
                {!isChild && children.length > 0 && (
                  <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                    Valor consolidado (com {children.length} acessório{children.length > 1 ? "s" : ""}): {formatCurrency(consolidatedValue)}
                  </div>
                )}
              </div>
            );
          };

          return (
            <div className="space-y-2">
              {roots.map((asset) => (
                <div key={asset.id}>
                  {renderAsset(asset, false)}
                  {/* P7b: Render children indented */}
                  {(childrenMap.get(asset.id) ?? []).map((child) => (
                    <div key={child.id} className="ml-8 mt-1">
                      {renderAsset(child, true)}
                    </div>
                  ))}
                </div>
              ))}
              {/* Orphan children (parent filtered out by search) */}
              {orphans.map((asset) => (
                <div key={asset.id} className="ml-8">
                  {renderAsset(asset, true)}
                </div>
              ))}
            </div>
          );
        })()}

      {/* Form dialog */}
      <AssetForm open={formOpen} onClose={() => { setFormOpen(false); setEditData(null); }} editData={editData} />
    </div>
  );
}
