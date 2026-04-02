/**
 * Oniefy - IRPF Deductions Hook (E29)
 *
 * Fetches consolidated health + education deductions for IRPF.
 * Uses RPC get_irpf_deductions (aggregates by dirpf_group and family member).
 *
 * Health: dedução ilimitada no IRPF
 * Education: dedução limitada (~R$ 3.561,50/pessoa em 2025)
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getCachedUserId } from "@/lib/supabase/cached-auth";

export interface IRPFDeductionGroup {
  total: number;
  limit: number | null;
  by_member: Record<string, number>;
}

export interface IRPFDeductions {
  year: number;
  health: IRPFDeductionGroup;
  education: IRPFDeductionGroup;
}

export function useIRPFDeductions(year?: number) {
  const supabase = createClient();
  const targetYear = year ?? new Date().getFullYear();

  return useQuery<IRPFDeductions>({
    queryKey: ["irpf_deductions", targetYear],
    staleTime: 1000 * 60 * 10, // 10 min
    queryFn: async () => {
      const userId = await getCachedUserId(supabase);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)(
        "get_irpf_deductions",
        { p_user_id: userId, p_year: targetYear }
      );

      if (error) throw error;
      return (data ?? {
        year: targetYear,
        health: { total: 0, limit: null, by_member: {} },
        education: { total: 0, limit: 3561.50, by_member: {} },
      }) as IRPFDeductions;
    },
  });
}
