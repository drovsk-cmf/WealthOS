/**
 * useAnalytics - UX-H1-07
 *
 * Fire-and-forget event tracking via Supabase RPC.
 * Events are append-only. No blocking, no error bubbling to UI.
 *
 * Minimum events (defined in strategy doc):
 * - onboarding_started
 * - onboarding_route_chosen
 * - onboarding_completed
 * - first_transaction
 * - import_completed
 * - dashboard_viewed
 */

import { useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type EventName =
  | "onboarding_started"
  | "onboarding_route_chosen"
  | "onboarding_completed"
  | "first_transaction"
  | "import_completed"
  | "dashboard_viewed"
  | "transaction_created"
  | "import_started"
  | "budget_created"
  | "asset_created"
  | "settings_viewed"
  | string; // extensible for future events

export function useAnalytics() {
  const supabase = createClient();
  const pending = useRef(false);

  const track = useCallback(
    async (eventName: EventName, properties: Record<string, unknown> = {}) => {
      // Fire-and-forget: no await in calling code, no error propagation
      try {
        await supabase.rpc("track_event", {
          p_event_name: eventName,
          p_properties: properties as unknown as Record<string, never>,
        });
      } catch {
        // Silent fail - analytics should never break the app
        if (process.env.NODE_ENV === "development") {
          console.warn(`[Analytics] Failed to track "${eventName}"`);
        }
      }
    },
    [supabase]
  );

  /**
   * Track dashboard_viewed once per session (not on every re-render).
   * Call this in the Dashboard page useEffect.
   */
  const trackDashboardView = useCallback(() => {
    if (pending.current) return;
    pending.current = true;
    track("dashboard_viewed");
  }, [track]);

  return { track, trackDashboardView };
}
