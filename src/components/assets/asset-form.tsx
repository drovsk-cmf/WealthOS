"use client";

/**
 * AssetForm - PAT-01 (cadastrar), PAT-02 (editar bem)
 *
 * Dialog for creating/editing an asset.
 * Fields: name, category, acquisition_date, acquisition_value, current_value,
 *         depreciation_rate, insurance_policy, insurance_expiry.
 */

import { useState, useEffect } from "react";
import {
  useCreateAsset,
  useUpdateAsset,
  ASSET_CATEGORY_OPTIONS,
} from "@/lib/hooks/use-assets";
import { formatCurrency } from "@/lib/utils";
import type { Database } from "@/types/database";

type AssetCategory = Database["public"]["Enums"]["asset_category"];

interface AssetFormProps {
  open: boolean;
  onClose: () => void;
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
  } | null;
}

export function AssetForm({ open, onClose, editData }: AssetFormProps) {
  const isEditing = !!editData;

  const [name, setName] = useState("");
  const [category, setCategory] = useState<AssetCategory>("other");
  const [acquisitionDate, setAcquisitionDate] = useState("");
  const [acquisitionValue, setAcquisitionValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [depreciationRate, setDepreciationRate] = useState("0");
  const [insurancePolicy, setInsurancePolicy] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [error, setError] = useState("");

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
    } else {
      setName("");
      setCategory("other");
      setAcquisitionDate(new Date().toISOString().slice(0, 10));
      setAcquisitionValue("");
      setCurrentValue("");
      setDepreciationRate("0");
      setInsurancePolicy("");
      setInsuranceExpiry("");
    }
    setError("");
  }, [editData, open]);

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
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  }

  if (!open) return null;
  const isPending = createAsset.isPending || updateAsset.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold">
          {isEditing ? "Editar Bem" : "Cadastrar Bem Patrimonial"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium">Nome do bem</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Apartamento Centro" required
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium">Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as AssetCategory)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {ASSET_CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label} - {o.description}</option>
              ))}
            </select>
          </div>

          {/* Values */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Valor de aquisição (R$)</label>
              <input type="text" inputMode="decimal" value={acquisitionValue}
                onChange={(e) => { setAcquisitionValue(e.target.value); if (!isEditing && !currentValue) setCurrentValue(e.target.value); }}
                placeholder="0,00" required={!isEditing} disabled={isEditing}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50" />
            </div>
            <div>
              <label className="text-sm font-medium">Valor atual (R$)</label>
              <input type="text" inputMode="decimal" value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)} placeholder="0,00" required
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Acquisition date + Depreciation */}
          <div className="grid grid-cols-2 gap-4">
            {!isEditing && (
              <div>
                <label className="text-sm font-medium">Data de aquisição</label>
                <input type="date" value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)}
                  required className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Depreciação (% ao ano)</label>
              <input type="text" inputMode="decimal" value={depreciationRate}
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
              <label className="text-sm font-medium">Apólice de seguro</label>
              <input type="text" value={insurancePolicy} onChange={(e) => setInsurancePolicy(e.target.value)}
                placeholder="Opcional"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Vencimento do seguro</label>
              <input type="date" value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isPending}
              className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {isPending ? "Salvando..." : isEditing ? "Salvar" : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
