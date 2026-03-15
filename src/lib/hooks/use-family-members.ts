/**
 * Oniefy - Family Members Hooks
 *
 * CRUD for family_members table.
 * Each member auto-creates a linked cost_center via RPC.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type FamilyMember = Database["public"]["Tables"]["family_members"]["Row"];
type FamilyRelationship = Database["public"]["Enums"]["family_relationship"];
type FamilyRole = Database["public"]["Enums"]["family_role"];

export const RELATIONSHIP_LABELS: Record<FamilyRelationship, string> = {
  self: "Titular",
  spouse: "Cônjuge",
  child: "Filho(a)",
  parent: "Pai / Mãe",
  sibling: "Irmão(ã)",
  pet: "Pet",
  other: "Outro",
};

export const RELATIONSHIP_OPTIONS: { value: FamilyRelationship; label: string; emoji: string }[] = [
  { value: "self", label: "Titular", emoji: "👤" },
  { value: "spouse", label: "Cônjuge", emoji: "💑" },
  { value: "child", label: "Filho(a)", emoji: "👶" },
  { value: "parent", label: "Pai / Mãe", emoji: "👴" },
  { value: "sibling", label: "Irmão(ã)", emoji: "👫" },
  { value: "pet", label: "Pet", emoji: "🐾" },
  { value: "other", label: "Outro", emoji: "👤" },
];

export const ROLE_LABELS: Record<FamilyRole, string> = {
  owner: "Responsável",
  member: "Membro",
};

// ─── Queries ────────────────────────────────────────────────

export function useFamilyMembers() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["family_members"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as FamilyMember[];
    },
  });
}

// ─── Mutations ──────────────────────────────────────────────

export function useCreateFamilyMember() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      relationship: FamilyRelationship;
      role?: FamilyRole;
      birth_date?: string | null;
      is_tax_dependent?: boolean;
      avatar_emoji?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const emoji = input.avatar_emoji
        || RELATIONSHIP_OPTIONS.find((r) => r.value === input.relationship)?.emoji
        || "👤";

      const { data, error } = await supabase.rpc("create_family_member", {
        p_user_id: user.id,
        p_name: input.name,
        p_relationship: input.relationship,
        p_role: input.role || (input.relationship === "self" ? "owner" : "member"),
        p_birth_date: input.birth_date || undefined,
        p_is_tax_dependent: input.is_tax_dependent || false,
        p_avatar_emoji: emoji,
      });

      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family_members"] });
      queryClient.invalidateQueries({ queryKey: ["cost_centers"] });
    },
  });
}

export function useUpdateFamilyMember() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Pick<FamilyMember, "name" | "relationship" | "role" | "birth_date" | "is_tax_dependent" | "avatar_emoji">> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase
        .from("family_members")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      // Sync name to linked cost center
      if (updates.name && data.cost_center_id) {
        await supabase
          .from("cost_centers")
          .update({ name: updates.name })
          .eq("id", data.cost_center_id);
      }

      return data as FamilyMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family_members"] });
      queryClient.invalidateQueries({ queryKey: ["cost_centers"] });
    },
  });
}

export function useDeactivateFamilyMember() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      // Get member to find linked cost center
      const { data: member } = await supabase
        .from("family_members")
        .select("cost_center_id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      // Deactivate member
      const { error } = await supabase
        .from("family_members")
        .update({ is_active: false })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      // Deactivate linked cost center
      if (member?.cost_center_id) {
        await supabase
          .from("cost_centers")
          .update({ is_active: false })
          .eq("id", member.cost_center_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family_members"] });
      queryClient.invalidateQueries({ queryKey: ["cost_centers"] });
    },
  });
}
