/**
 * useProgressiveDisclosure - UX-H3-01 + UX-H3-02
 *
 * Checks data volumes to determine which features to surface.
 * Lightweight parallel count queries, cached 5 min.
 *
 * Fiscal trigger heuristic (UX-H3-02):
 * Show "Ver impacto fiscal?" when user has >=10 income transactions.
 * Income transactions are the primary driver of IRPF complexity.
 * Full fiscal report uses COA tax_treatment, but for the trigger
 * a simple income count is sufficient and avoids a heavy join.
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface DisclosureFlags {
  showFiscalTrigger: boolean;
  incomeTransactionCount: number;
  totalTransactions: number;
  totalAccounts: number;
  totalAssets: number;
  hasBudgets: boolean;
  costCenterCount: number;
  activeWorkflowCount: number;
}

export function useProgressiveDisclosure() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["progressive-disclosure"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<DisclosureFlags> => {
      const [txRes, incomeRes, accountRes, assetRes, budgetRes, ccRes, wfRes] =
        await Promise.all([
          supabase
            .from("transactions")
            .select("id", { count: "exact", head: true })
            .eq("is_deleted", false),
          supabase
            .from("transactions")
            .select("id", { count: "exact", head: true })
            .eq("is_deleted", false)
            .eq("type", "income"),
          supabase
            .from("accounts")
            .select("id", { count: "exact", head: true })
            .eq("is_active", true),
          supabase
            .from("assets")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("budgets")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("cost_centers")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("workflows")
            .select("id", { count: "exact", head: true })
            .eq("is_active", true),
        ]);

      const incomeCount = incomeRes.count ?? 0;

      return {
        showFiscalTrigger: incomeCount >= 10,
        incomeTransactionCount: incomeCount,
        totalTransactions: txRes.count ?? 0,
        totalAccounts: accountRes.count ?? 0,
        totalAssets: assetRes.count ?? 0,
        hasBudgets: (budgetRes.count ?? 0) > 0,
        costCenterCount: ccRes.count ?? 0,
        activeWorkflowCount: wfRes.count ?? 0,
      };
    },
  });
}
