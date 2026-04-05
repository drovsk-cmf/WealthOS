"use client";

import { useState, useMemo } from "react";
import { Plus, CreditCard, Pencil } from "lucide-react";
import { useAccounts, useDeactivateAccount } from "@/lib/hooks/use-accounts";
import { useBankInstitutions } from "@/lib/hooks/use-bank-institutions";
import { formatCurrency } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";
import { OnieLoader } from "@/components/ui/onie-loader";
import { CardForm } from "@/components/cards/card-form";
import type { Database } from "@/types/database";

type Account = Database["public"]["Tables"]["accounts"]["Row"];

/**
 * Dedicated credit card page (E17 — NAVIGATION-SPEC.md Tab 2: Movimentações).
 * Shows only type='credit_card' accounts with card-specific UX:
 * limit utilization, closing/due dates, dedicated form.
 */
export default function CardsPage() {
  const { data: allAccounts, isLoading, error } = useAccounts();
  const { data: banks } = useBankInstitutions();
  const deactivate = useDeactivateAccount();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const cards = useMemo(
    () => (allAccounts ?? []).filter((a) => a.type === "credit_card"),
    [allAccounts]
  );

  const totalDebt = useMemo(
    () => cards.reduce((sum, c) => sum + Math.abs(c.current_balance), 0),
    [cards]
  );
  const totalLimit = useMemo(
    () =>
      cards.reduce(
        (sum, c) => sum + (c.credit_limit ? Number(c.credit_limit) : 0),
        0
      ),
    [cards]
  );

  function getBankName(bankId: string | null): string {
    if (!bankId || !banks) return "";
    const b = banks.find((b) => b.id === bankId);
    return b ? b.short_name : "";
  }

  function utilization(balance: number, limit: number | null): number | null {
    if (!limit || limit <= 0) return null;
    return (Math.abs(balance) / limit) * 100;
  }

  function utilizationColor(pct: number | null): string {
    if (pct === null) return "text-muted-foreground";
    if (pct <= 30) return "text-verdant";
    if (pct <= 70) return "text-burnished";
    return "text-terracotta";
  }

  function handleEdit(card: Account) {
    setEditing(card);
    setFormOpen(true);
  }

  function handleNew() {
    setEditing(null);
    setFormOpen(true);
  }

  async function _handleDeactivate(card: Account) {
    if (!confirm(`Desativar o cartão "${card.name}"?`)) return;
    try {
      await deactivate.mutateAsync(card.id);
    } catch {
      // error handled by hook
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <OnieLoader size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
        Erro ao carregar cartões. Tente recarregar a página.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cartões de Crédito</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus cartões, limites e vencimentos.
          </p>
        </div>
        <button
          type="button"
          onClick={handleNew}
          className="flex items-center gap-2 rounded-lg btn-cta px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Novo cartão
        </button>
      </div>

      {/* Summary */}
      {cards.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Fatura total</p>
            <p className="mt-1 text-xl font-bold text-terracotta">
              <Mv>{formatCurrency(totalDebt)}</Mv>
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Limite total</p>
            <p className="mt-1 text-xl font-bold">
              <Mv>{formatCurrency(totalLimit)}</Mv>
            </p>
          </div>
          {totalLimit > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">Uso do limite</p>
              <p
                className={`mt-1 text-xl font-bold ${utilizationColor(
                  (totalDebt / totalLimit) * 100
                )}`}
              >
                <Mv>{((totalDebt / totalLimit) * 100).toFixed(1)}%</Mv>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Card list */}
      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <CreditCard className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-sm font-medium">Nenhum cartão cadastrado</h3>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Cadastre seus cartões de crédito para acompanhar faturas,
            vencimentos e uso do limite.
          </p>
          <button
            type="button"
            onClick={handleNew}
            className="mt-4 rounded-lg btn-cta px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Cadastrar primeiro cartão
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => {
            const debt = Math.abs(card.current_balance);
            const limit = card.credit_limit ? Number(card.credit_limit) : null;
            const pct = utilization(card.current_balance, limit);
            const bankName = getBankName(card.bank_institution_id);

            return (
              <div
                key={card.id}
                className="group flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
              >
                {/* Color dot */}
                <div
                  className="h-10 w-10 shrink-0 rounded-lg"
                  style={{ backgroundColor: card.color || "#6B7280" }}
                />

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{card.name}</p>
                    {bankName && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {bankName}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    {card.closing_day && (
                      <span>Fecha dia {card.closing_day}</span>
                    )}
                    {card.due_day && (
                      <span>Vence dia {card.due_day}</span>
                    )}
                    {limit && (
                      <span>
                        Limite: <Mv>{formatCurrency(limit)}</Mv>
                      </span>
                    )}
                  </div>
                </div>

                {/* Balance + utilization */}
                <div className="shrink-0 text-right">
                  <p className="font-semibold tabular-nums text-terracotta">
                    <Mv>{formatCurrency(debt)}</Mv>
                  </p>
                  {pct !== null && (
                    <p
                      className={`text-xs tabular-nums ${utilizationColor(pct)}`}
                    >
                      {pct.toFixed(0)}% do limite
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleEdit(card)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label={`Editar ${card.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form dialog */}
      <CardForm
        card={editing}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
