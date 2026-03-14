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

import { useState } from "react";
import { Landmark } from "lucide-react";
import {
  SYNC_STATUS_COLORS,
  SYNC_STATUS_LABELS,
  useBankConnections,
  useCreateBankConnection,
  useDeactivateBankConnection,
} from "@/lib/hooks/use-bank-connections";
import { useAutoReset, useEscapeClose } from "@/lib/hooks/use-dialog-helpers";
import { formatDate } from "@/lib/utils";
import { ImportWizard } from "@/components/connections/import-wizard";

type Tab = "connections" | "import";

export default function ConnectionsPage() {
  const [tab, setTab] = useState<Tab>("import");

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Conexões & Importação</h1>
        <p className="text-sm text-muted-foreground">
          Importe extratos bancários (CSV/OFX/XLSX) ou gerencie conexões
        </p>
      </div>

      <div className="flex gap-1 rounded-lg border bg-muted p-1">
        {([
          { key: "import" as const, label: "Importar extrato" },
          { key: "connections" as const, label: "Conexões" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "import" && <ImportWizard />}
      {tab === "connections" && <ConnectionsManager />}
    </div>
  );
}

function ConnectionsManager() {
  const { data: connections, isLoading } = useBankConnections();
  const createConnection = useCreateBankConnection();
  const deactivateConnection = useDeactivateBankConnection();
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useAutoReset(confirmDelete, setConfirmDelete);
  useEscapeClose(showNew, () => setShowNew(false));

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
        {[1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowNew(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Nova conexão
        </button>
      </div>

      {!connections || connections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Landmark className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Nenhuma conexão bancária</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Sem conexões cadastradas. Importação de arquivos CSV/OFX/XLSX funciona sem conexão. Conexões
            permitem rastreamento de duplicatas.
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

              {confirmDelete === conn.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDeactivate(conn.id)}
                    disabled={deactivateConnection.isPending}
                    className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground"
                  >
                    Confirmar
                  </button>
                  <button onClick={() => setConfirmDelete(null)} className="rounded-md px-2 py-1 text-xs text-muted-foreground">
                    Não
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(conn.id)}
                  className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Desconectar"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

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
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Nubank, Itaú, BTG"
                  autoFocus
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNew(false)}
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim() || createConnection.isPending}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {createConnection.isPending ? "Criando" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Atualmente as importações são feitas via arquivo (CSV, OFX, XLSX). Integração automática via
          Open Finance (agregador certificado) será disponibilizada em versão futura.
        </p>
      </div>
    </div>
  );
}
