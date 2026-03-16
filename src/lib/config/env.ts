/**
 * Oniefy - Environment Variable Validation
 *
 * Called at module scope in server.ts and middleware.ts to fail fast
 * with a clear error message if required env vars are missing.
 */

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const requiredServer = [
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export function validateEnv(): void {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `[Oniefy] Variáveis de ambiente obrigatórias não configuradas: ${missing.join(", ")}. ` +
      `Verifique seu arquivo .env.local.`
    );
  }
}

export function validateServerEnv(): void {
  validateEnv();
  const missing = requiredServer.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `[Oniefy] Variáveis de ambiente do servidor não configuradas: ${missing.join(", ")}. ` +
      `Verifique seu arquivo .env.local.`
    );
  }
}
