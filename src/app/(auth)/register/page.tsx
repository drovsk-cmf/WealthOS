"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  registerSchema,
  getPasswordStrength,
  STRENGTH_CONFIG,
} from "@/lib/validations/auth";
import type { RegisterInput } from "@/lib/validations/auth";

type FormErrors = Partial<Record<keyof RegisterInput, string>>;

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterInput>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const supabase = createClient();

  const passwordStrength = useMemo(
    () => (form.password ? getPasswordStrength(form.password) : null),
    [form.password]
  );
  const strengthConfig = passwordStrength
    ? STRENGTH_CONFIG[passwordStrength]
    : null;

  function updateField(field: keyof RegisterInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError(null);
  }

  function validateForm(): boolean {
    const result = registerSchema.safeParse(form);
    if (result.success) {
      setErrors({});
      return true;
    }
    const fieldErrors: FormErrors = {};
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as keyof RegisterInput;
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    });
    setErrors(fieldErrors);
    return false;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setServerError(null);

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setServerError(error.message);
      return;
    }

    setEmailSent(true);
  }

  // ─── Confirmation sent ────────────────────────────────────
  if (emailSent) {
    return (
      <>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Verifique seu email</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Enviamos um link de confirmação para{" "}
            <strong className="text-foreground">{form.email}</strong>.
            <br />
            Clique no link para ativar sua conta e começar a configuração.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Não recebeu o email?</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Verifique a pasta de spam/lixo eletrônico</li>
            <li>Confirme que digitou o email correto</li>
            <li>O link expira em 24 horas</li>
          </ul>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary underline">Voltar ao login</Link>
        </p>
      </>
    );
  }

  // ─── Registration form ────────────────────────────────────
  return (
    <>
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Criar Conta</h1>
        <p className="mt-2 text-sm text-muted-foreground">Configure seu WealthOS em poucos passos</p>
      </div>

      {serverError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4" noValidate>
        <div className="space-y-2">
          <label htmlFor="fullName" className="text-sm font-medium">Nome completo</label>
          <input id="fullName" type="text" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="Seu nome"
            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${errors.fullName ? "border-destructive" : "border-input"}`} />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="seu@email.com"
            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${errors.email ? "border-destructive" : "border-input"}`} />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">Senha</label>
          <input id="password" type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} placeholder="Mínimo 12 caracteres"
            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${errors.password ? "border-destructive" : "border-input"}`} />
          {form.password && strengthConfig && (
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div className={`h-1.5 rounded-full transition-all ${strengthConfig.color} ${strengthConfig.width}`} />
              </div>
              <p className="text-xs text-muted-foreground">Força: {strengthConfig.label}</p>
            </div>
          )}
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar senha</label>
          <input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} placeholder="Repita a senha"
            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${errors.confirmPassword ? "border-destructive" : "border-input"}`} />
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
        </div>

        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Ao criar sua conta, você concorda com nossa{" "}
        <Link href="/privacy" className="underline">Política de Privacidade</Link>.
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary underline">Entrar</Link>
      </p>
    </>
  );
}
