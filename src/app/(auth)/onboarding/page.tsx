"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, PenLine, Compass, ArrowRight, Sparkles, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { initializeEncryption } from "@/lib/auth/encryption-manager";
import { completeOnboardingSeeds } from "@/lib/services/onboarding-seeds";
import { useAnalytics } from "@/lib/hooks/use-analytics";

/**
 * Onboarding Simplificado (P4 - Adendo v1.5 §2.1)
 *
 * Fluxo: welcome → profile → question → setup (auto) → redirect
 *
 * Fixes aplicados (Sessão 35):
 * - #1: Logo aumentada de h-10 para h-16
 * - #2: Etapa "profile" adicionada (campo nome obrigatório)
 * - #3: Timeout de 15s + feedback de progresso no setup
 */

type Step = "welcome" | "profile" | "question" | "setup";
type StartChoice = "import" | "manual" | "explore";

const SETUP_TIMEOUT_MS = 15000;

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { track } = useAnalytics();

  const [step, setStep] = useState<Step>("welcome");
  const [fullName, setFullName] = useState("");
  const [choice, setChoice] = useState<StartChoice>("import");
  const [setupProgress, setSetupProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { track("onboarding_started"); }, [track]);

  // Pre-fill name from auth metadata
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) setFullName(user.user_metadata.full_name);
    })();
  }, [supabase]);

  // ─── Setup: E2E + seeds (com timeout) ───────────────────
  const runSetup = useCallback(async () => {
    setError(null);
    setSetupProgress("Configurando segurança...");

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Configuração demorou mais que o esperado. Tente novamente.")), SETUP_TIMEOUT_MS)
    );

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada. Faça login novamente.");

      // Save name
      if (fullName.trim()) {
        setSetupProgress("Salvando seu perfil...");
        await supabase.from("users_profile").update({ full_name: fullName.trim() }).eq("id", user.id);
      }

      // E2E (non-fatal)
      setSetupProgress("Configurando segurança...");
      try {
        await Promise.race([initializeEncryption(supabase), timeout]);
      } catch {
        if (process.env.NODE_ENV === "development") console.warn("[Oniefy] E2E init skipped");
      }

      // Seeds
      setSetupProgress("Preparando categorias e plano de contas...");
      await Promise.race([completeOnboardingSeeds(supabase, user.id), timeout]);

      setSetupProgress("Pronto! Redirecionando...");
      track("onboarding_completed", { choice });
      await new Promise((r) => setTimeout(r, 400));

      router.push(choice === "import" ? "/connections" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao configurar conta.");
      setSetupProgress("");
    }
  }, [supabase, choice, fullName, router, track]);

  useEffect(() => { if (step === "setup") runSetup(); }, [step, runSetup]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Logo — FIX #1: h-10 → h-16 */}
        <div className="flex justify-center">
          <Image src="/brand/lockup-h-plum-transparent.svg" alt="Oniefy" width={280} height={80}
            className="h-16 w-auto dark:hidden" priority />
          <Image src="/brand/lockup-h-bone-transparent.svg" alt="Oniefy" width={280} height={80}
            className="hidden h-16 w-auto dark:block" priority />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-terracotta/20 bg-terracotta/10 p-3 text-sm text-terracotta">
            {error}
            <button type="button" onClick={() => { setError(null); setStep("question"); }} className="ml-2 underline">
              Tentar novamente
            </button>
          </div>
        )}

        {/* Step 1: Welcome */}
        {step === "welcome" && (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">Bem-vindo ao Oniefy</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Seu sistema de gestão patrimonial. Vamos configurar sua conta em menos de 2 minutos.
              </p>
            </div>
            <button type="button" onClick={() => setStep("profile")}
              className="flex w-full items-center justify-center gap-2 rounded-lg btn-cta px-4 py-3 text-sm font-medium text-primary-foreground">
              Iniciar <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Step 2: Profile — FIX #2 */}
        {step === "profile" && (
          <>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Como devemos te chamar?</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Seu nome será exibido no app. Você pode alterar depois em Configurações.
              </p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="onb-name" className="text-sm font-medium">Nome completo</label>
              <input id="onb-name" type="text" value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Ricardo Mendes" autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && fullName.trim()) setStep("question"); }}
                className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <button type="button" onClick={() => setStep("question")} disabled={!fullName.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg btn-cta px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">
              Continuar <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Step 3: Question */}
        {step === "question" && (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">Como você quer começar?</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Você pode mudar de ideia depois. Escolha o que faz mais sentido agora.
              </p>
            </div>
            <div className="space-y-2">
              {([
                { key: "import" as StartChoice, icon: Upload, title: "Importar extratos",
                  desc: "Suba um extrato bancário ou fatura de cartão e veja seus dados em minutos.", recommended: true },
                { key: "manual" as StartChoice, icon: PenLine, title: "Cadastrar manualmente",
                  desc: "Adicione contas e transações no seu ritmo com o guia de setup." },
                { key: "explore" as StartChoice, icon: Compass, title: "Explorar primeiro",
                  desc: "Vá direto para o app e descubra o que ele oferece." },
              ]).map((opt) => (
                <button type="button" key={opt.key} onClick={() => setChoice(opt.key)}
                  className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                    choice === opt.key ? "border-primary bg-primary/5" : "border-input hover:bg-accent"}`}>
                  <opt.icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${choice === opt.key ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${choice === opt.key ? "text-foreground" : ""}`}>{opt.title}</p>
                      {opt.recommended && (
                        <span className="flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          <Sparkles className="h-2.5 w-2.5" /> Recomendado
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setStep("setup")}
              className="flex w-full items-center justify-center gap-2 rounded-lg btn-cta px-4 py-3 text-sm font-medium text-primary-foreground">
              Continuar <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Step 4: Setup — FIX #3: timeout + progress */}
        {step === "setup" && !error && (
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Preparando sua conta</h1>
            <p className="mt-2 text-sm text-muted-foreground">{setupProgress || "Iniciando..."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
