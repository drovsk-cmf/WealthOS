import { CircleCheck, Link } from "lucide-react";

interface Props {
  imported?: number;
  skipped?: number;
  categorized?: number;
  matched?: number;
  onReset: () => void;
}

export function ImportStepResult({ imported, skipped, categorized, matched, onReset }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-verdant/15">
        <CircleCheck className="h-7 w-7 text-verdant" />
      </div>
      <h2 className="text-xl font-bold">Importação concluída</h2>
      {imported !== undefined && (
        <div className="mt-4 space-y-1 text-sm">
          <p className="font-medium text-verdant">{imported} transações importadas</p>
          {(matched ?? 0) > 0 && (
            <p className="flex items-center justify-center gap-1 text-info-slate">
              <Link className="h-3.5 w-3.5" />
              {matched} conciliadas automaticamente
            </p>
          )}
          {(skipped ?? 0) > 0 && <p className="text-burnished">{skipped} duplicadas (ignoradas)</p>}
          <p className="text-muted-foreground">{categorized ?? 0} auto-categorizadas</p>
        </div>
      )}
      <button onClick={onReset} className="mt-6 rounded-md border px-6 py-2 text-sm font-medium hover:bg-accent">
        Importar outro arquivo
      </button>
    </div>
  );
}
