import { useState, useCallback, useRef } from "react";
import { Upload, Download, ChevronDown, ChevronUp, Info } from "lucide-react";
import { downloadImportTemplate } from "@/lib/parsers/oniefy-template";
import type { Database } from "@/types/database";

type Account = Database["public"]["Tables"]["accounts"]["Row"];
type BankConnection = Database["public"]["Tables"]["bank_connections"]["Row"];

interface Props {
  accountId: string;
  setAccountId: (value: string) => void;
  connectionId: string | null;
  setConnectionId: (value: string | null) => void;
  accounts?: Account[];
  connections?: BankConnection[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isParsing?: boolean;
}

const ACCEPTED_EXTENSIONS = [".csv", ".tsv", ".ofx", ".qfx", ".xlsx", ".xls", ".txt"];

export function ImportStepUpload({
  accountId,
  setAccountId,
  connectionId,
  setConnectionId,
  accounts,
  connections,
  onFileUpload,
  isParsing,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (accountId) setDragging(true);
  }, [accountId]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    if (!accountId) return;

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      // Error handled by parent via onFileUpload validation
      return;
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) return;

    // Simulate a file input change event for the existing handler
    const dt = new DataTransfer();
    dt.items.add(file);
    if (inputRef.current) {
      inputRef.current.files = dt.files;
      inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, [accountId]);

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Conta de destino</label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Selecione a conta</option>
          {accounts?.filter((a) => a.is_active).map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {connections && connections.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Conexão bancária (opcional)</label>
          <select
            value={connectionId || ""}
            onChange={(e) => setConnectionId(e.target.value || null)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Nenhuma</option>
            {connections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.institution_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => accountId && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
          !accountId
            ? "bg-muted/30 opacity-50"
            : dragging
              ? "border-primary bg-primary/5"
              : "bg-card hover:border-primary/50 hover:bg-accent/30"
        }`}
      >
        <Upload className={`h-8 w-8 ${dragging ? "text-primary" : "text-muted-foreground"}`} />
        <p className="mt-3 text-sm font-semibold">
          {isParsing
            ? "Processando arquivo..."
            : dragging
              ? "Solte o arquivo aqui"
              : "Arraste um arquivo ou clique para selecionar"}
        </p>
        {isParsing && (
          <div className="mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-muted">
            <div className="h-full animate-pulse rounded-full bg-primary" style={{ width: "70%" }} />
          </div>
        )}
        <p className="mt-1 text-xs text-muted-foreground">CSV, TSV, OFX, QFX, XLSX, XLS</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.ofx,.qfx,.xlsx,.xls,.txt"
          onChange={onFileUpload}
          disabled={!accountId}
          className="hidden"
        />
        {!accountId && <p className="mt-2 text-xs text-terracotta">Selecione uma conta primeiro.</p>}
      </div>

      {/* Não tem um extrato? */}
      <div className="rounded-lg border bg-muted/30 px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Não tem um extrato?</p>
            <p className="text-xs text-muted-foreground">Baixe nosso template e preencha manualmente.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => downloadImportTemplate("standard")}
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
            >
              <Download className="h-3.5 w-3.5" />
              Transações
            </button>
            <button
              type="button"
              onClick={() => downloadImportTemplate("card")}
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
            >
              <Download className="h-3.5 w-3.5" />
              Fatura cartão
            </button>
          </div>
        </div>
      </div>

      {/* Dicas importantes */}
      <div className="rounded-lg border border-primary/20 bg-primary/5">
        <button
          type="button"
          onClick={() => setTipsOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-primary">
            <Info className="h-4 w-4 flex-shrink-0" />
            Dicas para uma importação sem erros
          </span>
          {tipsOpen
            ? <ChevronUp className="h-4 w-4 text-primary/60 flex-shrink-0" />
            : <ChevronDown className="h-4 w-4 text-primary/60 flex-shrink-0" />
          }
        </button>
        {tipsOpen && (
          <ul className="border-t border-primary/10 px-4 pb-4 pt-3 space-y-2 text-xs text-muted-foreground">
            <li className="flex gap-2">
              <span className="mt-0.5 text-primary">•</span>
              <span><strong className="text-foreground">Formato de data:</strong> DD/MM/AAAA ou YYYY-MM-DD. Formatos mistos causam erros de leitura.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-primary">•</span>
              <span><strong className="text-foreground">Valores numéricos:</strong> use vírgula como separador decimal (ex: 1.234,56). Símbolos de moeda são ignorados automaticamente.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-primary">•</span>
              <span><strong className="text-foreground">CSV com colunas mínimas:</strong> data, descrição e valor. O Oniefy mapeia as colunas automaticamente e permite ajuste manual.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-primary">•</span>
              <span><strong className="text-foreground">OFX e QFX:</strong> exportados direto do internet banking — não precisam de mapeamento. Taxas de sucesso próximas de 100%.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-primary">•</span>
              <span><strong className="text-foreground">Duplicatas:</strong> o Oniefy detecta e descarta automaticamente transações já importadas pelo mesmo extrato.</span>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
