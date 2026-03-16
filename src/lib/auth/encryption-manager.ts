/**
 * Oniefy - Encryption Manager
 *
 * Gerencia o ciclo de vida da DEK (Data Encryption Key):
 * - Onboarding: gera kek_material + DEK, deriva KEK, armazena tudo no profile
 * - Login: busca kek_material + encrypted_dek, deriva KEK, decripta DEK para memória
 * - Logout/Timeout: limpa DEK da memória
 *
 * KEK é derivada de kek_material (random 256 bits, estável) via HKDF.
 * Diferente do design anterior (JWT efêmero), não há necessidade de
 * re-encriptar a DEK em token refresh.
 *
 * Ref: S1 saneamento (2026-03-10), Adendo v1.1 seção 3.2-3.5
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateDEK,
  deriveKEK,
  wrapDEK,
  unwrapDEK,
} from "@/lib/crypto/index";

type AnySupabaseClient = SupabaseClient<any, any, any>;

// In-memory DEK reference (cleared on logout/timeout)
let activeDEK: CryptoKey | null = null;

// DO NOT CHANGE - changing this value breaks existing key derivation for all users
const HKDF_SALT = new TextEncoder().encode("wealthos-kek-salt-v2");

/**
 * Gera 256 bits aleatórios e retorna como base64.
 * Usado uma vez no onboarding para criar o kek_material.
 */
function generateKekMaterial(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
}

/**
 * Gera e armazena kek_material + DEK durante o onboarding.
 * Passo: gera kek_material → gera DEK → deriva KEK → wrap DEK → salva no profile.
 */
export async function initializeEncryption(
  supabase: AnySupabaseClient
): Promise<void> {
  // 1. Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não encontrado.");

  // 2. Generate stable KEK material (random 256 bits)
  const kekMaterial = generateKekMaterial();

  // 3. Generate fresh DEK
  const dek = await generateDEK();

  // 4. Derive KEK from stable material
  const kek = await deriveKEK(kekMaterial, HKDF_SALT);

  // 5. Wrap (encrypt) DEK with KEK
  const { encrypted, iv } = await wrapDEK(dek, kek);

  // 6. Store kek_material + encrypted DEK in users_profile
  const { error } = await supabase
    .from("users_profile")
    .update({
      kek_material: kekMaterial,
      encryption_key_encrypted: encrypted,
      encryption_key_iv: iv,
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(`Erro ao salvar chave de criptografia: ${error.message}`);
  }

  // 7. Keep DEK in memory
  activeDEK = dek;
}

/**
 * Carrega e decripta a DEK na memória após login.
 *
 * DT-001: NÃO re-inicializa silenciosamente. Se kek_material ou DEK
 * estiver ausente em um perfil com onboarding completo, lança
 * EncryptionKeyMissingError. O chamador decide como tratar.
 */
export class EncryptionKeyMissingError extends Error {
  constructor(reason: "kek_material" | "dek") {
    super(
      reason === "kek_material"
        ? "Chave de criptografia não encontrada. Dados encriptados anteriores podem estar inacessíveis."
        : "Chave de dados encriptados ausente. Dados anteriores podem estar inacessíveis."
    );
    this.name = "EncryptionKeyMissingError";
  }
}

export async function loadEncryptionKey(
  supabase: AnySupabaseClient
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("users_profile")
    .select("kek_material, encryption_key_encrypted, encryption_key_iv, onboarding_completed")
    .eq("id", user.id)
    .single();

  // Case 1: kek_material absent
  if (!profile?.kek_material) {
    if (!profile?.onboarding_completed) {
      // User hasn't completed onboarding yet - encryption not set up, skip silently
      return;
    }
    // Onboarding completed but kek_material missing - anomaly
    if (process.env.NODE_ENV === "development") console.error("[Oniefy] ANOMALY: kek_material missing for completed profile. Encrypted fields are irrecoverable.");
    // Re-initialize to allow user to continue, but flag it
    await initializeEncryption(supabase);
    throw new EncryptionKeyMissingError("kek_material");
  }

  // Case 2: DEK missing (shouldn't happen after onboarding)
  if (!profile.encryption_key_encrypted || !profile.encryption_key_iv) {
    if (process.env.NODE_ENV === "development") console.error("[Oniefy] ANOMALY: DEK missing for profile with kek_material.");
    await initializeEncryption(supabase);
    throw new EncryptionKeyMissingError("dek");
  }

  // Case 3: normal - derive KEK and decrypt DEK
  const kek = await deriveKEK(profile.kek_material, HKDF_SALT);
  activeDEK = await unwrapDEK(
    profile.encryption_key_encrypted,
    profile.encryption_key_iv,
    kek
  );
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
