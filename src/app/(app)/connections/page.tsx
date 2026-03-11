"use client";

/**
 * Oniefy - Conexões Bancárias (Phase 9B - Standalone)
 *
 * BANK-01: Gerenciar conexões (manual, futuro: agregador)
 * BANK-02: Import CSV/OFX com preview e mapeamento
 * BANK-03: Auto-categorização via RPC (pipeline de regras)
 * BANK-04: Reconciliação manual (saldo contábil vs informado)
 * BANK-05: Status da conexão (manual = sempre ativa)
 * BANK-06: Desconectar (desativa, mantém transações)
 */

import { useState, useCallback } from "react";
import { Landmark } from "lucide-react";
import {
  useBankConnections,
  useCreateBankConnection,
  useDeactivateBankConnection,
  useImportBatch,
  SYNC_STATUS_LABELS,
  SYNC_STATUS_COLORS,
} from "@/lib/hooks/use-bank-connections";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { parseCSVRaw, suggestMapping, mapToTransactions } from "@/lib/parsers/csv-parser";
import { parseOFX } from "@/lib/parsers/ofx-parser";
import { parseXLSX } from "@/lib/parsers/xlsx-parser";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CSVColumnMapping, CSVTransaction } from "@/lib/parsers/csv-parser";
import type { OFXTransaction } from "@/lib/parsers/ofx-parser";

type Tab = "connections" | "import";
type ImportStep = "upload" | "mapping" | "preview" | "result";

