"use client";

/**
 * AttentionQueue - UX-H1-06 (Seção 2)
 *
 * Fila de atenção com até 5 pendências priorizadas:
 * 1. Transações sem categoria (uncategorized)
 * 2. Orçamento pressionado (>80% usado)
 * 3. Transações vencidas (overdue)
 * 4. Contas a vencer em 3 dias
 * 5. Saldo desatualizado (account não atualizada há 7+ dias)
 *
 * Tudo client-side, sem nova migration.
 */

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Tag,
  PieChart,
  AlertTriangle,
  Clock,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { BudgetVsActualResult } from "@/lib/hooks/use-dashboard";

interface AttentionItem {
  id: string;
  icon: LucideIcon;
  label: string;
  detail: string;
  href: string;
  urgency: "high" | "medium" | "low";
}

interface AttentionQueueProps {
  budgetData?: BudgetVsActualResult;
}

function useAttentionItems() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["dashboard", "attention-queue"],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<{
      uncategorized: number;
      overdue: number;
      dueSoon: number;
      staleAccounts: number;
      recentImportCount: number;
      lastTransactionDaysAgo: number | undefined;
    }> => {
      // Parallel queries for efficiency
      const today = new Date().toISOString().slice(0, 10);
      const threeDaysFromNow = new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .slice(0, 10);
      const sevenDaysAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      const [uncatRes, overdueRes, dueSoonRes, staleRes, importRes, lastTxRes] =
        await Promise.all([
          // Uncategorized transactions
          supabase
            .from("transactions")
            .select("id", { count: "exact", head: true })
            .is("category_id", null)
            .eq("is_deleted", false),
          // Overdue (unpaid, past due)
          supabase
            .from("transactions")
            .select("id", { count: "exact", head: true })
            .eq("is_paid", false)
            .eq("is_deleted", false)
            .lt("date", today),
          // Due within 3 days (unpaid, future)
          supabase
            .from("transactions")
            .select("id", { count: "exact", head: true })
            .eq("is_paid", false)
            .eq("is_deleted", false)
            .gte("date", today)
            .lte("date", threeDaysFromNow),
          // Stale accounts (not updated in 7+ days)
          supabase
            .from("accounts")
            .select("id", { count: "exact", head: true })
            .eq("is_active", true)
            .lt("updated_at", sevenDaysAgo),
          // Recent imports (last 24h, source=csv_import or ofx_import)
          supabase
            .from("transactions")
            .select("id", { count: "exact", head: true })
            .in("source", ["csv_import", "ofx_import"])
            .eq("is_deleted", false)
            .gte(
              "created_at",
              new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            ),
          // Last transaction date (for inactivity check)
          supabase
            .from("transactions")
            .select("created_at")
            .eq("is_deleted", false)
            .order("created_at", { ascending: false })
            .limit(1),
        ]);

      // Calculate days since last transaction
      let lastTransactionDaysAgo: number | undefined;
      if (lastTxRes.data && lastTxRes.data.length > 0) {
        const lastDate = new Date(lastTxRes.data[0].created_at);
        const diffMs = Date.now() - lastDate.getTime();
        lastTransactionDaysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }

      return {
        uncategorized: uncatRes.count ?? 0,
        overdue: overdueRes.count ?? 0,
        dueSoon: dueSoonRes.count ?? 0,
        staleAccounts: staleRes.count ?? 0,
        recentImportCount: importRes.count ?? 0,
        lastTransactionDaysAgo,
      };
    },
  });
}

export function AttentionQueue({ budgetData }: AttentionQueueProps) {
  const { data, isLoading } = useAttentionItems();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const items: AttentionItem[] = [];

  // 1. Overdue transactions (highest priority)
  if (data && data.overdue > 0) {
    items.push({
      id: "overdue",
      icon: AlertTriangle,
      label: `${data.overdue} transaç${data.overdue > 1 ? "ões vencidas" : "ão vencida"}`,
      detail: "Pagamentos em atraso precisam de atenção",
      href: "/transactions?status=overdue",
      urgency: "high",
    });
  }

  // 2. Uncategorized transactions
  if (data && data.uncategorized > 0) {
    items.push({
      id: "uncategorized",
      icon: Tag,
      label: `${data.uncategorized} sem categoria`,
      detail: "Categorize para ter relatórios precisos",
      href: "/transactions",
      urgency: "medium",
    });
  }

  // 3. Budget pressured (>80%)
  if (budgetData && budgetData.pct_used > 80 && budgetData.budget_count > 0) {
    const pct = Math.round(budgetData.pct_used);
    items.push({
      id: "budget",
      icon: PieChart,
      label: `Orçamento a ${pct}%`,
      detail:
        pct >= 100
          ? "Limite do mês ultrapassado"
          : "Atenção ao restante do mês",
      href: "/budgets",
      urgency: pct >= 100 ? "high" : "medium",
    });
  }

  // 4. Due soon (3 days)
  if (data && data.dueSoon > 0) {
    items.push({
      id: "due-soon",
      icon: Clock,
      label: `${data.dueSoon} vencendo em 3 dias`,
      detail: "Pagamentos próximos do vencimento",
      href: "/transactions?status=pending",
      urgency: "medium",
    });
  }

  // 5. Stale accounts
  if (data && data.staleAccounts > 0) {
    items.push({
      id: "stale",
      icon: RefreshCw,
      label: `${data.staleAccounts} conta${data.staleAccounts > 1 ? "s" : ""} desatualizada${data.staleAccounts > 1 ? "s" : ""}`,
      detail: "Saldo não atualizado há mais de 7 dias",
      href: "/accounts",
      urgency: "low",
    });
  }

  // Cap at 5
  const visible = items.slice(0, 5);

  if (visible.length === 0) return null;

  return (
    <div className="space-y-1">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Pendências
      </h3>
      {visible.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-accent/50"
        >
          <div
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${
              item.urgency === "high"
                ? "bg-terracotta/10 text-terracotta"
                : item.urgency === "medium"
                  ? "bg-burnished/10 text-burnished"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.detail}</p>
          </div>
          <svg
            className="h-4 w-4 flex-shrink-0 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      ))}
    </div>
  );
}

/** Expose attention data for NarrativeCard */
export { useAttentionItems };
