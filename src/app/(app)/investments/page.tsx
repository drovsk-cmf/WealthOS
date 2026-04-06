"use client";

import { toast } from "sonner";
import { useState } from "react";
import { TrendingUp, Archive } from "lucide-react";
import {
  useAccounts,
  useDeactivateAccount,
} from "@/lib/hooks/use-accounts";
import { useAutoReset } from "@/lib/hooks/use-dialog-helpers";
import { AccountForm } from "@/components/accounts/account-form";
import { formatCurrency } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";
import type { Database } from "@/types/database";

type Account = Database["public"]["Tables"]["accounts"]["Row"];

export default function InvestmentsPage() {
  const { data: accounts, isLoading } = useAccounts();
  const deactivate = useDeactivateAccount();

  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useAutoReset(confirmDelete, setConfirmDelete);

  const investments = accounts?.filter((a) => a.type === "investment") ?? [];
  const totalInvested = investments.reduce((sum, a) => sum + a.current_balance, 0);

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
    toast.success("Removido.");
    setConfirmDelete(null);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        {[1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Investimentos</h1>
          <p className="text-sm text-muted-foreground">
            Ativos financeiros e aplicações
          </p>
        </div>
        <button type="button" onClick={handleNew}
          className="rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground">
          + Novo investimento
        </button>
      </div>

      {/* Total */}
      {investments.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total investido</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-verdant">
            <Mv>{formatCurrency(totalInvested)}</Mv>
          </p>
        </div>
      )}

      {/* List */}
      {investments.length > 0 ? (
        <div className="space-y-3">
          {investments.map((account) => (
            <div key={account.id}
              className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
              <div className="h-10 w-10 flex-shrink-0 rounded-full"
                style={{ backgroundColor: account.color || "#241E29" }} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{account.name}</p>
                <p className="text-xs text-muted-foreground">Investimento</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-verdant">
                  <Mv>{formatCurrency(account.current_balance)}</Mv>
                </p>
                {account.current_balance !== account.projected_balance && (
                  <p className="text-xs text-muted-foreground">
                    Previsto: <Mv>{formatCurrency(account.projected_balance)}</Mv>
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => handleEdit(account)}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title="Editar" aria-label="Editar">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                {confirmDelete === account.id ? (
                  <button type="button" onClick={() => handleDeactivate(account.id)}
                    className="rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                    Confirmar
                  </button>
                ) : (
                  <button type="button" onClick={() => setConfirmDelete(account.id)}
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Remover" aria-label="Remover">
                    <Archive className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <TrendingUp className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Nenhum investimento cadastrado</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Registre suas aplicações financeiras (renda fixa, ações, fundos, cripto) para acompanhar o patrimônio investido e a evolução dos rendimentos.
          </p>
          <button type="button" onClick={handleNew}
            className="mt-5 rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground">
            + Cadastrar investimento
          </button>
        </div>
      )}

      {/* Form */}
      <AccountForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingAccount(null); }}
        account={editingAccount}
        defaultType="investment"
      />
    </div>
  );
}
