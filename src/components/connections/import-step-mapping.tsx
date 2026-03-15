import type { CSVColumnMapping } from "@/lib/parsers/csv-parser";

interface Props {
  csvHeaders: string[];
  csvRows: string[][];
  mapping: CSVColumnMapping | null;
  setMapping: (updater: (current: CSVColumnMapping | null) => CSVColumnMapping | null) => void;
  onBack: () => void;
  onApply: () => void;
}

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
              onChange={(e) =>
                setMapping((m) => (m ? { ...m, [field]: parseInt(e.target.value, 10) } : null))
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {csvHeaders.map((h, i) => (
                <option key={i} value={i}>
                  {h || `Coluna ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {csvRows.length > 0 && (
        <div className="overflow-x-auto rounded border bg-muted/50 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Preview (3 primeiras linhas)</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                {csvHeaders.map((h, i) => (
                  <th
                    key={i}
                    className={`px-2 py-1 text-left font-medium ${
                      i === mapping?.date
                        ? "text-info-slate"
                        : i === mapping?.amount
                          ? "text-verdant"
                          : i === mapping?.description
                            ? "text-burnished"
                            : ""
                    }`}
                  >
                    {h || `Col ${i + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {csvRows.slice(0, 3).map((row, ri) => (
                <tr key={ri} className="border-b border-muted/50">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-2 py-1 tabular-nums">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button type="button"
        onClick={onApply}
        disabled={!mapping}
        className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        Aplicar mapeamento e continuar
      </button>
    </div>
  );
}
