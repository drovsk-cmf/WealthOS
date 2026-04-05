"use client";

import { toast } from "sonner";

import { useState } from "react";
import Link from "next/link";
import { Wallet, Archive, CreditCard } from "lucide-react";
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
type AccountType = Database["public"]["Enums"]["account_type"];

export default function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts();
  const deactivate = useDeactivateAccount();

  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useAutoReset(confirmDelete, setConfirmDelete);

  // ─── Totals (credit cards excluded — see /cards) ─────────
  const nonCardAccounts = accounts?.filter((a) => a.type !== "credit_card") ?? [];
  const totals = nonCardAccounts.reduce(
    (acc, a) => {
      acc.current += a.current_balance;
      acc.projected += a.projected_balance;
      return acc;
    },
    { current: 0, projected: 0 }
  );

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
      <div className="space-y-4">
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
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Contas Bancárias</h1>
        <button type="button"
          onClick={handleNew}
          className="shrink-0 whitespace-nowrap rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground"
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
          <Link href="/cards" className="group rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Cartões de crédito</p>
            </div>
            <p className="mt-1 text-sm font-medium text-primary group-hover:underline">
              Gerenciar cartões →
            </p>
          </Link>
        </div>
      )}

      {/* Empty state (UX-H1-03) */}
      {accounts && accounts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Wallet className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Adicione suas contas</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Cadastre suas contas bancárias e investimentos para ver saldos consolidados. Para cartões de crédito, use a página dedicada.
          </p>
          <div className="mt-5 flex gap-3">
            <button type="button"
              onClick={handleNew}
              className="rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              + Adicionar conta
            </button>
            <Link href="/cards" className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
              Cadastrar cartão
            </Link>
          </div>
        </div>
      )}

      {/* Account list — grouped by type (FIX #7, E17: cards moved to /cards) */}
      {accounts && accounts.length > 0 && (() => {
        const nonCards = accounts.filter((a) => a.type !== "credit_card");
        const filtered = search
          ? nonCards.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
          : nonCards;

        const groups: { key: string; label: string; types: AccountType[]; accounts: Account[] }[] = [
          { key: "banking", label: "Contas Bancárias", types: ["checking" as AccountType, "savings" as AccountType, "cash" as AccountType], accounts: [] },
          { key: "investments", label: "Investimentos", types: ["investment" as AccountType], accounts: [] },
          { key: "debts", label: "Empréstimos e Financiamentos", types: ["loan" as AccountType, "financing" as AccountType], accounts: [] },
        ];

        for (const a of filtered) {
          const group = groups.find((g) => g.types.includes(a.type as AccountType));
          if (group) group.accounts.push(a);
        }

        return (
        <div className="space-y-6">
          {groups.filter((g) => g.accounts.length > 0).map((group) => (
            <div key={group.key} className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{group.label}</h2>
              {group.accounts.map((account) => (
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
                  {account.currency && account.currency !== "BRL" && (
                    <span className="rounded bg-primary/10 px-1 py-0.5 text-[9px] font-medium text-primary">
                      {account.currency}
                    </span>
                  )}
                  {(() => {
                    const days = Math.floor(
                      (Date.now() - new Date(account.updated_at).getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    const hasDivergence =
                      Math.abs(account.current_balance - account.projected_balance) >
                      Math.max(Math.abs(account.current_balance) * 0.01, 1);

                    if (days < 7 && !hasDivergence)
                      return (
                        <span className="rounded bg-verdant/10 px-1 py-0.5 text-[9px] font-medium text-verdant">
                          Conferido
                        </span>
                      );
                    if (hasDivergence)
                      return (
                        <span className="rounded bg-burnished/10 px-1 py-0.5 text-[9px] font-medium text-burnished">
                          Divergência
                        </span>
                      );
                    if (days >= 30)
                      return (
                        <span className="rounded bg-terracotta/10 px-1 py-0.5 text-[9px] font-medium text-terracotta">
                          {days}d sem atualização
                        </span>
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
                    account.current_balance >= 0
                      ? "text-verdant"
                      : "text-terracotta"
                  }`}
                >
                  <Mv>{account.current_balance > 0 ? "+" : ""}{formatCurrency(account.current_balance)}</Mv>
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
