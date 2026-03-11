"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/client";
import { initializeEncryption } from "@/lib/auth/encryption-manager";
import { enrollTotp, verifyTotpEnrollment } from "@/lib/auth/mfa";
import type { MfaEnrollResult } from "@/lib/auth/mfa";

type Step = "welcome" | "currency" | "security" | "mfa_enroll" | "mfa_verify" | "categories" | "done";

const STEPS: Step[] = ["welcome", "currency", "security", "mfa_enroll", "mfa_verify", "categories", "done"];

const CURRENCIES = [
  { code: "BRL", label: "Real brasileiro (R$)" },
  { code: "USD", label: "Dólar americano (US$)" },
  { code: "EUR", label: "Euro (€)" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("welcome");
  const [currency, setCurrency] = useState("BRL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MFA state
  const [mfaData, setMfaData] = useState<MfaEnrollResult | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  // ─── Step handlers ────────────────────────────────────────

  async function handleCurrency() {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Sessão expirada."); setLoading(false); return; }

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
      // Generate and store DEK
      await initializeEncryption(supabase);
      setStep("mfa_enroll");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao configurar criptografia.");
    } finally {
      setLoading(false);
    }
  }

  // Start security step automatically
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

  // Start MFA enrollment automatically
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      // 1. Create default categories (receitas/despesas)
      const { error: catError } = await supabase.rpc("create_default_categories", {
        p_user_id: user.id,
      });
      if (catError) {
        console.warn("[Oniefy] Category seed:", catError.message);
      }

      // 2. Create default chart of accounts (111 contas contábeis)
      const { error: coaError } = await supabase.rpc("create_default_chart_of_accounts", {
        p_user_id: user.id,
      });
      if (coaError) {
        console.warn("[Oniefy] Chart of accounts seed:", coaError.message);
      }

      // 3. Create default cost center ("Pessoal")
      const { error: ccError } = await supabase.rpc("create_default_cost_center", {
        p_user_id: user.id,
      });
      if (ccError) {
        console.warn("[Oniefy] Cost center seed:", ccError.message);
      }

      // Mark onboarding as completed
      const { error: updateError } = await supabase
        .from("users_profile")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

      if (updateError) throw new Error(updateError.message);

      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao configurar conta.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Auto-run categories step
  useEffect(() => {
    if (step === "categories") {
      handleCategories();
    }
  }, [step, handleCategories]);

  // Auto-redirect after done
  useEffect(() => {
    if (step === "done") {
      const timer = setTimeout(() => router.push("/dashboard"), 2000);
      return () => clearTimeout(timer);
    }
  }, [step, router]);

  // ─── Render ───────────────────────────────────────────────

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
          {(step === "security" || step === "mfa_enroll" || step === "categories") && (
            <button onClick={() => { setError(null); if (step === "security") handleSecurity(); else if (step === "mfa_enroll") handleMfaEnroll(); else handleCategories(); }}
              className="ml-2 underline">Tentar novamente</button>
          )}
        </div>
      )}

      {/* ─── Welcome ────────────────────────────────── */}
      {step === "welcome" && (
        <>
          <div className="text-center">
            <div className="flex justify-center">
              <Logo variant="lockup" height={36} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Configuração inicial em 4 etapas.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { num: "1", title: "Moeda padrão", desc: "Moeda principal dos registros financeiros" },
              { num: "2", title: "Criptografia", desc: "Chave de segurança gerada automaticamente" },
              { num: "3", title: "Autenticação 2FA", desc: "Configuração do app autenticador (obrigatório)" },
              { num: "4", title: "Dados iniciais", desc: "Categorias, plano de contas e centro de custo padrão" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{item.num}</span>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setStep("currency")}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Iniciar
          </button>
        </>
      )}

      {/* ─── Currency ───────────────────────────────── */}
      {step === "currency" && (
        <>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Moeda padrão</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Moeda principal dos registros financeiros. Pode ser alterada nas configurações.
            </p>
          </div>

          <div className="space-y-2">
            {CURRENCIES.map((c) => (
              <button key={c.code} onClick={() => setCurrency(c.code)}
                className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left text-sm transition-colors ${
                  currency === c.code ? "border-primary bg-primary/5 font-medium" : "border-input hover:bg-accent"
                }`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  currency === c.code ? "border-primary bg-primary" : "border-muted-foreground"
                }`}>
                  {currency === c.code && <span className="h-2 w-2 rounded-full bg-primary-foreground" />}
                </span>
                {c.label}
              </button>
            ))}
          </div>

          <button onClick={handleCurrency} disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
            {loading ? "Salvando" : "Continuar"}
          </button>
        </>
      )}

      {/* ─── Security (DEK generation - automatic) ── */}
      {step === "security" && !error && (
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Configurando segurança</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gerando sua chave de criptografia pessoal.
          </p>
        </div>
      )}

      {/* ─── MFA Enroll (loading) ───────────────────── */}
      {step === "mfa_enroll" && !error && (
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Preparando autenticação</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gerando QR code para seu autenticador.
          </p>
        </div>
      )}

      {/* ─── MFA Verify ─────────────────────────────── */}
      {step === "mfa_verify" && mfaData && (
        <>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Configurar 2FA</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Escaneie o QR code abaixo com seu aplicativo autenticador
              (ex: Google Authenticator, Authy, 1Password).
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="rounded-lg border bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mfaData.qrCode} alt="QR Code para MFA" className="h-48 w-48" />
            </div>
          </div>

          {/* Manual key fallback */}
          <div className="text-center">
            <button onClick={() => setShowSecret(!showSecret)}
              className="text-xs text-primary hover:underline">
              {showSecret ? "Ocultar chave manual" : "Não consegue escanear? Insira a chave manualmente"}
            </button>
            {showSecret && (
              <div className="mt-2 rounded-md border bg-muted p-3">
                <p className="font-mono text-xs tracking-widest break-all select-all">{mfaData.secret}</p>
              </div>
            )}
          </div>

          {/* Verify code */}
          <form onSubmit={handleMfaVerify} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="mfaCode" className="text-sm font-medium">
                Digite o código de 6 dígitos gerado pelo app
              </label>
              <input id="mfaCode" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                value={mfaCode} onChange={(e) => { setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(null); }}
                placeholder="000000"
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-2xl font-mono tracking-[0.5em] ring-offset-background placeholder:text-muted-foreground placeholder:tracking-[0.5em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                autoFocus />
            </div>
            <button type="submit" disabled={loading || mfaCode.length !== 6}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {loading ? "Verificando" : "Verificar e continuar"}
            </button>
          </form>

          <div className="rounded-lg border border-burnished/20 bg-burnished/10 p-3 text-xs text-burnished">
            Salve a chave do autenticador em local seguro.
            Se perder acesso ao app autenticador, você precisará dos códigos de recuperação
            para entrar na sua conta.
          </div>
        </>
      )}

      {/* ─── Categories (automatic) ─────────────────── */}
      {step === "categories" && !error && (
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Preparando sua conta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Criando categorias, plano de contas e centro de custo padrão.
          </p>
        </div>
      )}

      {/* ─── Done ────────────────────────────────────── */}
      {step === "done" && (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-verdant/15">
            <svg className="h-8 w-8 text-verdant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Configuração concluída</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu painel está pronto. Redirecionando.
          </p>
        </div>
      )}
    </>
  );
}
