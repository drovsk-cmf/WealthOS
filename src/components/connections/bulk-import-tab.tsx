"use client";

/**
 * BulkImportTab - P8 + P9 (Adendo v1.5 §4.2.1-4.3)
 *
 * Duas interfaces para importação em massa:
 * 1. Tabela editável in-app (P8): preencher direto no browser
 * 2. Templates Excel (P9): baixar, preencher offline, subir
 *
 * Domínios: Bens, Veículos, Investimentos
 * (Transações usa o ImportWizard existente)
 */

import { useState } from "react";
import { toast } from "sonner";
import { Download, Table2, FileSpreadsheet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getCachedUserId } from "@/lib/supabase/cached-auth";
import { BulkEntryGrid, type ColumnDef } from "./bulk-entry-grid";
import {
  downloadDomainTemplate,
  DOMAIN_TEMPLATE_INFO,
  type DomainTemplate,
} from "@/lib/parsers/oniefy-template";
import { ASSET_CATEGORY_OPTIONS } from "@/lib/hooks/use-assets";

// ─── Column configs per domain ───────────────────────────────

// Vehicle categories must be registered via the Veículos tab (which has plate field)
const VEHICLE_CATEGORY_PREFIXES = ["vehicle"];

const ASSET_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Nome", type: "text", required: true, placeholder: "Ex: Apartamento Centro", width: "180px" },
  {
    key: "category",
    label: "Categoria",
    type: "select",
    required: true,
    options: ASSET_CATEGORY_OPTIONS
      .filter((o) => o.value !== "restricted" && !VEHICLE_CATEGORY_PREFIXES.some((p) => o.value.startsWith(p)))
      .map((o) => ({ value: o.value, label: o.label })),
    width: "160px",
  },
  { key: "acquisition_value", label: "Valor Aquisição", type: "number", required: true, placeholder: "0,00", width: "140px" },
  { key: "current_value", label: "Valor Atual", type: "number", required: true, placeholder: "0,00", width: "140px" },
  { key: "acquisition_date", label: "Data Aquisição", type: "date", required: true, width: "140px" },
  { key: "notes", label: "Notas", type: "text", placeholder: "Observações", width: "200px" },
];

const VEHICLE_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Descrição", type: "text", required: true, placeholder: "Ex: Honda Civic EXL 2023", width: "200px" },
  {
    key: "category",
    label: "Tipo",
    type: "select",
    required: true,
    options: [
      { value: "vehicle_auto", label: "Automóvel" },
      { value: "vehicle_moto", label: "Motocicleta" },
      { value: "vehicle_recreational", label: "Embarcação/Trailer" },
      { value: "vehicle_aircraft", label: "Aeronave" },
      { value: "vehicle", label: "Outro veículo" },
    ],
    width: "150px",
  },
  { key: "license_plate", label: "Placa", type: "text", placeholder: "ABC1D23", width: "110px" },
  { key: "vehicle_brand", label: "Marca", type: "text", placeholder: "Honda", width: "110px" },
  { key: "vehicle_model", label: "Modelo", type: "text", placeholder: "Civic", width: "110px" },
  { key: "vehicle_year", label: "Ano", type: "number", placeholder: "2023", width: "80px" },
  { key: "vehicle_color", label: "Cor", type: "text", placeholder: "Prata", width: "90px" },
  { key: "acquisition_value", label: "Valor Aquisição", type: "number", required: true, placeholder: "0,00", width: "130px" },
  { key: "current_value", label: "Valor Atual", type: "number", required: true, placeholder: "0,00", width: "130px" },
  { key: "acquisition_date", label: "Data Aquisição", type: "date", required: true, width: "130px" },
  { key: "notes", label: "Notas", type: "text", placeholder: "Financiamento, etc.", width: "160px" },
];

const INVESTMENT_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Nome", type: "text", required: true, placeholder: "Ex: CDB Inter 120%CDI", width: "200px" },
  { key: "acquisition_value", label: "Valor Aplicação", type: "number", required: true, placeholder: "0,00", width: "140px" },
  { key: "current_value", label: "Valor Atual", type: "number", required: true, placeholder: "0,00", width: "140px" },
  { key: "acquisition_date", label: "Data Aplicação", type: "date", required: true, width: "140px" },
  { key: "currency", label: "Moeda", type: "select", options: [
    { value: "BRL", label: "BRL" }, { value: "USD", label: "USD" }, { value: "EUR", label: "EUR" },
    { value: "BTC", label: "BTC" }, { value: "ETH", label: "ETH" },
  ], width: "80px" },
  { key: "notes", label: "Notas", type: "text", placeholder: "Vencimento, ticker, etc.", width: "200px" },
];

type BulkDomain = "assets" | "vehicles" | "investments";

