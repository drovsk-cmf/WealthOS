"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { initializeEncryption } from "@/lib/auth/encryption-manager";
import { enrollTotp, verifyTotpEnrollment } from "@/lib/auth/mfa";
import { completeOnboardingSeeds } from "@/lib/services/onboarding-seeds";
import { useAnalytics } from "@/lib/hooks/use-analytics";
import {
  RouteChoiceStep,
  RouteManualStep,
  RouteSnapshotStep,
  CelebrationStep,
} from "@/components/onboarding";
import type { OnboardingRoute } from "@/components/onboarding";
import type { MfaEnrollResult } from "@/lib/auth/mfa";

/**
 * Onboarding Wizard (AUTH-05 + UX-H1-02)
 *
 * Steps 1-7: Original setup (currency, encryption, MFA, seeds)
 * Steps 8-10 (UX-H1-02): Route choice + execution + celebration
 *
 * After the "categories" step seeds are complete, onboarding_completed is
 * marked true in the DB. Steps 8-10 are additive: if the user closes the
 * browser, they land on the dashboard with empty states (UX-H1-03).
 */

type Step =
  | "welcome"
  | "currency"
  | "security"
  | "mfa_enroll"
  | "mfa_verify"
  | "categories"
  | "route_choice"
  | "route_execution"
  | "celebration";

const STEPS: Step[] = [
  "welcome",
  "currency",
  "security",
  "mfa_enroll",
  "mfa_verify",
  "categories",
  "route_choice",
  "route_execution",
  "celebration",
];

