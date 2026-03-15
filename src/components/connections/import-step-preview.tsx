import { formatCurrency } from "@/lib/utils";
import type { CSVTransaction } from "@/lib/parsers/csv-parser";
import type { OFXTransaction } from "@/lib/parsers/ofx-parser";

interface Props {
  transactions: (CSVTransaction | OFXTransaction)[];
  selected: Set<number>;
  parseErrors: string[];
  isImporting: boolean;
  onBack: () => void;
  onToggleAll: () => void;
  onToggleSelect: (index: number) => void;
  onImport: () => void;
}

export function ImportStepPreview({
  transactions,
  selected,
  parseErrors,
  isImporting,
  onBack,
  onToggleAll,
  onToggleSelect,
  onImport,
}: Props) {
  const incomeTotal = transactions
    .filter((_, i) => selected.has(i) && transactions[i].type === "income")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const expenseTotal = transactions
    .filter((_, i) => selected.has(i) && transactions[i].type === "expense")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Preview ({selected.size}/{transactions.length} selecionadas)
        </h2>
        <button type="button" onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
          Voltar
        </button>
      </div>

      {parseErrors.length > 0 && (
        <div className="rounded-lg border border-burnished/20 bg-burnished/10 p-3">
          <p className="text-xs font-semibold text-burnished">{parseErrors.length} aviso(s):</p>
          {parseErrors.slice(0, 5).map((e, i) => (
            <p key={i} className="text-xs text-burnished">
              {e}
            </p>
          ))}
          {parseErrors.length > 5 && (
            <p className="text-xs text-burnished">e mais {parseErrors.length - 5}</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={selected.size === transactions.length}
          onChange={onToggleAll}
          className="h-4 w-4 rounded border-input"
        />
        <span className="text-xs text-muted-foreground">Selecionar todas</span>
      </div>

      <div className="max-h-96 space-y-1 overflow-y-auto rounded-lg border bg-card">
        {transactions.map((tx, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-2 text-sm ${selected.has(i) ? "" : "opacity-40"}`}>
            <input
              type="checkbox"
              checked={selected.has(i)}
              onChange={() => onToggleSelect(i)}
              className="h-4 w-4 rounded border-input"
            />
            <span className="w-24 flex-shrink-0 tabular-nums text-muted-foreground">{tx.date}</span>
            <span className="min-w-0 flex-1 truncate">{tx.description}</span>
            <span
              className={`w-28 flex-shrink-0 text-right tabular-nums font-medium ${
                tx.type === "income" ? "text-verdant" : "text-terracotta"
              }`}
            >
              {tx.type === "income" ? "+" : "-"}
              {formatCurrency(Math.abs(tx.amount))}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 text-sm">
        <div>
          <span className="text-verdant tabular-nums">+{formatCurrency(incomeTotal)}</span>
          {" / "}
          <span className="text-terracotta tabular-nums">-{formatCurrency(expenseTotal)}</span>
        </div>
        <span className="text-xs text-muted-foreground">{selected.size} transações</span>
      </div>

      <button type="button"
        onClick={onImport}
        disabled={selected.size === 0 || isImporting}
        className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isImporting ? "Importando" : `Importar ${selected.size} transações`}
      </button>
    </div>
  );
}
