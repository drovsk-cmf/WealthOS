/**
 * Oniefy - MFA Helpers
 *
 * Encapsula a Supabase MFA API (TOTP) para uso nos componentes.
 * Ref: AUTH-04 (MFA obrigatório), Spec v1.0 seção 3.1.1
 *
 * Fluxo:
 *  1. Onboarding: enroll → verify → AAL2 ativo
 *  2. Login: signIn (AAL1) → challenge → verify → AAL2
 */

import type { SupabaseClient } from "@supabase/supabase-js";

type AnySupabaseClient = SupabaseClient<any, any, any>;

export type MfaStatus = "not_enrolled" | "enrolled_unverified" | "enrolled_verified";

export interface MfaEnrollResult {
  factorId: string;
  qrCode: string; // SVG data URI
  secret: string; // Manual entry key
  uri: string;    // otpauth:// URI
}

/**
 * Verifica o status atual de MFA do usuário.
 */
export async function getMfaStatus(
  supabase: AnySupabaseClient
): Promise<{ status: MfaStatus; factorId: string | null }> {
  const { data, error } = await supabase.auth.mfa.listFactors();

  if (error || !data) {
    return { status: "not_enrolled", factorId: null };
  }

  // TOTP factors only
  const totpFactors = data.totp ?? [];

  // Verified factor (enrolled and confirmed)
  const verified = totpFactors.find((f) => (f.status as string) === "verified");
  if (verified) {
    return { status: "enrolled_verified", factorId: verified.id };
  }

  // Unverified factor (started enrollment but didn't confirm)
  const unverified = totpFactors.find((f) => (f.status as string) === "unverified");
  if (unverified) {
    return { status: "enrolled_unverified", factorId: unverified.id };
  }

  return { status: "not_enrolled", factorId: null };
}

/**
 * Verifica o Authenticator Assurance Level atual.
 * AAL1 = password/oauth only. AAL2 = MFA verified.
 */
export async function getAssuranceLevel(
  supabase: AnySupabaseClient
): Promise<{ currentLevel: string; nextLevel: string | null }> {
  const { data, error } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (error || !data) {
    return { currentLevel: "aal1", nextLevel: null };
  }

  return {
    currentLevel: data.currentLevel ?? "aal1",
    nextLevel: data.nextLevel ?? null,
  };
}

/**
 * Inicia enrollment de TOTP.
 * Retorna QR code e secret para exibição.
 */
export async function enrollTotp(
  supabase: AnySupabaseClient,
  friendlyName: string = "Oniefy"
): Promise<MfaEnrollResult> {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName,
  });

  if (error) {
    throw new Error(`Erro ao iniciar MFA: ${error.message}`);
  }

  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  };
}

/**
 * Verifica um código TOTP durante o enrollment.
 * Após sucesso, o fator é marcado como verified.
 */
export async function verifyTotpEnrollment(
  supabase: AnySupabaseClient,
  factorId: string,
  code: string
): Promise<void> {
  // Create a challenge
  const { data: challengeData, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId });

  if (challengeError) {
    throw new Error(`Erro ao criar desafio MFA: ${challengeError.message}`);
  }

  // Verify with the code
  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeData.id,
    code,
  });

  if (verifyError) {
    throw new Error("Código inválido. Verifique e tente novamente.");
  }
}

/**
 * Executa challenge + verify para login (pós-AAL1).
 */
export async function challengeAndVerify(
  supabase: AnySupabaseClient,
  factorId: string,
  code: string
): Promise<void> {
  const { data: challengeData, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId });

  if (challengeError) {
    throw new Error(`Erro ao criar desafio MFA: ${challengeError.message}`);
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeData.id,
    code,
  });

  if (verifyError) {
    throw new Error("Código inválido. Verifique e tente novamente.");
  }
}

/**
 * Remove um fator TOTP (unenroll).
 * Usado na exclusão de conta ou reset de MFA.
 */
export async function unenrollTotp(
  supabase: AnySupabaseClient,
  factorId: string
): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) {
    throw new Error(`Erro ao remover MFA: ${error.message}`);
  }
}
