/**
 * Oniefy - Onboarding Seeds
 *
 * Runs the three seed RPCs (categories, chart of accounts, cost center)
 * and marks onboarding as completed only if ALL succeed.
 *
 * Extracted from onboarding/page.tsx to comply with Next.js App Router
 * restriction on extra exports from page files, and to enable unit testing.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function completeOnboardingSeeds(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  const { error: catError } = await supabase.rpc("create_default_categories", {
    p_user_id: userId,
  });
  if (catError) {
    throw new Error(`Erro ao criar categorias padrão: ${catError.message}`);
  }

  const { error: coaError } = await supabase.rpc("create_default_chart_of_accounts", {
    p_user_id: userId,
  });
  if (coaError) {
    throw new Error(`Erro ao criar plano de contas padrão: ${coaError.message}`);
  }

  const { error: ccError } = await supabase.rpc("create_default_cost_center", {
    p_user_id: userId,
  });
  if (ccError) {
    throw new Error(`Erro ao criar centro de custo padrão: ${ccError.message}`);
  }

  const { error: updateError } = await supabase
    .from("users_profile")
    .update({ onboarding_completed: true })
    .eq("id", userId);

  if (updateError) throw new Error(updateError.message);
}
