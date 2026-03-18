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
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { passwordSchema } from "@/lib/validations/auth";

const CURRENCIES = [
  { code: "BRL", label: "Real (R$)" },
  { code: "USD", label: "Dólar (US$)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "Libra (£)" },
] as const;

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

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("users_profile")
        .select("full_name, default_currency")
        .eq("id", user.id)
        .single();

      if (data) {
        setFullName(data.full_name ?? "");
        setCurrency(data.default_currency ?? "BRL");
      }
      setLoading(false);
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
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
          className="rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
        >
          {passwordSaving ? "Alterando..." : "Alterar senha"}
        </button>
      </div>
    </div>
  );
}
