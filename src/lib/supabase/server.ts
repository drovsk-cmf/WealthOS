import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { validateEnv } from "@/lib/config/env";

// Fail fast if env vars are missing
validateEnv();

/**
 * Supabase client for Server Components and Route Handlers.
 * Uses cookies for session management (RLS-aware).
 *
 * For admin operations (bypass RLS), use createAdminClient from "@/lib/supabase/admin".
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_ONIEFY_DB_URL!,
    process.env.NEXT_PUBLIC_ONIEFY_DB_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}
