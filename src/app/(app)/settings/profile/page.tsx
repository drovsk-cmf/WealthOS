"use client";

/**
 * Oniefy - Profile Settings (CFG-01, CFG-02, CFG-03)
 *
 * CFG-01: Editar perfil (nome completo)
 * CFG-02: Alterar senha
 * CFG-03: Moeda padrão
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { passwordSchema } from "@/lib/validations/auth";
import { getActiveDEK } from "@/lib/auth/encryption-manager";
import { encryptField, decryptField } from "@/lib/crypto";

const CURRENCIES = [
  { code: "BRL", label: "Real (R$)" },
  { code: "USD", label: "Dólar (US$)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "Libra (£)" },
] as const;

/** Format raw digits as ###.###.###-## */
function formatCpfDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Basic CPF validation (11 digits + check digits) */
function isValidCpf(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false; // All same digit
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(digits[i]) * (len + 1 - i);
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };
  return calc(9) === Number(digits[9]) && calc(10) === Number(digits[10]);
}

export default function ProfileSettingsPage() {
  const supabase = createClient();

  // Profile state
  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState("BRL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // CPF state (L3 LGPD)
  const [cpf, setCpf] = useState("");
  const [cpfConsent, setCpfConsent] = useState(false);
  const [cpfSaving, setCpfSaving] = useState(false);
  const [cpfMessage, setCpfMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [hasDEK, setHasDEK] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("users_profile")
        .select("full_name, default_currency, cpf_encrypted")
        .eq("id", user.id)
        .single();

      if (data) {
        setFullName(data.full_name ?? "");
        setCurrency(data.default_currency ?? "BRL");

        // Decrypt CPF if available
        const dek = getActiveDEK();
        setHasDEK(!!dek);
        if (dek && data.cpf_encrypted) {
          try {
            const plain = await decryptField(data.cpf_encrypted, dek);
            setCpf(formatCpfDisplay(plain));
            setCpfConsent(true); // Already consented if CPF exists
          } catch {
            setCpf("");
          }
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase]);

  // ─── CFG-01 + CFG-03: Save profile ────────────────────────
  async function handleSaveProfile() {
    setSaving(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const trimmedName = fullName.trim();
      if (trimmedName.length < 2) {
        setMessage({ type: "error", text: "Nome deve ter pelo menos 2 caracteres." });
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("users_profile")
        .update({
          full_name: trimmedName,
          default_currency: currency,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Also update auth metadata for display name
      await supabase.auth.updateUser({
        data: { full_name: trimmedName },
      });

      setMessage({ type: "success", text: "Perfil atualizado." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Erro ao salvar perfil.",
      });
    } finally {
      setSaving(false);
    }
  }

  // ─── CFG-02: Change password ───────────────────────────────
  async function handleChangePassword() {
    setPasswordSaving(true);
    setPasswordMessage(null);

    try {
      if (newPassword !== confirmPassword) {
        setPasswordMessage({ type: "error", text: "As senhas não coincidem." });
        setPasswordSaving(false);
        return;
      }

      const validation = passwordSchema.safeParse(newPassword);
      if (!validation.success) {
        const firstIssue = validation.error.issues[0]?.message ?? "Senha inválida.";
        setPasswordMessage({ type: "error", text: firstIssue });
        setPasswordSaving(false);
        return;
      }

      // Supabase updateUser for password change
      // Note: Supabase requires the user to be recently authenticated
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage({ type: "success", text: "Senha alterada." });
    } catch (err) {
      setPasswordMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Erro ao alterar senha.",
      });
    } finally {
      setPasswordSaving(false);
    }
  }

  // ─── L3 LGPD: Save CPF (encrypted) ─────────────────────────
  async function handleSaveCpf() {
    setCpfSaving(true);
    setCpfMessage(null);

    const digits = cpf.replace(/\D/g, "");

    // Allow clearing CPF (revoke consent)
    if (!digits) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Sessão expirada.");
        await supabase.from("users_profile").update({ cpf_encrypted: null }).eq("id", user.id);
        setCpfConsent(false);
        setCpfMessage({ type: "success", text: "CPF removido." });
      } catch (err) {
        setCpfMessage({ type: "error", text: err instanceof Error ? err.message : "Erro ao remover CPF." });
      } finally {
        setCpfSaving(false);
      }
      return;
    }

    if (!cpfConsent) {
      setCpfMessage({ type: "error", text: "Marque o consentimento para salvar o CPF." });
      setCpfSaving(false);
      return;
    }

    if (!isValidCpf(digits)) {
      setCpfMessage({ type: "error", text: "CPF inválido. Verifique os dígitos." });
      setCpfSaving(false);
      return;
    }

    const dek = getActiveDEK();
    if (!dek) {
      setCpfMessage({ type: "error", text: "Chave de criptografia indisponível. Faça login novamente." });
      setCpfSaving(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const encrypted = await encryptField(digits, dek);
      await supabase.from("users_profile").update({ cpf_encrypted: encrypted }).eq("id", user.id);
      setCpfMessage({ type: "success", text: "CPF salvo com criptografia." });
    } catch (err) {
      setCpfMessage({ type: "error", text: err instanceof Error ? err.message : "Erro ao salvar CPF." });
    } finally {
      setCpfSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
      </div>

      {/* ═══ CFG-01 + CFG-03: Profile form ═══ */}
      <div className="space-y-4 rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold">Dados pessoais</h2>

        {message && (
          <div className={`rounded-md border p-3 text-sm ${
            message.type === "success"
              ? "border-verdant/20 bg-verdant/10 text-verdant"
              : "border-destructive/50 bg-destructive/10 text-destructive"
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Nome completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Moeda padrão
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              aria-label="Moeda padrão"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="button"
          onClick={handleSaveProfile}
          disabled={saving}
          className="flex items-center gap-2 rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </button>
      </div>

      {/* ═══ CFG-02: Password change ═══ */}
      <div className="space-y-4 rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold">Alterar senha</h2>
        <p className="text-xs text-muted-foreground">
          Mínimo 12 caracteres, com maiúscula, minúscula e número.
        </p>

        {passwordMessage && (
          <div className={`rounded-md border p-3 text-sm ${
            passwordMessage.type === "success"
              ? "border-verdant/20 bg-verdant/10 text-verdant"
              : "border-destructive/50 bg-destructive/10 text-destructive"
          }`}>
            {passwordMessage.text}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Nova senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Nova senha"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Confirmar nova senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Repita a nova senha"
            />
          </div>
        </div>

        <button type="button"
          onClick={handleChangePassword}
          disabled={passwordSaving || !newPassword || !confirmPassword}
          className="rounded-md btn-alive border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
        >
          {passwordSaving ? "Alterando..." : "Alterar senha"}
        </button>
      </div>

      {/* ═══ L3 LGPD: CPF (criptografado) ═══ */}
      <div className="space-y-4 rounded-lg border bg-card p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-verdant" />
          <h2 className="text-sm font-semibold">CPF</h2>
        </div>

        {!hasDEK && (
          <p className="text-xs text-muted-foreground">
            Chave de criptografia não carregada. Faça login novamente para gerenciar o CPF.
          </p>
        )}

        {hasDEK && (
          <>
            <p className="text-xs text-muted-foreground">
              Armazenado com criptografia AES-256 no seu dispositivo. Usado para consolidação fiscal (IRPF).
            </p>

            {cpfMessage && (
              <div className={`rounded-md border p-3 text-sm ${
                cpfMessage.type === "success"
                  ? "border-verdant/20 bg-verdant/10 text-verdant"
                  : "border-destructive/50 bg-destructive/10 text-destructive"
              }`}>
                {cpfMessage.text}
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                CPF
              </label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatCpfDisplay(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                inputMode="numeric"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm tabular-nums"
              />
            </div>

            <label className="flex items-start gap-3 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                checked={cpfConsent}
                onChange={(e) => setCpfConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input"
              />
              <span className="text-xs text-muted-foreground">
                Autorizo o armazenamento criptografado do CPF para fins de declaração fiscal.
                Posso revogar a qualquer momento limpando o campo acima.
              </span>
            </label>

            <div className="flex gap-2">
              <button type="button"
                onClick={handleSaveCpf}
                disabled={cpfSaving}
                className="flex items-center gap-2 rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {cpfSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar CPF
              </button>
              {cpf && (
                <button type="button"
                  onClick={() => { setCpf(""); setCpfConsent(false); handleSaveCpf(); }}
                  disabled={cpfSaving}
                  className="rounded-md border px-4 py-2 text-sm text-muted-foreground hover:text-foreground btn-alive"
                >
                  Remover
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
