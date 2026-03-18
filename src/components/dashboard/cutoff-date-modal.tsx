"use client";

/**
 * CutoffDateModal - Step 1 do Setup Journey
 *
 * Permite ao usuário escolher a data de corte a partir da qual
 * toda a base financeira será organizada no Oniefy.
 */

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { useSetCutoffDate, useAdvanceStep } from "@/lib/hooks/use-setup-journey";
import { toast } from "sonner";
import FocusTrap from "focus-trap-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SUGGESTIONS = [
  {
    label: "1º do mês atual",
    fn: () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    },
  },
  {
    label: "1º de janeiro deste ano",
    fn: () => `${new Date().getFullYear()}-01-01`,
  },
  {
    label: "1º de janeiro do ano passado",
    fn: () => `${new Date().getFullYear() - 1}-01-01`,
  },
];

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function CutoffDateModal({ open, onClose }: Props) {
  const [date, setDate] = useState(() => SUGGESTIONS[0].fn());
  const setCutoff = useSetCutoffDate();
  const advanceStep = useAdvanceStep();
  const loading = setCutoff.isPending || advanceStep.isPending;

  async function handleConfirm() {
    if (!date) return;
    try {
      await setCutoff.mutateAsync(date);
      await advanceStep.mutateAsync({
        stepKey: "cutoff_date",
        metadata: { cutoff_date: date },
      });
      toast.success(`Data de corte definida: ${formatDateBR(date)}`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar data de corte.");
    }
  }

  if (!open) return null;

  return (
    <FocusTrap focusTrapOptions={{ escapeDeactivates: false }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative z-10 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Definir data de corte</h2>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            A data de corte é o ponto de partida da sua organização financeira no Oniefy.
            Todos os extratos e faturas que você importar devem ser a partir dessa data.
          </p>

          <div className="mt-4 space-y-3">
            <label htmlFor="cutoff-date" className="text-sm font-medium">
              Data de corte
            </label>
            <input
              id="cutoff-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoFocus
            />

            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setDate(s.fn())}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    date === s.fn()
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-accent"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Recomendação: escolha o 1º dia de um mês. Isso facilita a conciliação
              dos extratos e o fechamento mensal.
            </p>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || !date}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
}
