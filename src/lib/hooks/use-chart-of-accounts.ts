/**
 * WealthOS - Chart of Accounts Hooks (CTB-03, CTB-04)
 *
 * Queries chart_of_accounts with tree structure.
 * Toggle is_active for leaf accounts (depth 2).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type COA = Database["public"]["Tables"]["chart_of_accounts"]["Row"];
type GroupType = Database["public"]["Enums"]["group_type"];

export const GROUP_LABELS: Record<GroupType, { label: string; color: string }> = {
  asset: { label: "Ativo", color: "text-blue-600" },
  liability: { label: "Passivo", color: "text-red-600" },
  equity: { label: "Patrimônio Líquido", color: "text-purple-600" },
  revenue: { label: "Receitas", color: "text-green-600" },
  expense: { label: "Despesas", color: "text-orange-600" },
};

export interface COATreeNode extends COA {
  children: COATreeNode[];
}

function buildTree(accounts: COA[]): COATreeNode[] {
  const map = new Map<string, COATreeNode>();
  const roots: COATreeNode[] = [];

  // Create nodes
  for (const acc of accounts) {
    map.set(acc.id, { ...acc, children: [] });
  }

  // Link children to parents
  for (const acc of accounts) {
    const node = map.get(acc.id)!;
    if (acc.parent_id && map.has(acc.parent_id)) {
      map.get(acc.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function useChartOfAccounts() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["chart_of_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("internal_code", { ascending: true });

      if (error) throw error;
      return {
        flat: data as COA[],
        tree: buildTree(data as COA[]),
      };
    },
  });
}

export function useToggleAccountActive() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("chart_of_accounts")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
    },
  });
}
