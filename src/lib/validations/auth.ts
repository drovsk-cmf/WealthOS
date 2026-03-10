/**
 * Oniefy - Auth Validation Schemas (Zod)
 *
 * Centraliza validações de todos os formulários de autenticação.
 * Ref: AUTH-01 (12+ chars, blocklist), AUTH-08 (reset password)
 */

import { z } from "zod";
import { isPasswordBlocked } from "@/lib/auth/password-blocklist";

// ─── Password Rules ─────────────────────────────────────────
// Spec: 12+ caracteres, sem senhas comuns (blocklist)
export const passwordSchema = z
  .string()
  .min(12, "Senha deve ter no mínimo 12 caracteres")
  .max(128, "Senha deve ter no máximo 128 caracteres")
  .refine((val) => /[a-z]/.test(val), {
    message: "Senha deve conter pelo menos uma letra minúscula",
  })
  .refine((val) => /[A-Z]/.test(val), {
    message: "Senha deve conter pelo menos uma letra maiúscula",
  })
  .refine((val) => /[0-9]/.test(val), {
    message: "Senha deve conter pelo menos um número",
  })
  .refine((val) => !isPasswordBlocked(val), {
    message: "Esta senha é muito comum. Escolha uma mais forte.",
  });

// ─── Register ───────────────────────────────────────────────
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome muito longo"),
    email: z.string().email("Email inválido"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Login ──────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── MFA (TOTP) ────────────────────────────────────────────
export const mfaCodeSchema = z.object({
  code: z
    .string()
    .length(6, "Código deve ter 6 dígitos")
    .regex(/^\d{6}$/, "Código deve conter apenas números"),
});

export type MfaCodeInput = z.infer<typeof mfaCodeSchema>;

// ─── Forgot Password ───────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ─── Reset Password ────────────────────────────────────────
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ─── Password Strength Meter ────────────────────────────────
export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (!isPasswordBlocked(password)) score++;

  if (score <= 2) return "weak";
  if (score <= 3) return "fair";
  if (score <= 4) return "good";
  return "strong";
}

export const STRENGTH_CONFIG: Record<
  PasswordStrength,
  { label: string; color: string; width: string }
> = {
  weak: { label: "Fraca", color: "bg-terracotta", width: "w-1/4" },
  fair: { label: "Razoável", color: "bg-burnished", width: "w-2/4" },
  good: { label: "Boa", color: "bg-burnished", width: "w-3/4" },
  strong: { label: "Forte", color: "bg-verdant", width: "w-full" },
};
