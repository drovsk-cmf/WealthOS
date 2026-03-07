"use client";

import { useRouter } from "next/navigation";

/**
 * Onboarding placeholder (AUTH-05).
 * Full implementation in Fase 1:
 * - Welcome step
 * - Default currency selection
 * - Create default categories (calls create_default_categories())
 * - Generate E2E encryption key (DEK)
 * - MFA setup (TOTP)
 * - Mark onboarding_completed = true
 */
export default function OnboardingPage() {
  const router = useRouter();

  return (
    <>
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Bem-vindo ao WealthOS
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vamos configurar sua conta em poucos passos
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-sm text-muted-foreground">
          O fluxo de onboarding será implementado na Fase 1 (Auth + Segurança).
          Inclui configuração de MFA, categorias padrão e chave de criptografia.
        </p>
      </div>

      <button
        onClick={() => router.push("/dashboard")}
        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Ir para o Dashboard (provisório)
      </button>
    </>
  );
}