const DOMAIN_CONFIG: Record<BulkDomain, {
  columns: ColumnDef[];
  title: string;
  description: string;
  templateDomain: DomainTemplate;
  assetCategoryFallback: string;
}> = {
  assets: {
    columns: ASSET_COLUMNS,
    title: "Cadastro de bens",
    description: "Imóveis, eletrônicos, móveis, jóias, colecionáveis",
    templateDomain: "assets",
    assetCategoryFallback: "other",
  },
  vehicles: {
    columns: VEHICLE_COLUMNS,
    title: "Cadastro de veículos",
    description: "Carros, motos, embarcações, aeronaves",
    templateDomain: "vehicles",
    assetCategoryFallback: "vehicle_auto",
  },
  investments: {
    columns: INVESTMENT_COLUMNS,
    title: "Cadastro de investimentos",
    description: "Renda fixa, ações, fundos, crypto",
    templateDomain: "investments",
    assetCategoryFallback: "other",
  },
};

function parseNumber(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val !== "string") return 0;
  return parseFloat(val.replace(/\./g, "").replace(",", ".")) || 0;
}

function parseDate(val: unknown): string {
  if (typeof val !== "string" || !val.trim()) return new Date().toISOString().split("T")[0];
  // DD/MM/YYYY → YYYY-MM-DD
  const dmy = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  return val;
}

export function BulkImportTab() {
  const [domain, setDomain] = useState<BulkDomain>("assets");
  const [downloading, setDownloading] = useState<DomainTemplate | null>(null);

  const config = DOMAIN_CONFIG[domain];

  async function handleSave(rows: Record<string, unknown>[]) {
    const supabase = createClient();
    const userId = await getCachedUserId(supabase);
    if (!userId) throw new Error("Sessão expirada.");

    const errors: string[] = [];
    let saved = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = String(row.name ?? "").trim();
      if (!name) continue;

      const category = String(row.category ?? config.assetCategoryFallback);
      const acqValue = parseNumber(row.acquisition_value);
      const curValue = parseNumber(row.current_value);
      const acqDate = parseDate(row.acquisition_date);
      const currency = String(row.currency ?? "BRL");
      const notes = String(row.notes ?? "").trim() || null;

      // Vehicle-specific fields (only populated from Veículos tab)
      const licensePlate = row.license_plate ? String(row.license_plate).trim().toUpperCase() : null;
      const vehicleBrand = row.vehicle_brand ? String(row.vehicle_brand).trim() : null;
      const vehicleModel = row.vehicle_model ? String(row.vehicle_model).trim() : null;
      const vehicleYear = row.vehicle_year ? parseInt(String(row.vehicle_year), 10) || null : null;
      const vehicleColor = row.vehicle_color ? String(row.vehicle_color).trim() : null;

      const { error } = await supabase.from("assets").insert({
        user_id: userId,
        name,
        category: category as never,
        acquisition_value: acqValue,
        current_value: curValue,
        acquisition_date: acqDate,
        currency,
        notes_encrypted: notes,
        ...(licensePlate && { license_plate: licensePlate }),
        ...(vehicleBrand && { vehicle_brand: vehicleBrand }),
        ...(vehicleModel && { vehicle_model: vehicleModel }),
        ...(vehicleYear && { vehicle_year: vehicleYear }),
        ...(vehicleColor && { vehicle_color: vehicleColor }),
      });

      if (error) {
        errors.push(`Linha ${i + 1} (${name}): ${error.message}`);
      } else {
        saved++;
      }
    }

    if (saved > 0) {
      toast.success(`${saved} bem(ns) cadastrado(s).`);
    }

    return { saved, errors };
  }

  async function handleDownload(tmpl: DomainTemplate) {
    setDownloading(tmpl);
    try {
      await downloadDomainTemplate(tmpl);
      toast.success(`Template "${DOMAIN_TEMPLATE_INFO[tmpl].label}" baixado.`);
    } catch {
      toast.error("Erro ao gerar template.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Domain tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1">
        {(["assets", "vehicles", "investments"] as BulkDomain[]).map((d) => (
          <button
            type="button"
            key={d}
            onClick={() => setDomain(d)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              domain === d ? "bg-card shadow-card" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {DOMAIN_CONFIG[d].title.replace("Cadastro de ", "")}
          </button>
        ))}
      </div>

      {/* Editable grid (P8) */}
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Table2 className="h-3.5 w-3.5" />
          Preencha diretamente na tabela abaixo
        </div>
        <BulkEntryGrid
          columns={config.columns}
          onSave={handleSave}
          title={config.title}
          description={config.description}
          initialRows={3}
        />
      </div>

      {/* Template downloads (P9) */}
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Templates Excel</h3>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Prefere preencher offline? Baixe o template, preencha no Excel e suba na aba Importar extrato.
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(DOMAIN_TEMPLATE_INFO) as DomainTemplate[]).map((tmpl) => (
            <button
              type="button"
              key={tmpl}
              onClick={() => handleDownload(tmpl)}
              disabled={downloading === tmpl}
              className="flex items-center gap-1.5 rounded-md btn-alive border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {downloading === tmpl ? "Gerando..." : DOMAIN_TEMPLATE_INFO[tmpl].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
