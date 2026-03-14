import { useState, useCallback, useRef } from "react";
import { Upload } from "lucide-react";
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
}: Props) {
  const [dragging, setDragging] = useState(false);
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
          {dragging ? "Solte o arquivo aqui" : "Arraste um arquivo ou clique para selecionar"}
        </p>
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
    </div>
  );
}
