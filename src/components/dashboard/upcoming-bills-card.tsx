"use client";

/**
 * UpcomingBillsCard - DASH-04
 *
 * Próximas contas a vencer. Dados fornecidos por useDashboardAll
 * (seção upcoming_bills da RPC get_dashboard_all), eliminando a
 * query independente anterior (-150ms no dashboard load).
 */

import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";
import type { UpcomingBill } from "@/lib/hooks/use-dashboard";

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T12:00:00");
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): string {
  if (days <= 0) return "text-terracotta bg-terracotta/10";
  if (days <= 7) return "text-burnished bg-burnished/10";
  return "text-muted-foreground bg-muted";
}

function urgencyLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d atrasado`;
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";
  return `${days}d`;
}

interface UpcomingBillsCardProps {
  bills: UpcomingBill[];
  isLoading?: boolean;
}

export function UpcomingBillsCard({ bills, isLoading }: UpcomingBillsCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg bg-card p-5 shadow-card card-alive">
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
    <div className="rounded-lg bg-card p-5 shadow-card card-alive">
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
          <CircleCheck className="mx-auto h-6 w-6 text-muted-foreground" />
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
                  <Mv>{formatCurrency(bill.amount)}</Mv>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
