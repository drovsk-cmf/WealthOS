"use client";

/**
 * UpcomingBillsCard - DASH-04
 *
 * Próximas contas a vencer: transações pendentes (is_paid=false)
 * ordenadas por data, limite 5.
 * Queried diretamente (sem RPC dedicada).
 */

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";

interface UpcomingBill {
  id: string;
  description: string | null;
  amount: number;
  date: string;
  type: string;
  account_name: string | null;
  category_name: string | null;
}

function useUpcomingBills(limit: number = 5) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["dashboard", "upcoming-bills", limit],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<UpcomingBill[]> => {
      const { data, error } = await supabase
        .from("transactions")
        .select(
          `
          id, description, amount, date, type,
          accounts!inner(name),
          categories(name)
        `
        )
        .eq("is_paid", false)
        .eq("is_deleted", false)
        .gte("date", new Date().toISOString().slice(0, 10))
        .order("date", { ascending: true })
        .limit(limit);

      if (error) throw error;

      return (data ?? []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        description: row.description as string | null,
        amount: row.amount as number,
        date: row.date as string,
        type: row.type as string,
        account_name: (row.accounts as Record<string, unknown>)?.name as string | null ?? null,
        category_name: (row.categories as Record<string, unknown>)?.name as string | null ?? null,
      }));
    },
  });
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T12:00:00");
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): string {
  if (days <= 0) return "text-terracotta bg-terracotta/10";
  if (days <= 3) return "text-burnished bg-burnished/10";
  if (days <= 7) return "text-burnished bg-burnished/10";
  return "text-muted-foreground bg-muted";
}

function urgencyLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d atrasado`;
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";
  return `${days}d`;
}

export function UpcomingBillsCard() {
  const { data: bills, isLoading } = useUpcomingBills();

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="h-4 w-44 animate-pulse rounded bg-muted" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Próximas a Vencer</h3>
        <Link
          href="/transactions?paid=false"
          className="text-xs text-primary hover:underline"
        >
          Ver todas
        </Link>
      </div>

      {(!bills || bills.length === 0) ? (
        <div className="mt-6 text-center">
          <p className="text-2xl">✓</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nenhuma conta pendente
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {bills.map((bill) => {
            const days = daysUntil(bill.date);
            return (
              <div
                key={bill.id}
                className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/50"
              >
                <span
                  className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${urgencyColor(days)}`}
                >
                  {urgencyLabel(days)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {bill.description || bill.category_name || "Sem descrição"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDate(bill.date)} · {bill.account_name}
                  </p>
                </div>
                <span className="flex-shrink-0 text-sm font-semibold tabular-nums text-terracotta">
                  {formatCurrency(bill.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
