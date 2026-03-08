/**
 * WealthOS - Encryption Manager
 *
 * Gerencia o ciclo de vida da DEK (Data Encryption Key):
 * - Onboarding: gera DEK, deriva KEK do JWT, armazena encrypted_dek
 * - Login: busca encrypted_dek, deriva KEK, decripta DEK para memória
 * - Logout/Timeout: limpa DEK da memória
 * - Refresh: re-encripta DEK com nova KEK quando JWT rotaciona
 *
 * Ref: Adendo v1.1, seção 3.2-3.5
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateDEK,
  deriveKEK,
  wrapDEK,
  unwrapDEK,
} from "@/lib/crypto/index";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

// In-memory DEK reference (cleared on logout/timeout)
let activeDEK: CryptoKey | null = null;

// Salt for HKDF (fixed per-app, not secret)
const HKDF_SALT = new TextEncoder().encode("wealthos-kek-salt-v1");

/**
 * Gera e armazena uma nova DEK durante o onboarding.
 * Passo: gera DEK → deriva KEK do JWT → wrap DEK → salva no profile.
 */
export async function initializeEncryption(
  supabase: AnySupabaseClient
): Promise<void> {
  // 1. Get current session JWT
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Sessão não encontrada. Faça login novamente.");
  }

  // 2. Generate fresh DEK
  const dek = await generateDEK();

  // 3. Derive KEK from JWT
  const kek = await deriveKEK(session.access_token, HKDF_SALT);

  // 4. Wrap (encrypt) DEK with KEK
  const { encrypted, iv } = await wrapDEK(dek, kek);

  // 5. Store encrypted DEK in users_profile
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não encontrado.");

  const { error } = await supabase
    .from("users_profile")
    .update({
      encryption_key_encrypted: encrypted,
      encryption_key_iv: iv,
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(`Erro ao salvar chave de criptografia: ${error.message}`);
  }

  // 6. Keep DEK in memory
  activeDEK = dek;
}

/**
 * Carrega e decripta a DEK na memória após login.
 */
export async function loadEncryptionKey(
  supabase: AnySupabaseClient
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("users_profile")
    .select("encryption_key_encrypted, encryption_key_iv")
    .eq("id", user.id)
    .single();

  if (!profile?.encryption_key_encrypted || !profile?.encryption_key_iv) {
    // DEK not yet initialized (should not happen after onboarding)
    return;
  }

  const kek = await deriveKEK(session.access_token, HKDF_SALT);
  activeDEK = await unwrapDEK(
    profile.encryption_key_encrypted,
    profile.encryption_key_iv,
    kek
  );
}

/**
 * Re-encripta a DEK quando o JWT é rotacionado (refresh).
 */
export async function rotateEncryptionKey(
  supabase: AnySupabaseClient,
  newAccessToken: string
): Promise<void> {
  if (!activeDEK) return;

  const kek = await deriveKEK(newAccessToken, HKDF_SALT);
  const { encrypted, iv } = await wrapDEK(activeDEK, kek);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("users_profile")
    .update({
      encryption_key_encrypted: encrypted,
      encryption_key_iv: iv,
    })
    .eq("id", user.id);
}

/**
 * Retorna a DEK ativa (em memória).
 * Null se não estiver carregada.
 */
export function getActiveDEK(): CryptoKey | null {
  return activeDEK;
}

/**
 * Limpa a DEK da memória (logout/timeout).
 */
export function clearEncryptionKey(): void {
  activeDEK = null;
}
