/**
 * Oniefy - Warranties Hook (E31)
 *
 * CRUD for product warranties + status calculation.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getCachedUserId } from "@/lib/supabase/cached-auth";
import { getWarrantyStatus, type Warranty, type WarrantyStatus } from "@/lib/services/warranty-tracker";
import type { Database } from "@/types/database";

type WarrantyRow = Database["public"]["Tables"]["warranties"]["Row"];

export interface WarrantyWithStatus extends WarrantyRow {
  status: WarrantyStatus;
}

export function useWarranties() {
  const supabase = createClient();

  return useQuery<WarrantyWithStatus[]>({
    queryKey: ["warranties"],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const userId = await getCachedUserId(supabase);
      const { data, error } = await supabase
        .from("warranties")
        .select("*")
        .eq("user_id", userId)
        .order("purchase_date", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row) => {
        const w: Warranty = {
          id: row.id,
          productName: row.product_name,
          purchaseDate: row.purchase_date,
          manufacturerMonths: row.manufacturer_months,
          cardExtensionMonths: row.card_extension_months,
        };
        return { ...row, status: getWarrantyStatus(w) };
      });
    },
  });
}

export function useCreateWarranty() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: {
      product_name: string;
      purchase_date: string;
      manufacturer_months: number;
      card_extension_months: number;
      notes?: string;
    }) => {
      const userId = await getCachedUserId(supabase);
      const { error } = await supabase
        .from("warranties")
        .insert({ ...input, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warranties"] });
    },
  });
}

export function useDeleteWarranty() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const userId = await getCachedUserId(supabase);
      const { error } = await supabase
        .from("warranties")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warranties"] });
    },
  });
}