export default function ConnectionsPage() {
  const [tab, setTab] = useState<Tab>("import");

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Conexões & Importação</h1>
        <p className="text-sm text-muted-foreground">
          Importe extratos bancários (CSV/OFX/XLSX) ou gerencie conexões
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1">
        {([
          { key: "import" as const, label: "Importar extrato" },
          { key: "connections" as const, label: "Conexões" },
        ]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "import" && <ImportWizard />}
      {tab === "connections" && <ConnectionsManager />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// IMPORT WIZARD (BANK-02, BANK-03)
// ═══════════════════════════════════════════════════════════════

function ImportWizard() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [fileType, setFileType] = useState<"csv" | "ofx" | "xlsx">("csv");
  const [accountId, setAccountId] = useState("");
  const [connectionId, setConnectionId] = useState<string | null>(null);

  // CSV state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<CSVColumnMapping | null>(null);

  // Parsed transactions (unified)
  const [transactions, setTransactions] = useState<(CSVTransaction | OFXTransaction)[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const { data: accounts } = useAccounts();
  const { data: connections } = useBankConnections();
  const importBatch = useImportBatch();

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase().split(".").pop();

    if (ext === "xlsx" || ext === "xls") {
      // Excel: read as ArrayBuffer
      const reader = new FileReader();
      reader.onload = (ev) => {
        const buffer = ev.target?.result as ArrayBuffer;
        const result = parseXLSX(buffer);
        setFileType("xlsx");
        setCsvHeaders(result.headers);
        setCsvRows(result.rows);

        const suggested = suggestMapping(result.headers, result.rows[0] || []);
        setMapping(suggested);
        setStep("mapping");
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV/TSV/OFX/QFX: read as text
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const content = ev.target?.result as string;

        if (ext === "ofx" || ext === "qfx") {
          setFileType("ofx");
          const result = await parseOFX(content);
          setTransactions(result.transactions);
          setParseErrors(result.errors);
          if (result.duplicatesSkipped > 0) {
            setParseErrors((prev) => [
              ...prev,
              `${result.duplicatesSkipped} transação(ões) duplicada(s) ignorada(s).`,
            ]);
          }
          setSelected(new Set(result.transactions.map((_, i) => i)));
          setStep("preview");
        } else {
          setFileType("csv");
          const { headers, rows } = parseCSVRaw(content);
          setCsvHeaders(headers);
          setCsvRows(rows);

          const suggested = suggestMapping(headers, rows[0] || []);
          setMapping(suggested);
          setStep("mapping");
        }
      };
      reader.readAsText(file, "utf-8");
    }
  }, []);

  const handleApplyMapping = useCallback(() => {
    if (!mapping) return;
    const { transactions: txs, errors } = mapToTransactions(csvRows, mapping);
    setTransactions(txs);
    setParseErrors(errors);
    setSelected(new Set(txs.map((_, i) => i)));
    setStep("preview");
  }, [mapping, csvRows]);

  const handleImport = useCallback(async () => {
    if (!accountId) return;
    const selectedTxs = transactions.filter((_, i) => selected.has(i));

    const result = await importBatch.mutateAsync({
      accountId,
      bankConnectionId: connectionId,
      transactions: selectedTxs.map((tx) => ({
        date: tx.date,
        amount: tx.amount,
        description: tx.description,
        type: tx.type,
        external_id: tx.externalId,
      })),
    });

    setStep("result");
    return result;
  }, [accountId, connectionId, transactions, selected, importBatch]);

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === transactions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(transactions.map((_, i) => i)));
    }
  };

  // ─── Step: Upload ─────────────────────────────────────────

  if (step === "upload") {
    return (
      <div className="space-y-6">
        {/* Account selector */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Conta de destino</label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Selecione a conta</option>
            {accounts?.filter((a) => a.is_active).map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {/* Connection (optional) */}
        {connections && connections.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Conexão bancária (opcional)</label>
            <select value={connectionId || ""} onChange={(e) => setConnectionId(e.target.value || null)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Nenhuma</option>
              {connections.map((c) => (
                <option key={c.id} value={c.id}>{c.institution_name}</option>
              ))}
            </select>
          </div>
        )}

        {/* File upload */}
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card p-12">
          
          <p className="mt-3 text-sm font-semibold">Arraste um arquivo ou clique para selecionar</p>
          <p className="mt-1 text-xs text-muted-foreground">Formatos: CSV, TSV, OFX, QFX, XLSX, XLS</p>
          <input
            type="file"
            accept=".csv,.tsv,.ofx,.qfx,.xlsx,.xls,.txt"
            onChange={handleFileUpload}
            disabled={!accountId}
            className="mt-4 text-sm file:mr-3 file:rounded-md file:border file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground disabled:opacity-50"
          />
          {!accountId && (
            <p className="mt-2 text-xs text-terracotta">Selecione uma conta primeiro.</p>
          )}
        </div>
      </div>
    );
  }

  // ─── Step: Column Mapping (CSV only) ──────────────────────

  if (step === "mapping") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mapeamento de colunas</h2>
          <button onClick={() => setStep("upload")}
            className="text-sm text-muted-foreground hover:text-foreground">
            Voltar
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          {csvHeaders.length} colunas detectadas, {csvRows.length} linhas. Ajuste se necessário.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {(["date", "amount", "description"] as const).map((field) => (
            <div key={field} className="space-y-1.5">
              <label className="text-sm font-medium capitalize">
                {field === "date" ? "Data" : field === "amount" ? "Valor" : "Descrição"}
              </label>
              <select
                value={mapping?.[field] ?? 0}
                onChange={(e) => setMapping((m) => m ? { ...m, [field]: parseInt(e.target.value) } : null)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {csvHeaders.map((h, i) => (
                  <option key={i} value={i}>{h || `Coluna ${i + 1}`}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Preview of first 3 rows */}
        {csvRows.length > 0 && (
          <div className="overflow-x-auto rounded border bg-muted/50 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Preview (3 primeiras linhas)</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  {csvHeaders.map((h, i) => (
                    <th key={i} className={`px-2 py-1 text-left font-medium ${
                      i === mapping?.date ? "text-info-slate" : i === mapping?.amount ? "text-verdant" : i === mapping?.description ? "text-burnished" : ""
                    }`}>{h || `Col ${i + 1}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvRows.slice(0, 3).map((row, ri) => (
                  <tr key={ri} className="border-b border-muted/50">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-2 py-1 tabular-nums">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button onClick={handleApplyMapping} disabled={!mapping}
          className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          Aplicar mapeamento e continuar
        </button>
      </div>
    );
  }

  // ─── Step: Preview ────────────────────────────────────────

  if (step === "preview") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Preview ({selected.size}/{transactions.length} selecionadas)
          </h2>
          <button onClick={() => setStep(fileType === "ofx" ? "upload" : "mapping")}
            className="text-sm text-muted-foreground hover:text-foreground">
            Voltar
          </button>
        </div>

        {parseErrors.length > 0 && (
          <div className="rounded-lg border border-burnished/20 bg-burnished/10 p-3">
            <p className="text-xs font-semibold text-burnished">{parseErrors.length} aviso(s):</p>
            {parseErrors.slice(0, 5).map((e, i) => (
              <p key={i} className="text-xs text-burnished">{e}</p>
            ))}
            {parseErrors.length > 5 && (
              <p className="text-xs text-burnished">e mais {parseErrors.length - 5}</p>
            )}
          </div>
        )}

        {/* Select all */}
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={selected.size === transactions.length}
            onChange={toggleAll} className="h-4 w-4 rounded border-input" />
          <span className="text-xs text-muted-foreground">Selecionar todas</span>
        </div>

        {/* Transaction list */}
        <div className="max-h-96 space-y-1 overflow-y-auto rounded-lg border bg-card">
          {transactions.map((tx, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-2 text-sm ${
              selected.has(i) ? "" : "opacity-40"
            }`}>
              <input type="checkbox" checked={selected.has(i)}
                onChange={() => toggleSelect(i)} className="h-4 w-4 rounded border-input" />
              <span className="w-24 flex-shrink-0 tabular-nums text-muted-foreground">
                {tx.date}
              </span>
              <span className="min-w-0 flex-1 truncate">{tx.description}</span>
              <span className={`w-28 flex-shrink-0 text-right tabular-nums font-medium ${
                tx.type === "income" ? "text-verdant" : "text-terracotta"
              }`}>
                {tx.type === "income" ? "+" : "-"}{formatCurrency(Math.abs(tx.amount))}
              </span>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 text-sm">
          <div>
            <span className="text-verdant tabular-nums">
              +{formatCurrency(transactions.filter((_, i) => selected.has(i) && transactions[i].type === "income").reduce((s, tx) => s + Math.abs(tx.amount), 0))}
            </span>
            {" / "}
            <span className="text-terracotta tabular-nums">
              -{formatCurrency(transactions.filter((_, i) => selected.has(i) && transactions[i].type === "expense").reduce((s, tx) => s + Math.abs(tx.amount), 0))}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{selected.size} transações</span>
        </div>

        <button onClick={handleImport}
          disabled={selected.size === 0 || importBatch.isPending}
          className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {importBatch.isPending ? "Importando" : `Importar ${selected.size} transações`}
        </button>
      </div>
    );
  }

  // ─── Step: Result ─────────────────────────────────────────

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
      
      <h2 className="mt-3 text-xl font-bold">Importação concluída</h2>
      {importBatch.data && (
        <div className="mt-4 space-y-1 text-sm">
          <p className="text-verdant font-medium">{importBatch.data.imported} transações importadas</p>
          {importBatch.data.skipped > 0 && (
            <p className="text-burnished">{importBatch.data.skipped} duplicadas (ignoradas)</p>
          )}
          <p className="text-info-slate">{importBatch.data.categorized} auto-categorizadas</p>
        </div>
      )}
      <button onClick={() => { setStep("upload"); setTransactions([]); }}
        className="mt-6 rounded-md border px-6 py-2 text-sm font-medium hover:bg-accent">
        Importar outro arquivo
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONNECTIONS MANAGER (BANK-01, BANK-05, BANK-06)
// ═══════════════════════════════════════════════════════════════

function ConnectionsManager() {
  const { data: connections, isLoading } = useBankConnections();
  const createConnection = useCreateBankConnection();
  const deactivateConnection = useDeactivateBankConnection();
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await createConnection.mutateAsync({ institution_name: newName.trim() });
    setNewName("");
    setShowNew(false);
  }

  async function handleDeactivate(id: string) {
    await deactivateConnection.mutateAsync(id);
    setConfirmDelete(null);
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowNew(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          + Nova conexão
        </button>
      </div>

      {(!connections || connections.length === 0) ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          
          <h2 className="mt-2 text-lg font-semibold">Nenhuma conexão bancária</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Sem conexões cadastradas. Importação de arquivos CSV/OFX/XLSX funciona sem conexão. Conexões permitem rastreamento de duplicatas.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {connections.map((conn) => (
            <div key={conn.id} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Landmark className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{conn.institution_name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${SYNC_STATUS_COLORS[conn.sync_status]}`}>
                    {SYNC_STATUS_LABELS[conn.sync_status]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {conn.provider === "manual" ? "Import manual (CSV/OFX)" : conn.provider}
                  {conn.last_sync_at && ` · Última sync: ${formatDate(conn.last_sync_at)}`}
                </p>
              </div>

              {/* Deactivate */}
              {confirmDelete === conn.id ? (
                <div className="flex items-center gap-1">
                  <button onClick={() => handleDeactivate(conn.id)}
                    disabled={deactivateConnection.isPending}
                    className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground">
                    Confirmar
                  </button>
                  <button onClick={() => setConfirmDelete(null)}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground">Não</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(conn.id)}
                  className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Desconectar">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New connection dialog */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowNew(false)} />
          <div className="relative z-50 mx-4 w-full max-w-md rounded-lg border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Nova Conexão Manual</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Agrupa importações de uma mesma instituição financeira.
            </p>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Nome da instituição</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Nubank, Itaú, BTG" autoFocus
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowNew(false)}
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
                  Cancelar
                </button>
                <button type="submit" disabled={!newName.trim() || createConnection.isPending}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {createConnection.isPending ? "Criando" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info about future aggregator */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Atualmente as importações são feitas via arquivo (CSV, OFX, XLSX).
          Integração automática via Open Finance (agregador certificado) será
          disponibilizada em versão futura.
        </p>
      </div>
    </div>
  );
}
