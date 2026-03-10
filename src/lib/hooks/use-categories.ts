/**
 * Oniefy - Categories Hooks (FIN-06, FIN-07)
 *
 * React Query hooks for CRUD on categories table.
 * System categories (is_system=true) can't be deleted.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];
type CategoryType = Database["public"]["Enums"]["category_type"];

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  income: "Receita",
  expense: "Despesa",
};

// Lucide icon names available in the seed
export const CATEGORY_ICONS = [
  "banknote", "laptop", "trending-up", "gift", "building", "circle-dot",
  "utensils", "home", "car", "heart-pulse", "graduation-cap", "gamepad-2",
  "shirt", "wifi", "landmark", "shopping-cart", "plane", "music",
  "baby", "dog", "scissors", "wrench", "book", "coffee",
  "umbrella", "zap", "piggy-bank", "receipt", "wallet", "credit-card",
];

export const CATEGORY_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#22C55E", "#10B981", "#14B8A6",
  "#0EA5E9", "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7", "#EC4899",
  "#F43F5E", "#DC2626", "#6B7280",
];

// ─── Queries ────────────────────────────────────────────────

export function useCategories(type?: CategoryType) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["categories", type ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("categories")
        .select("*")
        .order("type", { ascending: true })
        .order("name", { ascending: true });

      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Category[];
    },
  });
}

// ─── Mutations ──────────────────────────────────────────────

export function useCreateCategory() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<CategoryInsert, "user_id">
    ) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase
        .from("categories")
        .insert({ ...input, user_id: user.id, is_system: false })
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CategoryUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .eq("is_system", false); // Safety: can't delete system categories

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
