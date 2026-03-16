"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseError } from "@/lib/utils/error-messages";
import { loginSchema } from "@/lib/validations/auth";
import { getAssuranceLevel, getMfaStatus } from "@/lib/auth/mfa";
import { sanitizeRedirectTo } from "@/lib/utils";

const TIMEOUT_MESSAGES: Record<string, string> = {
  timeout: "Sua sessão expirou por inatividade. Faça login novamente.",
  auth_callback_failed: "Falha na autenticação. Tente novamente.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Carregando</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirectTo(searchParams.get("redirectTo"));
  const reason = searchParams.get("reason") || searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handlePostLogin() {
    // Check if MFA is enrolled and needs verification
    const { status, factorId } = await getMfaStatus(supabase);

    if (status === "enrolled_verified" && factorId) {
      // MFA enrolled - check current assurance level
      const { currentLevel, nextLevel } = await getAssuranceLevel(supabase);

      if (currentLevel === "aal1" && nextLevel === "aal2") {
        // Need MFA challenge
        router.push(`/mfa-challenge?redirectTo=${encodeURIComponent(redirectTo)}&factorId=${factorId}`);
        return;
      }
    }

    // No MFA or already AAL2 - proceed
    router.push(redirectTo);
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      setLoading(false);
      return;
    }

    // Q3: Server-side login proxy (real rate limiting)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.status === 429) {
        const data = await res.json();
        setError(data.error || "Muitas tentativas. Aguarde alguns minutos.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao fazer login.");
        setLoading(false);
        return;
      }

      // Session cookies set by server. Refresh client to pick them up.
      await supabase.auth.getSession();
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
      return;
    }

    await handlePostLogin();
    setLoading(false);
  }

  async function handleOAuthLogin(provider: "google" | "apple") {
    setLoading(true);
    setError(null);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (oauthError) {
      setError(translateSupabaseError(oauthError.message));
      setLoading(false);
    }
    // OAuth redirects away - loading stays true
  }

  return (
    <>
      <div className="flex flex-col items-center">
        {/* Light mode */}
        <Image
          src="/brand/lockup-v-plum-transparent.svg"
          alt="Oniefy"
          width={1104}
          height={1019}
          className="h-40 w-auto dark:hidden"
          priority
          unoptimized
        />
        {/* Dark mode */}
        <Image
          src="/brand/lockup-v-bone-transparent.svg"
          alt="Oniefy"
          width={1104}
          height={1019}
          className="hidden h-40 w-auto dark:block"
          priority
          unoptimized
        />
      </div>

      {/* Session timeout / callback error messages */}
      {reason && TIMEOUT_MESSAGES[reason] && (
        <div className="rounded-md border border-burnished/30 bg-burnished/10 p-3 text-sm text-burnished">
          {TIMEOUT_MESSAGES[reason]}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* OAuth buttons */}
      {/* Apple Sign-In hidden until Apple Developer Account is configured (guideline 4.8 applies only to App Store) */}
      <div className="space-y-3">
        <button type="button"
          onClick={() => handleOAuthLogin("google")}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continuar com Google
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">ou com email</span>
        </div>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required aria-required="true" placeholder="seu@email.com"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">Senha</label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">Esqueceu a senha?</Link>
          </div>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required aria-required="true"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
          {loading ? "Entrando" : "Entrar"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Não tem conta?{" "}
        <Link href="/register" className="font-medium text-primary underline">Criar conta</Link>
      </p>
    </>
  );
}
