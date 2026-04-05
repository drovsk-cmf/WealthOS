"use client";

/**
 * UX-H1-02: Onboarding Step 9 - Route C (Snapshot)
 *
 * Simplified inline flow to register 1-2 key assets.
 * Uses useCreateAsset hook.
 */

import { useState } from "react";
import {
  Home,
  Car,
  Laptop,
  Package,
  Plus,
  Loader2,
  X,
} from "lucide-react";
import { useCreateAsset } from "@/lib/hooks/use-assets";
import type { Database } from "@/types/database";
import { toLocalDateString } from "@/lib/utils";

type AssetCategory = Database["public"]["Enums"]["asset_category"];

const CATEGORIES: {
  value: AssetCategory;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
}[] = [
  { value: "real_estate", label: "Imóvel", icon: <Home className="h-4 w-4" />, placeholder: "Ex: Apartamento Centro" },
  { value: "vehicle", label: "Veículo", icon: <Car className="h-4 w-4" />, placeholder: "Ex: Honda Civic 2023" },
  { value: "electronics", label: "Eletrônico", icon: <Laptop className="h-4 w-4" />, placeholder: "Ex: MacBook Pro" },
  { value: "other", label: "Outro", icon: <Package className="h-4 w-4" />, placeholder: "Ex: Investimento em arte" },
];

interface AssetDraft {
  name: string;
  category: AssetCategory;
  value: string;
}

interface RouteSnapshotStepProps {
  onComplete: (stats: { assets: number }) => void;
  currencySymbol?: string;
}

export function RouteSnapshotStep({ onComplete, currencySymbol = "R$" }: RouteSnapshotStepProps) {
  const [assets, setAssets] = useState<AssetDraft[]>([
    { name: "", category: "real_estate", value: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const createAsset = useCreateAsset();

  function updateAsset(index: number, field: keyof AssetDraft, val: string) {
    setAssets((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  }

  function addAsset() {
    if (assets.length >= 3) return;
    setAssets((prev) => [...prev, { name: "", category: "other", value: "" }]);
  }

  function removeAsset(index: number) {
    if (assets.length <= 1) return;
    setAssets((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    // Filter valid assets
    const valid = assets.filter((a) => {
      const num = parseFloat(a.value.replace(",", "."));
      return a.name.trim() && num > 0;
    });

    if (valid.length === 0) {
      setError("Informe ao menos um bem com nome e valor.");
      return;
    }

    setSaving(true);
    setError(null);
    let count = 0;

    for (const asset of valid) {
      const numValue = parseFloat(asset.value.replace(",", "."));
      const today = toLocalDateString();

      try {
        await createAsset.mutateAsync({
          name: asset.name.trim(),
          category: asset.category,
          acquisition_value: numValue,
          current_value: numValue,
          acquisition_date: today,
        });
        count++;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : `Erro ao salvar ${asset.name}`
        );
        break;
      }
    }

    setSavedCount(count);
    setSaving(false);

    if (count > 0) {
      onComplete({ assets: count });
    }
  }

  function handleSkip() {
    onComplete({ assets: 0 });
  }

  const selectedCategory = (cat: AssetCategory) =>
    CATEGORIES.find((c) => c.value === cat)!;

  return (
    <>
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Registre seus principais bens
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Uma foto rápida do seu patrimônio. Você pode detalhar depois.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
          {savedCount > 0 && (
            <span className="ml-1">({savedCount} salvo{savedCount > 1 ? "s" : ""})</span>
          )}
        </div>
      )}

      <div className="space-y-4">
        {assets.map((asset, idx) => (
          <div
            key={idx}
            className="relative space-y-3 rounded-lg border border-input p-4"
          >
            {assets.length > 1 && (
              <button type="button"
                onClick={() => removeAsset(idx)}
                className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Remover"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Category selector */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button type="button"
                  key={cat.value}
                  onClick={() => updateAsset(idx, "category", cat.value)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors ${
                    asset.category === cat.value
                      ? "bg-primary/10 font-medium text-primary"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Name */}
            <input
              type="text"
              value={asset.name}
              onChange={(e) => updateAsset(idx, "name", e.target.value)}
              placeholder={selectedCategory(asset.category).placeholder}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />

            {/* Value */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {currencySymbol}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={asset.value}
                onChange={(e) =>
                  updateAsset(
                    idx,
                    "value",
                    e.target.value.replace(/[^0-9.,]/g, "")
                  )
                }
                placeholder="0,00"
                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add another */}
      {assets.length < 3 && (
        <button type="button"
          onClick={addAsset}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-input p-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Adicionar outro bem
        </button>
      )}

      <button type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg btn-cta px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Salvando
          </span>
        ) : (
          "Salvar e continuar"
        )}
      </button>

      <button type="button"
        onClick={handleSkip}
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground hover:underline"
      >
        Pular por agora
      </button>
    </>
  );
}
