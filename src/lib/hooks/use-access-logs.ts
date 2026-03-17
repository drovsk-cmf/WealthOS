"use client";

/**
 * Access logs hook (Spec v1 §3.7)
 *
 * Logs user actions for audit trail. Auto-cleaned after 90 days.
 * Actions: login, logout, export_data, request_deletion, mfa_enroll,
 *          mfa_unenroll, password_change, biometric_enable, biometric_disable
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";

export interface AccessLog {
  id: string;
  user_id: string;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Json;
  created_at: string;
}

/** Log an access event (fire-and-forget, no UI feedback) */
export function useLogAccess() {
  return useMutation({
    mutationFn: async ({
      action,
      metadata = {},
    }: {
      action: string;
      metadata?: Record<string, Json | undefined>;
    }) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // silently skip if not authenticated

      await supabase.from("access_logs").insert({
        user_id: user.id,
        action,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        metadata,
      });
    },
    // Fire-and-forget: never block the UI
    onError: () => {}, // swallow errors silently
  });
}

/** Read access logs for the current user (settings/security page) */
export function useAccessLogs(limit: number = 50) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["access_logs", limit],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<AccessLog[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase
        .from("access_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as AccessLog[];
    },
  });
}
