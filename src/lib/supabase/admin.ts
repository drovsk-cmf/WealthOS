/**
 * Supabase Admin Client (server-side only)
 *
 * Uses the service role key for operations that bypass RLS.
 * Only for use in API routes (src/app/api/) and cron jobs.
 * NEVER import this in client components or pages.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const url = process.env.NEXT_PUBLIC_ONIEFY_DB_URL ?? "";
const key = process.env.ONIEFY_DB_SECRET ?? "";

export function createAdminClient() {
  if (!url || !key) {
    throw new Error("Missing ONIEFY_DB_URL or ONIEFY_DB_SECRET");
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
