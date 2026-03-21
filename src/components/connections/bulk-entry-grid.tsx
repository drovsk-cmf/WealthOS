"use client";

/**
 * BulkEntryGrid - P8 (Adendo v1.5 §4.2.1)
 *
 * Tabela editável in-app para cadastro em massa.
 * Suporta: adicionar linha, validação inline, salvar tudo.
 *
 * Genérico: recebe column config e onSave callback.
 * Cada domínio (assets, vehicles, investments) fornece sua config.
 */

import { useState, useCallback } from "react";
import { Plus, Trash2, Save, AlertCircle, Check } from "lucide-react";

export interface ColumnDef {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  width?: string;
}

export interface RowData {
  _id: string;
  _errors: Record<string, string>;
  [key: string]: unknown;
}

/** Safe accessor for dynamic column keys (avoids TS7053 with index signatures) */
function cell(row: RowData, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

interface BulkEntryGridProps {
  columns: ColumnDef[];
  onSave: (rows: Record<string, unknown>[]) => Promise<{ saved: number; errors: string[] }>;
  title: string;
  description?: string;
  initialRows?: number;
}

let rowCounter = 0;
function newRow(columns: ColumnDef[]): RowData {
  const row: RowData = {
    _id: `row_${++rowCounter}_${Date.now()}`,
    _errors: {},
  };
  for (const col of columns) {
    (row as Record<string, unknown>)[col.key] = col.type === "number" ? "" : col.options?.[0]?.value ?? "";
  }
  return row;
}

function validateRow(row: RowData, columns: ColumnDef[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const col of columns) {
    const val = cell(row, col.key);
    if (col.required && (!val || (typeof val === "string" && val.trim() === ""))) {
      errors[col.key] = "Obrigatório";
    }
    if (col.type === "number" && val && typeof val === "string" && val.trim()) {
      const num = parseFloat(val.replace(/\./g, "").replace(",", "."));
      if (isNaN(num) || num < 0) {
        errors[col.key] = "Valor inválido";
      }
    }
    if (col.type === "date" && val && typeof val === "string" && val.trim()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(val) && !/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
        errors[col.key] = "Formato: DD/MM/AAAA";
      }
    }
  }
  return errors;
}

export function BulkEntryGrid({
  columns,
  onSave,
  title,
  description,
  initialRows = 3,
}: BulkEntryGridProps) {
  const [rows, setRows] = useState<RowData[]>(() =>
    Array.from({ length: initialRows }, () => newRow(columns))
  );
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ saved: number; errors: string[] } | null>(null);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, newRow(columns)]);
  }, [columns]);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r._id !== id));
  }, []);

  const updateCell = useCallback((id: string, key: string, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r._id !== id) return r;
        const updated = { ...r, [key]: value };
        // Clear error for this field on edit
        if (updated._errors[key]) {
          updated._errors = { ...updated._errors };
          delete updated._errors[key];
        }
        return updated;
      })
    );
  }, []);

  async function handleSave() {
    // Validate all rows
    let hasErrors = false;
    const validated = rows.map((row) => {
      const errors = validateRow(row, columns);
      if (Object.keys(errors).length > 0) hasErrors = true;
      return { ...row, _errors: errors };
    });
    setRows(validated);

    // Filter out empty rows (no required field filled)
    const nonEmpty = validated.filter((row) =>
      columns.some((col) => col.required && cell(row, col.key) && String(cell(row, col.key)).trim())
    );

    if (nonEmpty.length === 0) {
      setResult({ saved: 0, errors: ["Nenhuma linha preenchida."] });
      return;
    }

    if (hasErrors) {
      // Only block if non-empty rows have errors
      const errorRows = nonEmpty.filter((r) => Object.keys(r._errors).length > 0);
      if (errorRows.length > 0) return;
    }

    setSaving(true);
    setResult(null);

    try {
      // Strip internal fields
      const cleanRows = nonEmpty.map((row) => {
        const clean: Record<string, unknown> = {};
        for (const col of columns) {
          clean[col.key] = cell(row, col.key);
        }
        return clean;
      });

      const res = await onSave(cleanRows);
      setResult(res);

      if (res.saved > 0 && res.errors.length === 0) {
        // Reset grid with fresh rows
        setRows(Array.from({ length: initialRows }, () => newRow(columns)));
      }
    } catch (err) {
      setResult({ saved: 0, errors: [err instanceof Error ? err.message : "Erro ao salvar."] });
    } finally {
      setSaving(false);
    }
  }

  const filledCount = rows.filter((row) =>
    columns.some((col) => col.required && cell(row, col.key) && String(cell(row, col.key)).trim())
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {filledCount} linha(s) preenchida(s)
        </span>
      </div>

      {/* Result banner */}
      {result && (
        <div
          className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
            result.errors.length > 0
              ? "border-terracotta/20 bg-terracotta/10 text-terracotta"
              : "border-verdant/20 bg-verdant/10 text-verdant"
          }`}
        >
          {result.errors.length > 0 ? (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <Check className="h-4 w-4 flex-shrink-0" />
          )}
          <div>
            {result.saved > 0 && <p>{result.saved} item(ns) salvo(s).</p>}
            {result.errors.map((e, i) => (
              <p key={i}>{e}</p>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="w-10 px-2 py-2 text-center text-xs font-medium text-muted-foreground">
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-2 py-2 text-left text-xs font-medium text-muted-foreground"
                  style={{ minWidth: col.width || "120px" }}
                >
                  {col.label}
                  {col.required && <span className="ml-0.5 text-terracotta">*</span>}
                </th>
              ))}
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row._id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-2 py-1 text-center text-xs text-muted-foreground">
                  {idx + 1}
                </td>
                {columns.map((col) => (
                  <td key={col.key} className="px-1 py-1">
                    {col.type === "select" ? (
                      <select
                        value={String(cell(row, col.key) ?? "")}
                        onChange={(e) => updateCell(row._id, col.key, e.target.value)}
                        className={`h-8 w-full rounded border bg-background px-2 text-sm ${
                          row._errors[col.key]
                            ? "border-terracotta"
                            : "border-input"
                        }`}
                      >
                        <option value="">Selecione</option>
                        {col.options?.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={col.type === "date" ? "date" : "text"}
                        inputMode={col.type === "number" ? "decimal" : undefined}
                        value={String(cell(row, col.key) ?? "")}
                        onChange={(e) => updateCell(row._id, col.key, e.target.value)}
                        placeholder={col.placeholder}
                        className={`h-8 w-full rounded border bg-background px-2 text-sm ${
                          row._errors[col.key]
                            ? "border-terracotta"
                            : "border-input"
                        }`}
                      />
                    )}
                    {row._errors[col.key] && (
                      <p className="mt-0.5 text-[10px] text-terracotta">
                        {row._errors[col.key]}
                      </p>
                    )}
                  </td>
                ))}
                <td className="px-1 py-1">
                  <button
                    type="button"
                    onClick={() => removeRow(row._id)}
                    className="rounded p-1 text-muted-foreground/50 hover:text-terracotta"
                    title="Remover linha"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 rounded-md border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar linha
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || filledCount === 0}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : `Salvar tudo (${filledCount})`}
        </button>
      </div>
    </div>
  );
}
