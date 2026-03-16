"use client";

/**
 * Oniefy - Data & Privacy Settings (CFG-05)
 *
 * CFG-05: Exportar todos os dados para backup pessoal ou migração.
 * Generates JSON with all user data, decrypted client-side.
 * Also: privacy policy link (Apple App Store requirement).
 */

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, FileJson, FileSpreadsheet, Loader2, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

type ExportFormat = "json" | "csv";

interface ExportProgress {
  step: string;
  done: boolean;
}

interface ExportWarnings {
  truncated: string[];
  failed: string[];
}

const TABLES_TO_EXPORT = [
  { key: "accounts", label: "Contas bancárias" },
  { key: "transactions", label: "Transações" },
  { key: "categories", label: "Categorias" },
  { key: "budgets", label: "Orçamentos" },
  { key: "assets", label: "Bens patrimoniais" },
  { key: "recurrences", label: "Recorrências" },
  { key: "family_members", label: "Membros familiares" },
  { key: "cost_centers", label: "Centros de custo" },
  { key: "chart_of_accounts", label: "Plano de contas" },
  { key: "journal_entries", label: "Lançamentos contábeis" },
  { key: "journal_lines", label: "Linhas contábeis" },
  { key: "workflows", label: "Workflows" },
  { key: "workflow_tasks", label: "Tarefas" },
  { key: "bank_connections", label: "Conexões bancárias" },
] as const;

// D2.01: Explicit columns for tables with sensitive fields
const TABLE_SELECT_COLUMNS: Partial<Record<string, string>> = {
  family_members: "id, user_id, full_name, relationship, avatar_emoji, is_active, created_at, updated_at",
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(";"),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = typeof val === "object" ? JSON.stringify(val) : String(val);
          // Escape semicolons and quotes
          return str.includes(";") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(";")
    ),
  ];
  return lines.join("\n");
}

export default function DataSettingsPage() {
  const supabase = createClient();
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<ExportWarnings>({ truncated: [], failed: [] });

  async function handleExport(format: ExportFormat) {
    setExporting(true);
    setError(null);
    setProgress([]);
    setWarnings({ truncated: [], failed: [] });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const allData: Record<string, unknown[]> = {};
      const exportWarnings: ExportWarnings = { truncated: [], failed: [] };
      const steps: ExportProgress[] = TABLES_TO_EXPORT.map((t) => ({
        step: t.label,
        done: false,
      }));
      setProgress([...steps]);

      const EXPORT_LIMIT = 10000;

      for (let i = 0; i < TABLES_TO_EXPORT.length; i++) {
        const table = TABLES_TO_EXPORT[i];

        // Check total count to detect truncation
        const { count } = await supabase
          .from(table.key)
          .select("*", { count: "exact", head: true });

        if (count !== null && count > EXPORT_LIMIT) {
          exportWarnings.truncated.push(
            `${table.label} (${count.toLocaleString("pt-BR")} registros, apenas ${EXPORT_LIMIT.toLocaleString("pt-BR")} exportados)`
          );
        }

        const selectCols = TABLE_SELECT_COLUMNS[table.key] ?? "*";
        const { data, error: fetchError } = await supabase
          .from(table.key)
          .select(selectCols)
          .limit(EXPORT_LIMIT);

        if (fetchError) {
          exportWarnings.failed.push(table.label);
          allData[table.key] = [];
        } else {
          allData[table.key] = data ?? [];
        }

        steps[i].done = true;
        setProgress([...steps]);
      }

      // Export user profile — explicit column list excluding encryption keys
      // Excluded: kek_material, encryption_key_encrypted, encryption_key_iv, cpf_encrypted
      const { data: profile } = await supabase
        .from("users_profile")
        .select("full_name, default_currency, onboarding_completed, created_at, updated_at, deletion_requested_at")
        .eq("id", user.id)
        .single();
      allData["profile"] = profile ? [profile] : [];

      setWarnings(exportWarnings);

      const timestamp = new Date().toISOString().slice(0, 10);

      if (format === "json") {
        const json = JSON.stringify(
          {
            exported_at: new Date().toISOString(),
            app: "Oniefy",
            user_id: user.id,
            data: allData,
          },
          null,
          2
        );
        const blob = new Blob([json], { type: "application/json" });
        downloadBlob(blob, `oniefy-backup-${timestamp}.json`);
      } else {
        // CSV: create one file per table, pack into a combined download
        // For simplicity, export the largest table (transactions) as CSV
        // and the rest as a single JSON
        const txRows = (allData["transactions"] ?? []) as Record<string, unknown>[];
        if (txRows.length > 0) {
          const csvContent = toCsv(txRows);
          const bom = "\uFEFF"; // UTF-8 BOM for Excel
          const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8" });
          downloadBlob(blob, `oniefy-transacoes-${timestamp}.csv`);
        }

        // Full data as JSON anyway (CSV is lossy for nested objects)
        const json = JSON.stringify({ exported_at: new Date().toISOString(), data: allData }, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        downloadBlob(blob, `oniefy-dados-completos-${timestamp}.json`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao exportar dados.");
    } finally {
      setExporting(false);
    }
  }

  const totalRows = progress.reduce((sum, p) => sum + (p.done ? 1 : 0), 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Dados e Privacidade</h1>
      </div>

      {/* ═══ CFG-05: Export ═══ */}
      <div className="space-y-4 rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold">Exportar dados</h2>
        <p className="text-xs text-muted-foreground">
          Baixe todos os seus dados para backup pessoal ou migração.
          O arquivo inclui contas, transações, orçamentos, bens, plano de contas e mais.
        </p>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {(warnings.truncated.length > 0 || warnings.failed.length > 0) && (
          <div className="rounded-md border border-warning/50 bg-warning/10 p-3 text-sm space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-warning-foreground">
              <AlertTriangle className="h-4 w-4" />
              Avisos da exportação
            </div>
            {warnings.failed.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Não foi possível exportar: {warnings.failed.join(", ")}.
                Os demais dados foram exportados com sucesso.
              </p>
            )}
            {warnings.truncated.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <p>Dados truncados (limite de 10.000 registros):</p>
                <ul className="list-disc list-inside mt-1">
                  {warnings.truncated.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {exporting && progress.length > 0 && (
          <div className="space-y-1.5 rounded-md border bg-muted/50 p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Exportando...</span>
              <span>{totalRows}/{TABLES_TO_EXPORT.length}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(totalRows / TABLES_TO_EXPORT.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button type="button"
            onClick={() => handleExport("json")}
            disabled={exporting}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileJson className="h-4 w-4" />
            )}
            Exportar JSON
          </button>

          <button type="button"
            onClick={() => handleExport("csv")}
            disabled={exporting}
            className="flex items-center gap-2 rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Exportar CSV + JSON
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Dados sensíveis (CPF, notas criptografadas) permanecem cifrados no export.
          A chave de criptografia não é incluída no arquivo.
        </p>
      </div>

      {/* Privacy Policy */}
      <div className="space-y-3 rounded-lg border bg-card p-5">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Privacidade</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Seus dados financeiros são protegidos por criptografia AES-256 em repouso,
          TLS em trânsito e criptografia ponta-a-ponta (E2E) para campos sensíveis.
          Nenhum dado é compartilhado com terceiros ou utilizado para publicidade.
        </p>
        <p className="text-xs text-muted-foreground">
          Para solicitar a exclusão permanente da sua conta e todos os dados associados,
          acesse Configurações → Segurança → Zona de perigo.
        </p>
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Ler Política de Privacidade completa
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
      </div>
    </div>
  );
}
