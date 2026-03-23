"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, PenLine, Compass, ArrowRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { initializeEncryption } from "@/lib/auth/encryption-manager";
import { completeOnboardingSeeds } from "@/lib/services/onboarding-seeds";
import { useAnalytics } from "@/lib/hooks/use-analytics";

/**
 * Onboarding Simplificado (P4 - Adendo v1.5 §2.1)
 *
 * Fluxo: welcome → question → setup (auto) → redirect
 *
 * Target: valor em <2 minutos.
 * - Welcome: breve, sem lista de passos
 * - Question: "Como quer começar?" (importar recomendado)
 * - Setup: E2E encryption + seeds (silencioso, ~2s)
 * - Redirect: /connections (importar) ou /dashboard (manual/explorar)
 *
 * MFA diferido: removido do onboarding. Banner no dashboard
 * após 24h ou no primeiro acesso a dados E2E.
 * Currency: default BRL, alterável em Configurações.
 */

type Step = "welcome" | "question" | "setup" | "done";
type StartChoice = "import" | "manual" | "explore";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { track } = useAnalytics();

  const [step, setStep] = useState<Step>("welcome");
  const [choice, setChoice] = useState<StartChoice>("import");
  const [_loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track start
  useEffect(() => {
    track("onboarding_started");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Setup: E2E encryption + seeds (silencioso) ────────────
  const runSetup = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      // E2E encryption key
      try {
        await initializeEncryption(supabase);
      } catch {
        // Non-fatal: E2E is optional until first encrypted field
        if (process.env.NODE_ENV === "development")
          console.warn("[Oniefy] E2E init failed - will retry later");
      }

      // Seeds: categories + chart of accounts + cost center
      await completeOnboardingSeeds(supabase, user.id);

      track("onboarding_completed", { choice });

      // Redirect based on choice
      if (choice === "import") {
        router.push("/connections");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao configurar conta.");
      setLoading(false);
    }
  }, [supabase, choice, router, track]);

  useEffect(() => {
    if (step === "setup") {
      runSetup();
    }
  }, [step, runSetup]);

  // ─── Handle question selection ─────────────────────────────
  function handleStart() {
    setStep("setup");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/brand/lockup-h-plum-transparent.svg"
            alt="Oniefy"
            width={200}
            height={78}
            className="h-10 w-auto dark:hidden"
            priority
          />
          <Image
            src="/brand/lockup-h-bone-transparent.svg"
            alt="Oniefy"
            width={200}
            height={78}
            className="hidden h-10 w-auto dark:block"
            priority
          />
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-lg border border-terracotta/20 bg-terracotta/10 p-3 text-sm text-terracotta">
            {error}
            <button
              type="button"
              onClick={() => { setError(null); setStep("question"); }}
              className="ml-2 underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* ─── Step 1: Welcome ────────────────────────── */}
        {step === "welcome" && (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">
                Bem-vindo ao Oniefy
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Seu sistema de gestão patrimonial. Vamos configurar sua conta em menos de 2 minutos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStep("question")}
              className="flex w-full items-center justify-center gap-2 rounded-lg btn-cta px-4 py-3 text-sm font-medium text-primary-foreground"
            >
              Iniciar
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* ─── Step 2: Single question ────────────────── */}
        {step === "question" && (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">
                Como você quer começar?
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Você pode mudar de ideia depois. Escolha o que faz mais sentido agora.
              </p>
            </div>

            <div className="space-y-2">
              {([
                {
                  key: "import" as StartChoice,
                  icon: Upload,
                  title: "Importar extratos",
                  desc: "Suba um extrato bancário ou fatura de cartão e veja seus dados em minutos.",
                  recommended: true,
                },
                {
                  key: "manual" as StartChoice,
                  icon: PenLine,
                  title: "Cadastrar manualmente",
                  desc: "Adicione contas e transações no seu ritmo com o guia de setup.",
                },
                {
                  key: "explore" as StartChoice,
                  icon: Compass,
                  title: "Explorar primeiro",
                  desc: "Vá direto para o app e descubra o que ele oferece.",
                },
              ]).map((opt) => (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => setChoice(opt.key)}
                  className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                    choice === opt.key
                      ? "border-primary bg-primary/5"
                      : "border-input hover:bg-accent"
                  }`}
                >
                  <opt.icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                    choice === opt.key ? "text-primary" : "text-muted-foreground"
                  }`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${
                        choice === opt.key ? "text-foreground" : ""
                      }`}>
                        {opt.title}
                      </p>
                      {opt.recommended && (
                        <span className="flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          <Sparkles className="h-2.5 w-2.5" /> Recomendado
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {opt.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleStart}
              className="flex w-full items-center justify-center gap-2 rounded-lg btn-cta px-4 py-3 text-sm font-medium text-primary-foreground"
            >
              Continuar
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* ─── Step 3: Setup (auto) ───────────────────── */}
        {step === "setup" && !error && (
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <h1 className="text-2xl font-bold tracking-tight">
              Preparando sua conta
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Configurando segurança e dados iniciais.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
