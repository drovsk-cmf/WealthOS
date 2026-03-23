"use client";

/**
 * AssetForm - PAT-01 (cadastrar), PAT-02 (editar bem)
 *
 * Dialog for creating/editing an asset.
 * Fields: name, category, acquisition_date, acquisition_value, current_value,
 *         depreciation_rate, insurance_policy, insurance_expiry.
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import {
  useAssets,
  useCreateAsset,
  useUpdateAsset,
  ASSET_CATEGORY_OPTIONS,
} from "@/lib/hooks/use-assets";
import { useAssetTemplates, searchTemplates } from "@/lib/hooks/use-asset-templates";
import { useSupportedCurrencies, groupCurrenciesByTier } from "@/lib/hooks/use-currencies";
import type { Database } from "@/types/database";
import FocusTrap from "focus-trap-react";

type AssetCategory = Database["public"]["Enums"]["asset_category"];

interface AssetFormProps {
  open: boolean;
  onClose: () => void;
  /** Pre-set parent for "add child" flow */
  defaultParentId?: string | null;
  editData?: {
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
    parent_asset_id?: string | null;
  } | null;
}

export function AssetForm({ open, onClose, editData, defaultParentId }: AssetFormProps) {
  const isEditing = !!editData;

  const [name, setName] = useState("");
  const [category, setCategory] = useState<AssetCategory>("other");
  const [acquisitionDate, setAcquisitionDate] = useState("");
  const [acquisitionValue, setAcquisitionValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [depreciationRate, setDepreciationRate] = useState("0");
  const [insurancePolicy, setInsurancePolicy] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [currency, setCurrency] = useState("BRL");
  const [parentAssetId, setParentAssetId] = useState<string>("");
  const [error, setError] = useState("");

  const { data: assets } = useAssets();
  const { data: templates } = useAssetTemplates();
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: supportedCurrencies } = useSupportedCurrencies();
  const currencyGroups = supportedCurrencies ? groupCurrenciesByTier(supportedCurrencies) : [];

  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setCategory(editData.category);
      setAcquisitionDate(editData.acquisition_date);
      setAcquisitionValue(String(editData.acquisition_value));
      setCurrentValue(String(editData.current_value));
      setDepreciationRate(String(editData.depreciation_rate));
      setInsurancePolicy(editData.insurance_policy ?? "");
      setInsuranceExpiry(editData.insurance_expiry ?? "");
      setCurrency(editData.currency ?? "BRL");
      setParentAssetId(editData.parent_asset_id ?? "");
    } else {
      setName("");
      setCategory("other");
      setAcquisitionDate(new Date().toISOString().slice(0, 10));
      setAcquisitionValue("");
      setCurrentValue("");
      setDepreciationRate("0");
      setInsurancePolicy("");
      setInsuranceExpiry("");
      setCurrency("BRL");
      setParentAssetId(defaultParentId ?? "");
    }
    setError("");
  }, [editData, open, defaultParentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const acqVal = parseFloat(acquisitionValue.replace(",", "."));
    const curVal = parseFloat(currentValue.replace(",", "."));
    const depRate = parseFloat(depreciationRate.replace(",", "."));

    if (!name.trim()) { setError("Informe o nome do bem."); return; }
    if (isNaN(acqVal) || acqVal < 0) { setError("Valor de aquisição inválido."); return; }
    if (isNaN(curVal) || curVal < 0) { setError("Valor atual inválido."); return; }

    try {
      if (isEditing && editData) {
        await updateAsset.mutateAsync({
          id: editData.id,
          name: name.trim(),
          category,
          current_value: curVal,
          depreciation_rate: isNaN(depRate) ? 0 : depRate,
          insurance_policy: insurancePolicy || null,
          insurance_expiry: insuranceExpiry || null,
          currency,
        });
      } else {
        if (!acquisitionDate) { setError("Informe a data de aquisição."); return; }
        await createAsset.mutateAsync({
          name: name.trim(),
          category,
          acquisition_date: acquisitionDate,
          acquisition_value: acqVal,
          current_value: curVal || acqVal,
          depreciation_rate: isNaN(depRate) ? 0 : depRate,
          insurance_policy: insurancePolicy || null,
          insurance_expiry: insuranceExpiry || null,
          currency,
          parent_asset_id: parentAssetId || null,
        });
      }
      toast.success(isEditing ? "Bem atualizado." : "Bem cadastrado com sucesso.");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  }

  if (!open) return null;
  const isPending = createAsset.isPending || updateAsset.isPending;

  return (
    <FocusTrap focusTrapOptions={{ escapeDeactivates: false }}>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold">
          {isEditing ? "Editar Bem" : "Cadastrar Bem Patrimonial"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Name + P14 template suggestions */}
          <div className="relative">
            <label htmlFor="asset-name" className="text-sm font-medium">Nome do bem</label>
            <input id="asset-name" type="text" value={name}
              onChange={(e) => { setName(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Ex: Apartamento Centro" required aria-required="true"
              autoComplete="off"
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            {/* P14: Template suggestions */}
            {!isEditing && showSuggestions && templates && (() => {
              const matches = searchTemplates(templates, name);
              if (matches.length === 0) return null;
              return (
                <div className="absolute z-20 mt-1 w-full rounded-md border bg-card shadow-elevated">
                  <div className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    <Sparkles className="mr-1 inline h-3 w-3" />Sugestões
                  </div>
                  {matches.map((t) => (
                    <button key={t.id} type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setName(t.name);
                        setCategory(t.category as AssetCategory);
                        setDepreciationRate(String(t.default_depreciation_rate));
                        if (t.reference_value_brl) {
                          setAcquisitionValue(String(t.reference_value_brl));
                          setCurrentValue(String(t.reference_value_brl));
                        }
                        setShowSuggestions(false);
                        toast.success(`Template "${t.name}" aplicado.`);
                      }}>
                      <span>{t.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.reference_value_brl ? `~R$ ${t.reference_value_brl.toLocaleString("pt-BR")}` : ""}
                        {t.default_depreciation_rate > 0 ? ` · ${t.default_depreciation_rate}%/ano` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="asset-category" className="text-sm font-medium">Categoria</label>
            <select id="asset-category" value={category} onChange={(e) => setCategory(e.target.value as AssetCategory)}
              aria-required="true"
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {ASSET_CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label} - {o.description}</option>
              ))}
            </select>
          </div>

          {/* Parent asset (P7b: hierarchy) */}
          {!isEditing && assets && assets.length > 0 && (
            <div>
              <label htmlFor="asset-parent" className="text-sm font-medium">Bem pai (opcional)</label>
              <select id="asset-parent" value={parentAssetId} onChange={(e) => setParentAssetId(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Nenhum (bem independente)</option>
                {assets.filter((a) => !(a as Record<string, unknown>).parent_asset_id).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Vincule como acessório ou componente de outro bem.
              </p>
            </div>
          )}

          {/* Currency */}
          <div>
            <label htmlFor="asset-currency" className="text-sm font-medium">Moeda</label>
            <select id="asset-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {currencyGroups.length > 0 ? (
                currencyGroups.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.currencies.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name} ({c.symbol})</option>
                    ))}
                  </optgroup>
                ))
              ) : (
                <option value="BRL">BRL - Real brasileiro (R$)</option>
              )}
            </select>
          </div>

          {/* Values */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="asset-acq-value" className="text-sm font-medium">Valor de aquisição ({currency})</label>
              <input id="asset-acq-value" type="text" inputMode="decimal" value={acquisitionValue}
                onChange={(e) => { setAcquisitionValue(e.target.value); if (!isEditing && !currentValue) setCurrentValue(e.target.value); }}
                placeholder="0,00" required={!isEditing} aria-required={!isEditing} disabled={isEditing}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50" />
            </div>
            <div>
              <label htmlFor="asset-cur-value" className="text-sm font-medium">Valor atual ({currency})</label>
              <input id="asset-cur-value" type="text" inputMode="decimal" value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)} placeholder="0,00" required aria-required="true"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Acquisition date + Depreciation */}
          <div className="grid grid-cols-2 gap-4">
            {!isEditing && (
              <div>
                <label htmlFor="asset-acq-date" className="text-sm font-medium">Data de aquisição</label>
                <input id="asset-acq-date" type="date" value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)}
                  required aria-required="true" className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
            )}
            <div>
              <label htmlFor="asset-depreciation" className="text-sm font-medium">Depreciação (% ao ano)</label>
              <input id="asset-depreciation" type="text" inputMode="decimal" value={depreciationRate}
                onChange={(e) => setDepreciationRate(e.target.value)} placeholder="0"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Imóveis: 4%. Veículos: 20%. Eletrônicos: 20-33%.
              </p>
            </div>
          </div>

          {/* Insurance */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="asset-insurance" className="text-sm font-medium">Apólice de seguro</label>
              <input id="asset-insurance" type="text" value={insurancePolicy} onChange={(e) => setInsurancePolicy(e.target.value)}
                placeholder="Opcional"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="asset-insurance-expiry" className="text-sm font-medium">Vencimento do seguro</label>
              <input id="asset-insurance-expiry" type="date" value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          {error && <p role="alert" className="rounded bg-terracotta/10 px-3 py-2 text-sm text-terracotta">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isPending}
              className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {isPending ? "Salvando" : isEditing ? "Salvar" : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </FocusTrap>
  );
}
