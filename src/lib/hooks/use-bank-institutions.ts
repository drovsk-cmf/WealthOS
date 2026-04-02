/**
 * Oniefy - Bank Institutions Hook
 *
 * Provides lookup for bank_institutions reference table.
 * Used in account form for bank selection.
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
      const { data, error } = await supabase
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
