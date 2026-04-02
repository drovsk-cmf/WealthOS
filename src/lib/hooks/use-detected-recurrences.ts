/**
 * Oniefy - Detected Recurrences Hook (E26)
 *
 * Fetches last 6 months of transactions, runs the detector,
 * and returns candidates for the user to confirm or dismiss.
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getCachedUserId } from "@/lib/supabase/cached-auth";
import {
  detectRecurrences,
  type DetectedRecurrence,
} from "@/lib/services/recurrence-detector";

/**
 * Detect recurring patterns in transaction history.
 * Runs client-side on last 6 months of expense transactions.
 * Excludes transactions already linked to recurrences.
 */
export function useDetectedRecurrences() {
  const supabase = createClient();

  return useQuery<DetectedRecurrence[]>({
    queryKey: ["detected_recurrences"],
    staleTime: 1000 * 60 * 30, // 30 min (expensive scan)
    queryFn: async () => {
      const userId = await getCachedUserId(supabase);

      // Fetch last 6 months of transactions
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const sinceDate = sixMonthsAgo.toISOString().slice(0, 10);

      const { data: txs, error: txError } = await supabase
        .from("transactions")
        .select("id, description, amount, date, account_id, category_id, recurrence_id")
        .eq("user_id", userId)
        .gte("date", sinceDate)
        .lt("amount", 0) // expenses only
        .order("date", { ascending: true });

      if (txError) throw txError;

      // Fetch existing recurrence descriptions to exclude
      const { data: recs, error: recError } = await supabase
        .from("recurrences")
        .select("template_transaction")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (recError) throw recError;

      const existingDescriptions = (recs ?? [])
        .map((r) => {
          const tmpl = r.template_transaction as Record<string, unknown> | null;
          return (tmpl?.description as string) ?? "";
        })
        .filter((d) => d.length > 0);

      // Run detection
      return detectRecurrences(
        (txs ?? []).map((t) => ({
          id: t.id,
          description: t.description,
          amount: Number(t.amount),
          date: t.date,
          account_id: t.account_id,
          category_id: t.category_id,
          recurrence_id: t.recurrence_id,
        })),
        existingDescriptions
      );
    },
  });
}
