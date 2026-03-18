/**
 * Oniefy - Setup Journey Auto-Advance
 *
 * Fire-and-forget helper that advances a setup journey step
 * when the corresponding user action succeeds.
 *
 * Usage in mutation onSuccess:
 *   tryAdvanceJourney(queryClient, "create_accounts")
 *
 * Silent on failure (journey is optional UX, never blocks core flows).
 */

import type { QueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getCachedUserId } from "@/lib/supabase/cached-auth";
import type { Json } from "@/types/database";

/**
 * Attempt to advance a journey step. Fire-and-forget.
 * @param queryClient - React Query client to invalidate journey cache
 * @param stepKey - One of: cutoff_date, create_accounts, recurring_expenses,
 *                  import_statements, import_card_bills, categorize, create_budget
 * @param metadata - Optional metadata to attach to the completed step
 */
export async function tryAdvanceJourney(
  queryClient: QueryClient,
  stepKey: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createClient();
    const userId = await getCachedUserId(supabase);
    await supabase.rpc("advance_setup_journey", {
      p_user_id: userId,
      p_step_key: stepKey,
      p_metadata: (metadata ?? {}) as unknown as Json,
    });
    // Invalidate journey cache so the card updates
    await queryClient.invalidateQueries({ queryKey: ["setup_journey"] });
  } catch {
    // Silent: journey is optional guidance, never blocks core flows
  }
}
