"use client";

/**
 * Shared Access Hook (E35)
 *
 * Manage temporary read-only access tokens for accountants/advisors.
 * Tokens are scoped (currently only "tax") and expire after a configurable period.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getCachedUserId } from "@/lib/supabase/cached-auth";

export interface SharedAccessToken {
  id: string;
  token: string;
  scope: string;
  label: string | null;
  expires_at: string;
  is_revoked: boolean;
  last_accessed_at: string | null;
  access_count: number;
  created_at: string;
}

/** List active (non-revoked, non-expired) tokens for current user */
export function useSharedAccessTokens() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["shared_access_tokens"],
    staleTime: 60_000,
    queryFn: async (): Promise<SharedAccessToken[]> => {
      const userId = await getCachedUserId(supabase);
      const { data, error } = await supabase
        .from("shared_access_tokens")
        .select("*")
        .eq("user_id", userId)
        .eq("is_revoked", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as SharedAccessToken[];
    },
  });
}

/** Generate a new shared access token */
export function useCreateSharedToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      scope?: string;
      label?: string;
      expiresInDays?: number;
    }): Promise<SharedAccessToken> => {
      const supabase = createClient();
      const userId = await getCachedUserId(supabase);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays ?? 7));

      const { data, error } = await supabase
        .from("shared_access_tokens")
        .insert({
          user_id: userId,
          scope: input.scope ?? "tax",
          label: input.label ?? null,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as SharedAccessToken;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared_access_tokens"] });
    },
  });
}

/** Revoke a token */
export function useRevokeSharedToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tokenId: string) => {
      const supabase = createClient();
      const userId = await getCachedUserId(supabase);

      const { error } = await supabase
        .from("shared_access_tokens")
        .update({ is_revoked: true })
        .eq("id", tokenId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared_access_tokens"] });
    },
  });
}

/** Build the public share URL */
export function buildShareUrl(token: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "https://www.oniefy.com";
  return `${base}/share/${token}`;
}
