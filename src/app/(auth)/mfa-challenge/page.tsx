"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { challengeAndVerify } from "@/lib/auth/mfa";
import { loadEncryptionKey } from "@/lib/auth/encryption-manager";
import { sanitizeRedirectTo } from "@/lib/utils";

export default function MfaChallengePage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Carregando</div>}>
      <MfaChallengeContent />
    </Suspense>
  );
}

function MfaChallengeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirectTo(searchParams.get("redirectTo"));
  const factorId = searchParams.get("factorId");

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) {
      setError("Fator MFA não encontrado. Faça login novamente.");
      return;
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError("Código deve ter 6 dígitos numéricos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await challengeAndVerify(supabase, factorId, code);

      // AAL2 achieved - load encryption key
      try {
        await loadEncryptionKey(supabase);
      } catch {
        // DEK load failure is non-blocking (E2E fields won't decrypt)
        if (process.env.NODE_ENV === "development") console.warn("[Oniefy] Failed to load DEK after MFA");
      }

      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao verificar código.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-info-slate/15">
          <svg className="h-8 w-8 text-info-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Verificação em dois fatores</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Digite o código de 6 dígitos do seu aplicativo autenticador.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="code" className="text-sm font-medium">Código TOTP</label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-2xl font-mono tracking-[0.5em] ring-offset-background placeholder:text-muted-foreground placeholder:tracking-[0.5em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            autoFocus
          />
        </div>

        <button type="submit" disabled={loading || code.length !== 6}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
          {loading ? "Verificando" : "Verificar"}
        </button>
      </form>

      <button type="button" onClick={handleLogout}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
        Usar outra conta
      </button>
    </>
  );
}