const CURRENCIES = [
  { code: "BRL", label: "Real brasileiro (R$)" },
  { code: "USD", label: "Dólar americano (US$)" },
  { code: "EUR", label: "Euro (€)" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { track } = useAnalytics();

  const [step, setStep] = useState<Step>("welcome");
  const [currency, setCurrency] = useState("BRL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MFA state
  const [mfaData, setMfaData] = useState<MfaEnrollResult | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  // UX-H1-02: Route state
  const [selectedRoute, setSelectedRoute] = useState<OnboardingRoute | null>(
    null
  );
  const [routeStats, setRouteStats] = useState<{
    accounts?: number;
    transactions?: number;
    assets?: number;
  }>({});

  const stepIndex = STEPS.indexOf(step);
  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  // ─── Step handlers (Steps 1-7, unchanged) ────────────────

  async function handleCurrency() {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sessão expirada.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("users_profile")
      .update({ default_currency: currency })
      .eq("id", user.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setStep("security");
  }

  async function handleSecurity() {
    setLoading(true);
    setError(null);

    try {
      await initializeEncryption(supabase);
      setStep("mfa_enroll");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao configurar criptografia."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (step === "security") {
      handleSecurity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function handleMfaEnroll() {
    setLoading(true);
    setError(null);

    try {
      const data = await enrollTotp(supabase, "Oniefy");
      setMfaData(data);
      setStep("mfa_verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar MFA.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (step === "mfa_enroll") {
      handleMfaEnroll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function handleMfaVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaData) return;

    if (mfaCode.length !== 6 || !/^\d{6}$/.test(mfaCode)) {
      setError("Código deve ter 6 dígitos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await verifyTotpEnrollment(supabase, mfaData.factorId, mfaCode);
      setStep("categories");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código inválido.");
    } finally {
      setLoading(false);
    }
  }

  const handleCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      await completeOnboardingSeeds(supabase, user.id);

      // UX-H1-02: Proceed to route choice instead of "done"
      setStep("route_choice");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao configurar conta."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (step === "categories") {
      handleCategories();
    }
  }, [step, handleCategories]);

  // Track onboarding_started when welcome step mounts
  useEffect(() => {
    track("onboarding_started");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Step 8-10 handlers (UX-H1-02) ──────────────────────

  function handleRouteSelect(route: OnboardingRoute) {
    setSelectedRoute(route);
    setError(null);

    const isMobile = window.innerWidth < 1024;
    track("onboarding_route_chosen", {
      route,
      device: isMobile ? "mobile" : "desktop",
    });

    if (route === "import") {
      // Route B: redirect to connections page (onboarding_completed is already true)
      track("onboarding_completed", { route: "import", skipped_execution: false });
      router.push("/connections");
      return;
    }

    setStep("route_execution");
  }

  function handleRouteSkip() {
    track("onboarding_completed", { route: "skipped" });
    router.push("/dashboard");
  }

  function handleRouteManualComplete(stats: {
    accounts: number;
    transactions: number;
  }) {
    setRouteStats(stats);
    track("onboarding_completed", { route: "manual", ...stats });
    if (stats.transactions > 0) {
      track("first_transaction");
    }
    setStep("celebration");
  }

  function handleRouteSnapshotComplete(stats: { assets: number }) {
    setRouteStats(stats);
    track("onboarding_completed", { route: "snapshot", ...stats });
    setStep("celebration");
  }

  function handleGoToApp() {
    router.push("/dashboard");
  }

  // ─── Render ─────────────────────────────────────────────

  return (
    <>
      {/* Progress bar */}
      <div className="w-full">
        <div className="h-1.5 w-full rounded-full bg-muted">
          <div
            className="h-1.5 rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Passo {Math.min(stepIndex + 1, STEPS.length)} de {STEPS.length}
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
          {(step === "security" ||
            step === "mfa_enroll" ||
            step === "categories") && (
            <button type="button"
              onClick={() => {
                setError(null);
                if (step === "security") handleSecurity();
                else if (step === "mfa_enroll") handleMfaEnroll();
                else handleCategories();
              }}
              className="ml-2 underline"
            >
              Tentar novamente
            </button>
          )}
        </div>
      )}

      {/* ─── Step 1: Welcome ──────────────────────── */}
      {step === "welcome" && (
        <>
          <div className="flex flex-col items-center">
            <Image
              src="/brand/lockup-v-plum-transparent.svg"
              alt="Oniefy"
              width={1104}
              height={1019}
              className="h-40 w-auto dark:hidden"
              priority
              unoptimized
            />
            <Image
              src="/brand/lockup-v-bone-transparent.svg"
              alt="Oniefy"
              width={1104}
              height={1019}
              className="hidden h-40 w-auto dark:block"
              priority
              unoptimized
            />
            <p className="-mt-2 text-sm text-muted-foreground">
              Configuração inicial em 4 etapas.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                num: "1",
                title: "Moeda padrão",
                desc: "Moeda principal dos registros financeiros",
              },
              {
                num: "2",
                title: "Criptografia",
                desc: "Chave de segurança gerada automaticamente",
              },
              {
                num: "3",
                title: "Autenticação 2FA",
                desc: "Configuração do app autenticador (obrigatório)",
              },
              {
                num: "4",
                title: "Dados iniciais",
                desc: "Categorias, plano de contas e centro de custo padrão",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-lg border bg-card p-3"
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {item.num}
                </span>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button type="button"
            onClick={() => setStep("currency")}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Iniciar
          </button>
        </>
      )}

      {/* ─── Step 2: Currency ─────────────────────── */}
      {step === "currency" && (
        <>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Moeda padrão</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Moeda principal dos registros financeiros. Pode ser alterada nas
              configurações.
            </p>
          </div>

          <div className="space-y-2">
            {CURRENCIES.map((c) => (
              <button type="button"
                key={c.code}
                onClick={() => setCurrency(c.code)}
                className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left text-sm transition-colors ${
                  currency === c.code
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-input hover:bg-accent"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    currency === c.code
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {currency === c.code && (
                    <span className="h-2 w-2 rounded-full bg-primary-foreground" />
                  )}
                </span>
                {c.label}
              </button>
            ))}
          </div>

          <button type="button"
            onClick={handleCurrency}
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Salvando" : "Continuar"}
          </button>
        </>
      )}

      {/* ─── Step 3: Security (auto) ──────────────── */}
      {step === "security" && !error && (
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <h1 className="text-2xl font-bold tracking-tight">
            Configurando segurança
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gerando sua chave de criptografia pessoal.
          </p>
        </div>
      )}

      {/* ─── Step 4: MFA Enroll (auto) ────────────── */}
      {step === "mfa_enroll" && !error && (
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <h1 className="text-2xl font-bold tracking-tight">
            Preparando autenticação
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gerando QR code para seu autenticador.
          </p>
          <button type="button"
            onClick={() => setStep("categories")}
            className="mt-4 text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Configurar depois
          </button>
        </div>
      )}

      {/* ─── Step 5: MFA Verify ───────────────────── */}
      {step === "mfa_verify" && mfaData && (
        <>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              Configurar 2FA
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Escaneie o QR code abaixo com seu aplicativo autenticador (ex:
              Google Authenticator, Authy, 1Password).
            </p>
          </div>

          <div className="flex justify-center">
            <div className="rounded-lg border bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mfaData.qrCode}
                alt="QR Code para MFA"
                className="h-48 w-48"
              />
            </div>
          </div>

          <div className="text-center">
            <button type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="text-xs text-primary hover:underline"
            >
              {showSecret
                ? "Ocultar chave manual"
                : "Não consegue escanear? Insira a chave manualmente"}
            </button>
            {showSecret && (
              <div className="mt-2 rounded-md border bg-muted p-3">
                <p className="break-all font-mono text-xs tracking-widest select-all">
                  {mfaData.secret}
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleMfaVerify} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="mfaCode" className="text-sm font-medium">
                Digite o código de 6 dígitos gerado pelo app
              </label>
              <input
                id="mfaCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => {
                  setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setError(null);
                }}
                placeholder="000000"
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-2xl font-mono tracking-[0.5em] ring-offset-background placeholder:text-muted-foreground placeholder:tracking-[0.5em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || mfaCode.length !== 6}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Verificando" : "Verificar e continuar"}
            </button>
          </form>

          <div className="rounded-lg border border-burnished/20 bg-burnished/10 p-3 text-xs text-burnished">
            Salve a chave do autenticador em local seguro. Se perder acesso ao
            app autenticador, você precisará dos códigos de recuperação para
            entrar na sua conta.
          </div>

          <button type="button"
            onClick={() => setStep("categories")}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Configurar depois
          </button>
        </>
      )}

      {/* ─── Step 6: Categories (auto) ────────────── */}
      {step === "categories" && !error && (
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <h1 className="text-2xl font-bold tracking-tight">
            Preparando sua conta
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Criando categorias, plano de contas e centro de custo padrão.
          </p>
        </div>
      )}

      {/* ─── Step 8: Route Choice (UX-H1-02) ─────── */}
      {step === "route_choice" && (
        <RouteChoiceStep
          onSelect={handleRouteSelect}
          onSkip={handleRouteSkip}
        />
      )}

      {/* ─── Step 9: Route Execution (UX-H1-02) ──── */}
      {step === "route_execution" && selectedRoute === "manual" && (
        <RouteManualStep onComplete={handleRouteManualComplete} />
      )}

      {step === "route_execution" && selectedRoute === "snapshot" && (
        <RouteSnapshotStep onComplete={handleRouteSnapshotComplete} />
      )}

      {/* ─── Step 10: Celebration (UX-H1-02) ─────── */}
      {step === "celebration" && (
        <CelebrationStep
          route={selectedRoute}
          stats={routeStats}
          onGoToApp={handleGoToApp}
        />
      )}
    </>
  );
}
