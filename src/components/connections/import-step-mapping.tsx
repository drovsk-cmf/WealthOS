import type { CSVColumnMapping } from "@/lib/parsers/csv-parser";

interface Props {
  csvHeaders: string[];
  csvRows: string[][];
  mapping: CSVColumnMapping | null;
  setMapping: (updater: (current: CSVColumnMapping | null) => CSVColumnMapping | null) => void;
  onBack: () => void;
  onApply: () => void;
}

const FIELD_META: Record<string, { label: string; color: string; hint: string }> = {
  date: { label: "Data", color: "text-info-slate bg-info-slate/10 border-info-slate/30", hint: "Coluna com a data da transação" },
  description: { label: "Descrição", color: "text-burnished bg-burnished/10 border-burnished/30", hint: "Coluna com o nome/descrição" },
  amount: { label: "Valor", color: "text-verdant bg-verdant/10 border-verdant/30", hint: "Coluna com o valor (R$)" },
};

export function ImportStepMapping({
  csvHeaders,
  csvRows,
  mapping,
  setMapping,
  onBack,
  onApply,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Mapeamento de colunas</h2>
        <button type="button" onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
          Voltar
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        Seu arquivo tem <strong>{csvHeaders.length} colunas</strong> e <strong>{csvRows.length} linhas</strong>.
        Indique qual coluna corresponde a cada campo abaixo.
      </p>

      {/* Mapping cards */}
      <div className="space-y-3">
        {(["date", "description", "amount"] as const).map((field) => {
          const meta = FIELD_META[field];
          const selectedIdx = mapping?.[field] ?? 0;
          return (
            <div key={field} className={`rounded-lg border p-3 ${meta.color}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{meta.label}</p>
                  <p className="text-xs opacity-70">{meta.hint}</p>
                </div>
                <select
                  value={selectedIdx}
                  onChange={(e) =>
                    setMapping((m) => (m ? { ...m, [field]: parseInt(e.target.value, 10) } : null))
                  }
                  className="h-9 w-48 flex-shrink-0 rounded-md border bg-background px-2 text-sm text-foreground"
                >
                  {csvHeaders.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Coluna ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
              {/* Sample value */}
              {csvRows[0] && (
                <p className="mt-1.5 truncate rounded bg-background/50 px-2 py-1 text-xs tabular-nums">
                  Exemplo: <strong>{csvRows[0][selectedIdx] || "(vazio)"}</strong>
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Preview table with color coding */}
      {csvRows.length > 0 && (
        <div className="overflow-x-auto rounded border bg-muted/50 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Preview (3 primeiras linhas)</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                {csvHeaders.map((h, i) => {
                  let highlight = "";
                  if (i === mapping?.date) highlight = "text-info-slate font-bold";
                  else if (i === mapping?.description) highlight = "text-burnished font-bold";
                  else if (i === mapping?.amount) highlight = "text-verdant font-bold";
                  return (
                    <th scope="col" key={i} className={`px-2 py-1 text-left ${highlight}`}>
                      {h || `Col ${i + 1}`}
                      {i === mapping?.date && " ← Data"}
                      {i === mapping?.description && " ← Descrição"}
                      {i === mapping?.amount && " ← Valor"}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {csvRows.slice(0, 3).map((row, ri) => (
                <tr key={ri} className="border-b border-muted/50">
                  {row.map((cell, ci) => {
                    let highlight = "";
                    if (ci === mapping?.date) highlight = "bg-info-slate/5";
                    else if (ci === mapping?.description) highlight = "bg-burnished/5";
                    else if (ci === mapping?.amount) highlight = "bg-verdant/5";
                    return (
                      <td key={ci} className={`px-2 py-1 tabular-nums ${highlight}`}>
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button type="button"
        onClick={onApply}
        disabled={!mapping}
        className="w-full rounded-md btn-cta py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        Aplicar mapeamento e continuar
      </button>
    </div>
  );
}
