/**
 * Oniefy - Bank Institutions Hook
 *
 * Provides lookup for bank_institutions reference table.
 * Used in account form for bank selection.
 *
 * Note: bank_institutions added in migration 065, not yet in
 * generated database.ts. Uses explicit type cast.
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface BankInstitution {
  id: string;
  compe_code: string;
  ispb_code: string | null;
  name: string;
  short_name: string;
}

export function useBankInstitutions() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["bank_institutions"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("bank_institutions")
        .select("id, compe_code, ispb_code, name, short_name")
        .eq("is_active", true)
        .order("short_name");

      if (error) throw error;
      return (data ?? []) as BankInstitution[];
    },
    staleTime: 1000 * 60 * 60,
  });
}
