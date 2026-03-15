import { CircleCheck, Link, AlertCircle, ArrowRight } from "lucide-react";

interface Props {
  imported?: number;
  skipped?: number;
  categorized?: number;
  matched?: number;
  onReset: () => void;
}

/**
 * ImportStepResult (UX-H1-05)
 *
 * Enhanced post-import summary with:
 * - Total imported with celebration
 * - Auto-categorized vs. pending review count
 * - Reconciliation matches
 * - Actionable CTAs: review uncategorized, view transactions, import another
 */
export function ImportStepResult({ imported = 0, skipped = 0, categorized = 0, matched = 0, onReset }: Props) {
  const uncategorized = Math.max(0, imported - categorized);
  const hasUncategorized = uncategorized > 0;

  return (
    <div className="rounded-lg border bg-card">
      {/* Success header */}
      <div className="flex flex-col items-center border-b px-6 py-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-verdant/15">
          <CircleCheck className="h-8 w-8 text-verdant" />
        </div>
        <h2 className="text-xl font-bold">Importação concluída</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {imported} {imported === 1 ? "transação importada" : "transações importadas"} com sucesso.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-px border-b bg-border sm:grid-cols-4">
        <div className="flex flex-col items-center bg-card px-4 py-4">
          <span className="text-2xl font-bold tabular-nums text-verdant">{imported}</span>
          <span className="mt-0.5 text-xs text-muted-foreground">Importadas</span>
        </div>
        <div className="flex flex-col items-center bg-card px-4 py-4">
          <span className="text-2xl font-bold tabular-nums">{categorized}</span>
          <span className="mt-0.5 text-xs text-muted-foreground">Categorizadas</span>
        </div>
        <div className="flex flex-col items-center bg-card px-4 py-4">
          <span className={`text-2xl font-bold tabular-nums ${hasUncategorized ? "text-burnished" : "text-verdant"}`}>{uncategorized}</span>
          <span className="mt-0.5 text-xs text-muted-foreground">Para revisar</span>
        </div>
        <div className="flex flex-col items-center bg-card px-4 py-4">
          <span className="text-2xl font-bold tabular-nums text-info-slate">{matched}</span>
          <span className="mt-0.5 text-xs text-muted-foreground">Conciliadas</span>
        </div>
      </div>

      {/* Alerts and info */}
      <div className="space-y-3 px-6 py-5">
        {skipped > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-burnished/10 px-3 py-2.5 text-sm text-burnished">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{skipped} {skipped === 1 ? "duplicada ignorada" : "duplicadas ignoradas"} (já existiam no sistema).</span>
          </div>
        )}
        {matched > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-info-slate/10 px-3 py-2.5 text-sm text-info-slate">
            <Link className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{matched} {matched === 1 ? "transação conciliada" : "transações conciliadas"} automaticamente com pendentes existentes.</span>
          </div>
        )}
        {hasUncategorized && (
          <div className="flex items-start gap-2 rounded-lg bg-burnished/10 px-3 py-2.5 text-sm text-burnished">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{uncategorized} {uncategorized === 1 ? "transação precisa" : "transações precisam"} de categorização manual. Revise na lista de transações.</span>
          </div>
        )}
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-3 border-t px-6 py-5">
        <a
          href="/transactions"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Ver transações
          <ArrowRight className="h-4 w-4" />
        </a>
        <button
          onClick={onReset}
          className="rounded-md border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
        >
          Importar outro arquivo
        </button>
      </div>
    </div>
  );
}
