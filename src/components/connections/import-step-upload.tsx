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

export function ImportStepUpload({
  accountId,
  setAccountId,
  connectionId,
  setConnectionId,
  accounts,
  connections,
  onFileUpload,
}: Props) {
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

      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card p-12">
        <p className="mt-3 text-sm font-semibold">Arraste um arquivo ou clique para selecionar</p>
        <p className="mt-1 text-xs text-muted-foreground">Formatos: CSV, TSV, OFX, QFX, XLSX, XLS</p>
        <input
          type="file"
          accept=".csv,.tsv,.ofx,.qfx,.xlsx,.xls,.txt"
          onChange={onFileUpload}
          disabled={!accountId}
          className="mt-4 text-sm file:mr-3 file:rounded-md file:border file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground disabled:opacity-50"
        />
        {!accountId && <p className="mt-2 text-xs text-terracotta">Selecione uma conta primeiro.</p>}
      </div>
    </div>
  );
}
