"use client";

import { toast } from "sonner";

import { useState } from "react";
import { Wallet, Archive } from "lucide-react";
import {
  useAccounts,
  useDeactivateAccount,
  ACCOUNT_TYPE_LABELS,
} from "@/lib/hooks/use-accounts";
import { useAutoReset } from "@/lib/hooks/use-dialog-helpers";
import { AccountForm } from "@/components/accounts/account-form";
import { formatCurrency } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";
import type { Database } from "@/types/database";

type Account = Database["public"]["Tables"]["accounts"]["Row"];

export default function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts();
  const deactivate = useDeactivateAccount();

  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useAutoReset(confirmDelete, setConfirmDelete);

  // ─── Totals ───────────────────────────────────────────────
  const totals = accounts?.reduce(
    (acc, a) => {
      if (a.type === "credit_card") {
        acc.debt += a.current_balance;
      } else {
        acc.current += a.current_balance;
        acc.projected += a.projected_balance;
      }
      return acc;
    },
    { current: 0, projected: 0, debt: 0 }
  ) ?? { current: 0, projected: 0, debt: 0 };

  function handleEdit(account: Account) {
    setEditingAccount(account);
    setFormOpen(true);
  }

  function handleNew() {
    setEditingAccount(null);
    setFormOpen(true);
  }

  async function handleDeactivate(id: string) {
    await deactivate.mutateAsync(id);
    toast.success("Conta desativada.");
    setConfirmDelete(null);
  }

  // ─── Loading ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Contas</h1>
        <button type="button"
          onClick={handleNew}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + Nova conta
        </button>
      </div>

      {/* Search */}
      {accounts && accounts.length > 3 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar conta por nome"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}

      {/* Summary cards */}
      {accounts && accounts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Saldo atual</p>
            <p className={`mt-1 text-xl font-semibold ${totals.current >= 0 ? "text-verdant" : "text-terracotta"}`}>
              <Mv>{totals.current >= 0 ? "+" : ""}{formatCurrency(totals.current)}</Mv>
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Saldo previsto</p>
            <p className="mt-1 text-xl font-semibold">
              <Mv>{formatCurrency(totals.projected)}</Mv>
            </p>
            <p className="text-xs text-muted-foreground">
              inclui pendentes
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Dívida (cartões)</p>
            <p className="mt-1 text-xl font-semibold text-terracotta">
              <Mv>-{formatCurrency(totals.debt)}</Mv>
            </p>
          </div>
        </div>
      )}

      {/* Empty state (UX-H1-03) */}
      {accounts && accounts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Wallet className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Adicione suas contas e cartões</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Cadastre suas contas bancárias, cartões de crédito e investimentos para ver saldos consolidados em tempo real. A maioria dos usuários começa com conta corrente + cartão.
          </p>
          <button type="button"
            onClick={handleNew}
            className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            + Adicionar conta
          </button>
        </div>
      )}

      {/* Account list */}
      {accounts && accounts.length > 0 && (() => {
        const filtered = search
          ? accounts.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
          : accounts;
        return (
        <div className="space-y-3">
          {filtered.map((account) => (
            <div
              key={account.id}
              className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
            >
              {/* Color dot */}
              <div
                className="h-10 w-10 flex-shrink-0 rounded-full"
                style={{ backgroundColor: account.color || "#241E29" }}
              />

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{account.name}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{ACCOUNT_TYPE_LABELS[account.type]}</span>
                  {(() => {
                    const days = Math.floor(
                      (Date.now() - new Date(account.updated_at).getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    if (days >= 7)
                      return (
                        <span className="rounded bg-burnished/10 px-1 py-0.5 text-[9px] font-medium text-burnished">
                          {days}d sem atualização
                        </span>
                      );
                    return null;
                  })()}
                </div>
              </div>

              {/* Balances */}
              <div className="text-right">
                <p
                  className={`font-semibold ${
                    account.type === "credit_card"
                      ? account.current_balance > 0
                        ? "text-terracotta"
                        : ""
                      : account.current_balance >= 0
                        ? "text-verdant"
                        : "text-terracotta"
                  }`}
                >
                  <Mv>{account.current_balance > 0 && account.type !== "credit_card" ? "+" : ""}{formatCurrency(account.current_balance)}</Mv>
                </p>
                {account.current_balance !== account.projected_balance && (
                  <p className="text-xs text-muted-foreground">
                    Previsto: <Mv>{formatCurrency(account.projected_balance)}</Mv>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                <button type="button"
                  onClick={() => handleEdit(account)}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title="Editar" aria-label="Editar"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                {confirmDelete === account.id ? (
                  <div className="flex items-center gap-1">
                    <button type="button"
                      onClick={() => handleDeactivate(account.id)}
                      disabled={deactivate.isPending}
                      className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground"
                    >
                      Confirmar
                    </button>
                    <button type="button"
                      onClick={() => setConfirmDelete(null)}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <button type="button"
                    onClick={() => setConfirmDelete(account.id)}
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Desativar" aria-label="Desativar"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        );
      })()}

      {/* Form dialog */}
      <AccountForm
        account={editingAccount}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingAccount(null);
        }}
      />
    </div>
  );
}
