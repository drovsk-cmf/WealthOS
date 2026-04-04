"use client";

/**
 * WarrantyForm - Padrão A (componente separado + modal overlay)
 *
 * Registrar garantias de produtos (create-only).
 */

import { useState } from "react";
import { toast } from "sonner";
import { useCreateWarranty } from "@/lib/hooks/use-warranties";
import FocusTrap from "focus-trap-react";

interface WarrantyFormProps {
  open: boolean;
  onClose: () => void;
}

export function WarrantyForm({ open, onClose }: WarrantyFormProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [mfgMonths, setMfgMonths] = useState("12");
  const [cardMonths, setCardMonths] = useState("0");
  const [notes, setNotes] = useState("");

  const createWarranty = useCreateWarranty();

  function reset() {
    setName(""); setDate(""); setMfgMonths("12"); setCardMonths("0"); setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !date) return;
    try {
      await createWarranty.mutateAsync({
        product_name: name.trim(),
        purchase_date: date,
        manufacturer_months: parseInt(mfgMonths) || 12,
        card_extension_months: parseInt(cardMonths) || 0,
        notes: notes.trim() || undefined,
      });
      toast.success("Garantia registrada");
      reset();
      onClose();
    } catch {
      toast.error("Erro ao salvar garantia");
    }
  }

  if (!open) return null;

  return (
    <FocusTrap focusTrapOptions={{ allowOutsideClick: true, escapeDeactivates: true, onDeactivate: () => { reset(); onClose(); } }}>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => { reset(); onClose(); }} />
      <div className="relative z-10 w-full max-w-md rounded-xl border bg-card p-6 shadow-lg mx-4">
        <h2 className="text-lg font-bold">Nova garantia</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Produto</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: MacBook Air M3" required autoFocus
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Data da compra</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Garantia fabricante (meses)</label>
              <input type="number" value={mfgMonths} onChange={(e) => setMfgMonths(e.target.value)}
                min={0} max={120}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Extensão cartão (meses)</label>
              <input type="number" value={cardMonths} onChange={(e) => setCardMonths(e.target.value)}
                min={0} max={24}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
              <p className="text-[10px] text-muted-foreground">Pagou no cartão? Consulte a bandeira.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notas (opcional)</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="NF nº, serial, etc."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { reset(); onClose(); }}
              className="rounded-md border px-4 py-2 text-sm btn-alive hover:bg-accent">
              Cancelar
            </button>
            <button type="submit" disabled={createWarranty.isPending}
              className="rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {createWarranty.isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </FocusTrap>
  );
}
