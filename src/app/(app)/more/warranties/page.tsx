"use client";

/**
 * Oniefy - Garantias (/more/warranties)
 *
 * Track product warranties (manufacturer + credit card extension).
 * Alerts before expiration.
 * Ref: E31 warranty-tracker engine + useWarranties hook
 */

import { useState } from "react";
import { toast } from "sonner";
import { Shield, Plus, Trash2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useWarranties, useCreateWarranty, useDeleteWarranty } from "@/lib/hooks/use-warranties";
import FocusTrap from "focus-trap-react";

const STATUS_CONFIG = {
  active: { label: "Ativa", icon: CheckCircle2, color: "text-verdant", bg: "bg-verdant/10" },
  expiring_soon: { label: "Expirando", icon: AlertTriangle, color: "text-burnished", bg: "bg-burnished/10" },
  expired: { label: "Expirada", icon: XCircle, color: "text-terracotta", bg: "bg-terracotta/10" },
};

export default function WarrantiesPage() {
  const { data: warranties, isLoading } = useWarranties();
  const createWarranty = useCreateWarranty();
  const deleteWarranty = useDeleteWarranty();
  const [formOpen, setFormOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [mfgMonths, setMfgMonths] = useState("12");
  const [cardMonths, setCardMonths] = useState("0");
  const [notes, setNotes] = useState("");

  function resetForm() {
    setName("");
    setDate("");
    setMfgMonths("12");
    setCardMonths("0");
    setNotes("");
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
      setFormOpen(false);
      resetForm();
    } catch {
      toast.error("Erro ao salvar garantia");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteWarranty.mutateAsync(id);
      toast.success("Garantia removida");
    } catch {
      toast.error("Erro ao remover");
    }
  }

  const active = warranties?.filter((w) => w.status.status === "active") ?? [];
  const expiring = warranties?.filter((w) => w.status.status === "expiring_soon") ?? [];
  const expired = warranties?.filter((w) => w.status.status === "expired") ?? [];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Garantias</h1>
          <p className="text-sm text-muted-foreground">
            Rastreie garantias de produtos e receba alertas antes do vencimento.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Nova
        </button>
      </div>

      {/* Expiring soon */}
      {expiring.length > 0 && (
        <Section title={`Expirando em breve (${expiring.length})`} icon={AlertTriangle} color="text-burnished">
          {expiring.map((w) => (
            <WarrantyCard key={w.id} warranty={w} onDelete={handleDelete} />
          ))}
        </Section>
      )}

      {/* Active */}
      {active.length > 0 && (
        <Section title={`Ativas (${active.length})`} icon={CheckCircle2} color="text-verdant">
          {active.map((w) => (
            <WarrantyCard key={w.id} warranty={w} onDelete={handleDelete} />
          ))}
        </Section>
      )}

      {/* Expired */}
      {expired.length > 0 && (
        <Section title={`Expiradas (${expired.length})`} icon={XCircle} color="text-muted-foreground">
          {expired.map((w) => (
            <WarrantyCard key={w.id} warranty={w} onDelete={handleDelete} />
          ))}
        </Section>
      )}

      {/* Empty state */}
      {(warranties?.length ?? 0) === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <Shield className="h-10 w-10 text-muted-foreground mb-3" />
          <h2 className="text-lg font-semibold">Nenhuma garantia registrada</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Registre garantias de produtos para receber alertas antes do vencimento.
            Cartão de crédito pode estender a garantia em até 12 meses.
          </p>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="mt-4 rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Registrar garantia
          </button>
        </div>
      )}

      {/* Form modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <FocusTrap>
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-md rounded-xl border bg-card p-6 shadow-elevated space-y-4"
            >
              <h2 className="text-lg font-semibold">Nova garantia</h2>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Produto</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: MacBook Air M3"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Data da compra</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Garantia fabricante (meses)</label>
                  <input
                    type="number"
                    value={mfgMonths}
                    onChange={(e) => setMfgMonths(e.target.value)}
                    min={0}
                    max={120}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Extensão cartão (meses)</label>
                  <input
                    type="number"
                    value={cardMonths}
                    onChange={(e) => setCardMonths(e.target.value)}
                    min={0}
                    max={24}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">Pagou no cartão? Consulte a bandeira.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Notas (opcional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="NF nº, serial, etc."
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setFormOpen(false); resetForm(); }}
                  className="rounded-md border px-4 py-2 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createWarranty.isPending}
                  className="rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {createWarranty.isPending ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </FocusTrap>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function Section({ title, icon: Icon, color, children }: {
  title: string;
  icon: typeof CheckCircle2;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <p className="text-sm font-medium">{title}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function WarrantyCard({ warranty: w, onDelete }: {
  warranty: { id: string; product_name: string; status: { status: string; daysRemaining: number; totalMonths: number; expirationDate: string; summary: string } };
  onDelete: (id: string) => void;
}) {
  const cfg = STATUS_CONFIG[w.status.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.active;
  const StatusIcon = cfg.icon;

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
      <div className={`mt-0.5 rounded-full p-1.5 ${cfg.bg}`}>
        <StatusIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{w.product_name}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {w.status.totalMonths}m total · Expira {w.status.expirationDate} ·{" "}
          {w.status.daysRemaining > 0 ? `${w.status.daysRemaining} dias restantes` : "Expirada"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDelete(w.id)}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label="Remover garantia"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
